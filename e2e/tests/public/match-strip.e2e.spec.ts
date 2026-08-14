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

import { test, expect, Page } from '@playwright/test';

/**
 * Slug dérivé dynamiquement de la première équipe listée sur
 * /structure/equipes (même motif que critical-public-flows.e2e.spec.ts:135),
 * plutôt qu'écrit en dur : la spec ne doit pas dépendre d'un slug particulier
 * pour rester valable si le jeu de données change, mais échoue franchement
 * si aucune équipe n'est disponible.
 */
async function firstTeamSlug(page: Page): Promise<string> {
  await page.goto('/structure/equipes');
  const teamCard = page.locator('a.team-card').first();
  await expect(teamCard).toBeVisible();
  const href = await teamCard.getAttribute('href');
  if (!href) throw new Error('Aucune équipe disponible : href absent sur .team-card');
  return href;
}

/**
 * Les deux blocs sont pilotés par la configuration admin et masqués par défaut
 * (clé absente = false). Ces specs décrivent leur rendu : sur un environnement
 * où ils sont éteints, elles n'ont rien à vérifier et doivent se sauter plutôt
 * qu'échouer.
 *
 * L'état est lu dans la configuration plutôt que déduit du DOM : un bloc absent
 * parce qu'il est désactivé et un bloc absent faute de données produisent le
 * même DOM, et seul le premier justifie de sauter la spec.
 */
async function estActive(page: Page, cle: string): Promise<boolean> {
  const reponse = await page.request.get('/api/config');
  if (!reponse.ok()) return false;
  const configs = (await reponse.json()) as { key: string; value: string }[];
  return configs.some(config => config.key === cle && config.value === 'true');
}

const CLE_MATCHS = 'page_matchs_visible';
const CLE_PALMARES = 'page_palmares_visible';

test.describe('Bandeau matchs — page d’accueil', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await estActive(page, CLE_MATCHS))) test.skip();
  });

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
    // Le dernier motif (branche « date lointaine » de formatRelativeSchedule) exige la
    // forme complète « JOU. D MOIS, HH:MM » (ex. « MER. 5 AOÛT, 20:00 ») — une simple
    // virgule nue laisserait passer une date brute à la française sans le savoir.
    await expect(echeance).toHaveText(
      /AUJOURD'HUI|DEMAIN|DANS |MOINS D'UNE HEURE|[A-Z]{3}\.\s\d{1,2}\s[\p{Lu}]+,\s\d{2}:\d{2}/u,
    );
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
  test.beforeEach(async ({ page }) => {
    const actifs = await Promise.all([
      estActive(page, CLE_MATCHS),
      estActive(page, CLE_PALMARES),
    ]);
    if (actifs.some(actif => !actif)) test.skip();
  });

  test('affiche le bloc palmarès avant le bloc matchs', async ({ page }) => {
    await page.goto(await firstTeamSlug(page));

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
    await page.goto(await firstTeamSlug(page));

    const boxHonours = await page.locator('.team-honours').boundingBox();
    const boxStrip = await page.locator('.match-strip').boundingBox();
    expect(Math.abs(boxHonours!.width - boxStrip!.width)).toBeLessThanOrEqual(2);
    expect(boxHonours!.width).toBeLessThanOrEqual(902);
  });

  test('les lignes de palmarès affichent une pastille de rang sans emoji', async ({ page }) => {
    await page.goto(await firstTeamSlug(page));

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
    await page.goto(await firstTeamSlug(page));

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

    // team-detail.html a trois branches exclusives : loading() (skeleton
    // [role="status"]) → error() → team(). `.team-honours`/`.match-strip` sont
    // absents pendant le skeleton aussi, donc `toHaveCount(0)` conclurait « 0 » dès
    // le premier poll sans jamais observer l'état réglé. On attend explicitement
    // l'état d'erreur (celui visé par ce test) avant de vérifier l'absence des blocs.
    await expect(page.locator('.error-state')).toBeVisible();

    await expect(page.locator('.team-honours')).toHaveCount(0);
    await expect(page.locator('.match-strip')).toHaveCount(0);
  });
});

test.describe('Responsive', () => {
  test.beforeEach(async ({ page }) => {
    const actifs = await Promise.all([
      estActive(page, CLE_MATCHS),
      estActive(page, CLE_PALMARES),
    ]);
    if (actifs.some(actif => !actif)) test.skip();
  });

  test('aucun défilement horizontal à 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(await firstTeamSlug(page));

    // `page.evaluate()` n'attend rien : sans ces gardes, la mesure porterait très
    // probablement sur le skeleton de chargement plutôt que sur le markup des deux
    // composants que ce test est censé couvrir.
    await expect(page.locator('.team-honours')).toBeVisible();
    await expect(page.locator('.match-strip')).toBeVisible();

    const debordement = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(debordement).toBe(false);
  });
});
