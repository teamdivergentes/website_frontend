/**
 * Tests E2E fonctionnels — Bandeau matchs et palmarès d'équipe
 *
 * Sélecteurs basés sur match-strip.html et team-honours.html :
 *
 * match-strip.html :
 * - .match-strip                       → conteneur du bandeau
 * - .match-strip--past                 → variante « dernier résultat »
 * - .match-strip__next                 → bloc prochain match
 * - .match-strip__last                 → bloc de repli
 * - .match-strip__schedule             → échéance relative
 * - .match-strip__cta                  → lien « Regarder » (streamUrl)
 * - .match-strip__form-pill            → pastille de forme (title = date)
 *
 * team-honours.html :
 * - .team-honours                      → conteneur du bloc palmarès
 * - .team-honours__row                 → ligne de trophée
 * - .team-honours__rank                → pastille de rang
 * - .team-honours__more                → lien vers le palmarès complet
 */

import { test, expect } from '@playwright/test';

const EQUIPE = '/structure/equipes/dvg-lol-academy';

test.describe('Bandeau matchs — page d’accueil', () => {
  test('affiche le bandeau et le contraint à 900 px maximum', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const strip = page.locator('.match-strip');
    await expect(strip).toBeVisible();

    const box = await strip.boundingBox();
    expect(box).not.toBeNull();
    // Tolérance de 2 px pour les bordures et l'arrondi de rendu.
    expect(box!.width).toBeLessThanOrEqual(902);
  });

  test('affiche une échéance relative, pas une date brute', async ({ page }) => {
    await page.goto('/');

    const echeance = page.locator('.match-strip__schedule');
    await expect(echeance).toBeVisible();
    await expect(echeance).toHaveText(/AUJOURD'HUI|DEMAIN|DANS |MOINS D'UNE HEURE|,/);
  });

  test('chaque pastille de forme porte une date en infobulle', async ({ page }) => {
    await page.goto('/');

    // `locator.count()` n'attend pas — sans ce garde-fou, il peut s'exécuter avant
    // que le forkJoin (prochain match + résultats) ait résolu et que le composant
    // se soit re-rendu, ce qui fait échouer le test par pure course, pas par régression.
    await expect(page.locator('.match-strip__next')).toBeVisible();

    const pastilles = page.locator('.match-strip__form-pill');
    const total = await pastilles.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      await expect(pastilles.nth(i)).toHaveAttribute('title', /\d{4}/);
    }
  });
});

test.describe('Page équipe — palmarès puis matchs', () => {
  test('affiche le bloc palmarès avant le bloc matchs', async ({ page }) => {
    await page.goto(EQUIPE);

    const honours = page.locator('.team-honours');
    const strip = page.locator('.match-strip');
    await expect(honours).toBeVisible();
    await expect(strip).toBeVisible();

    const boxHonours = await honours.boundingBox();
    const boxStrip = await strip.boundingBox();
    expect(boxHonours!.y).toBeLessThan(boxStrip!.y);
  });

  test('les deux blocs partagent la même largeur maximale', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(EQUIPE);

    const boxHonours = await page.locator('.team-honours').boundingBox();
    const boxStrip = await page.locator('.match-strip').boundingBox();
    expect(Math.abs(boxHonours!.width - boxStrip!.width)).toBeLessThanOrEqual(2);
    expect(boxHonours!.width).toBeLessThanOrEqual(902);
  });

  test('les lignes de palmarès affichent une pastille de rang sans emoji', async ({ page }) => {
    await page.goto(EQUIPE);

    // Même garde-fou que ci-dessus : `.team-honours` ne se rend qu'une fois les
    // trophées reçus (le composant part d'un signal vide), donc `.count()` sur ses
    // lignes doit attendre le conteneur plutôt que de risquer la course au chargement.
    await expect(page.locator('.team-honours')).toBeVisible();

    const lignes = page.locator('.team-honours__row');
    expect(await lignes.count()).toBeGreaterThan(0);
    await expect(page.locator('.team-honours__rank').first()).toBeVisible();

    const texte = (await page.locator('.team-honours').innerText()) ?? '';
    expect(texte).not.toMatch(/[🥇🥈🥉🏆]/u);
  });

  test('ne dépasse jamais quatre lignes de palmarès', async ({ page }) => {
    await page.goto(EQUIPE);

    // Garde-fou indispensable ici : une assertion "≤ 4" passerait aussi (à tort)
    // sur un compte de 0 ligne si le palmarès n'a pas encore fini de charger —
    // ce serait un test vert qui ne vérifie plus rien.
    await expect(page.locator('.team-honours')).toBeVisible();

    expect(await page.locator('.team-honours__row').count()).toBeLessThanOrEqual(4);
  });
});

test.describe('Page équipe — parcours dégradé', () => {
  test('aucun bloc résiduel sur une équipe sans trophée ni match', async ({ page }) => {
    // Une équipe inexistante rend l'état d'erreur : ni palmarès ni bandeau.
    await page.goto('/structure/equipes/equipe-qui-nexiste-pas');

    await expect(page.locator('.team-honours')).toHaveCount(0);
    await expect(page.locator('.match-strip')).toHaveCount(0);
  });
});

test.describe('Responsive', () => {
  test('aucun défilement horizontal à 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(EQUIPE);

    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(debordement).toBe(false);
  });
});
