/**
 * Tests E2E — Page admin Liens de sponsor (`/admin/sponsors/:id/liens`)
 *
 * Non-régression de la migration dialogue -> page routée (EPIC-41, feature 3).
 * L'écran était le dernier dialogue au palier `lg` (920px) : la liste des liens
 * d'un sponsor **et** son formulaire d'édition dans une même modale, ce que la
 * troisième condition de la règle interdit. C'est désormais une page adressable,
 * et le palier `lg` a disparu d'`AdminDialogService` avec elle.
 *
 * Les tests couvrent en priorité ce que le dialogue ne savait pas faire : URL
 * partageable, fil d'Ariane, retour arrière, identifiant inconnu — puis le
 * parcours métier de bout en bout, du back-office à la page publique.
 *
 * Sélecteurs relevés dans les composants, pas devinés :
 *
 * Liste des sponsors (sponsors.component.ts, sponsors-list.component.ts) :
 * - .sponsor-item                                  → ligne d'un sponsor
 * - .sponsor-info h3                               → nom du sponsor
 * - .links-count                                   → compteur de liens
 * - button[aria-label^="Gérer les liens de"]       → accès à la page liens
 * - .skeleton-list[role="status"]                  → squelette de chargement
 *
 * Page liens (sponsor-links-page.component.html) :
 * - .page-header h1                                → « Liens de <sponsor> »
 * - button.back-button                             → retour à la liste
 * - .error-state / [data-testid="error-retry"]     → sponsor inconnu + réessai
 * - .empty-state                                   → « Aucun lien pour ce sponsor »
 * - .section-header button                         → « Ajouter un lien »
 * - .form-section                                  → formulaire, monté à la demande
 * - .form-section input[formcontrolname="label"]   → champ Label
 * - .form-section input[formcontrolname="url"]     → champ URL
 * - .form-section mat-select[formcontrolname="type"] → select Type
 * - .form-section mat-error                        → message de validation
 * - [data-testid="form-submit"]                    → « Ajouter » / « Mettre à jour »
 * - [data-testid="form-cancel"]                    → « Annuler »
 * - .link-item / .link-item.primary                → ligne d'un lien
 * - .link-item .link-url                           → ancre vers l'URL du lien
 * - button[aria-label^="Modifier "]                → édition d'un lien
 * - button[aria-label^="Supprimer "]               → suppression d'un lien
 *
 * Fil d'Ariane (admin-header.component.ts) :
 * - nav.page-title .breadcrumb-link / .breadcrumb-current
 *
 * Page publique des sponsors (sponsor-card.component.ts) :
 * - .sponsor-section                               → carte d'un sponsor
 * - .sponsor-name                                  → nom affiché
 * - a.sponsor-link                                 → lien principal du sponsor
 *
 * Dialog de confirmation (confirm-dialog.component.ts) :
 * - mat-dialog-container button « Supprimer »
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_SPONSOR_NAME = 'Sponsor Liens E2E';
const LINK_LABEL = 'Site officiel E2E';
const LINK_URL = 'https://exemple-e2e.test/';
const UPDATED_LINK_LABEL = 'Site officiel E2E modifié';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToSponsors(page: Page): Promise<void> {
  await page.goto('/admin/sponsors', { waitUntil: 'domcontentloaded' });
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});
}

function sponsorItem(page: Page, name: string) {
  return page.locator('.sponsor-item').filter({ has: page.locator('h3', { hasText: name }) });
}

/** Crée le sponsor de test s'il n'existe pas déjà. */
async function ensureTestSponsor(page: Page): Promise<boolean> {
  await navigateToSponsors(page);
  if (await sponsorItem(page, TEST_SPONSOR_NAME).isVisible().catch(() => false)) return true;

  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau sponsor' });
  if (!(await createBtn.isVisible().catch(() => false))) return false;
  await createBtn.click();

  await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });
  await page.locator('mat-dialog-container input[formcontrolname="name"]').fill(TEST_SPONSOR_NAME);
  await page
    .locator('mat-dialog-container button[mat-raised-button]')
    .filter({ hasText: 'Enregistrer' })
    .click();
  await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

  await expect(sponsorItem(page, TEST_SPONSOR_NAME)).toBeVisible({ timeout: 15000 });
  return true;
}

/** Supprime le sponsor de test, quel que soit son état. */
async function deleteTestSponsor(page: Page): Promise<void> {
  await navigateToSponsors(page);
  const item = sponsorItem(page, TEST_SPONSOR_NAME);
  if (!(await item.isVisible().catch(() => false))) return;

  await item.locator(`button[aria-label="Supprimer ${TEST_SPONSOR_NAME}"]`).click();
  await page
    .locator('mat-dialog-container button[mat-raised-button]')
    .filter({ hasText: /Supprimer|Confirmer/ })
    .last()
    .click();
  await expect(item).not.toBeVisible({ timeout: 15000 });
}

/** Ouvre la page liens du sponsor de test depuis la liste. */
async function openLinksPage(page: Page): Promise<void> {
  await navigateToSponsors(page);
  await sponsorItem(page, TEST_SPONSOR_NAME)
    .locator(`button[aria-label="Gérer les liens de ${TEST_SPONSOR_NAME}"]`)
    .click();

  await expect(page).toHaveURL(/\/admin\/sponsors\/\d+\/liens$/, { timeout: 10000 });
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});
}

/** Confirme la boîte de dialogue de suppression. */
async function confirmDeletion(page: Page): Promise<void> {
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await dialog
    .locator('button[mat-raised-button]')
    .filter({ hasText: /Supprimer|Confirmer/ })
    .last()
    .click();
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : la page en tant que page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Liens de sponsor — la page routée', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) test.skip();
  });

  test('la liste ouvre une page, plus un dialogue', async ({ page }) => {
    if (!(await ensureTestSponsor(page))) {
      test.info().annotations.push({ type: 'note', description: 'Création de sponsor indisponible' });
      return;
    }
    await openLinksPage(page);

    // Le dialogue montait un `mat-dialog-container` : il ne doit plus y en avoir.
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    await expect(page.locator('.page-header h1')).toContainText(`Liens de ${TEST_SPONSOR_NAME}`);
  });

  test('le formulaire n’est monté qu’à la demande', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openLinksPage(page);

    // Le dialogue affichait la liste et le formulaire en permanence.
    await expect(page.locator('.form-section')).toHaveCount(0);
    await page.locator('.section-header button', { hasText: 'Ajouter un lien' }).click();
    await expect(page.locator('.form-section')).toBeVisible({ timeout: 5000 });
  });

  test('l’URL est partageable : un accès direct rend la même page', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openLinksPage(page);
    const url = page.url();

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.page-header h1')).toContainText(`Liens de ${TEST_SPONSOR_NAME}`, {
      timeout: 15000,
    });
  });

  test('le fil d’Ariane descend jusqu’à « Liens »', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openLinksPage(page);

    const trail = page.locator('nav.page-title');
    await expect(trail.locator('.breadcrumb-link', { hasText: 'Sponsors' })).toBeVisible();
    await expect(trail.locator('.breadcrumb-current')).toHaveText('Liens');
  });

  test('le bouton de retour ramène à la liste des sponsors', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openLinksPage(page);

    await page.locator('button.back-button').click();
    await expect(page).toHaveURL(/\/admin\/sponsors$/, { timeout: 10000 });
  });

  test('le retour arrière du navigateur fonctionne', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openLinksPage(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/sponsors$/, { timeout: 10000 });
  });

  test('un identifiant inconnu affiche une erreur réessayable, pas une liste vide', async ({
    page,
  }) => {
    await page.goto('/admin/sponsors/999999/liens', { waitUntil: 'domcontentloaded' });

    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 15000 });
    await expect(errorState).toContainText(/n'existe pas/);
    await expect(page.locator('[data-testid="error-retry"]')).toBeVisible();
    await expect(page.locator('.empty-state')).toHaveCount(0);
    await expect(page.locator('.link-item')).toHaveCount(0);
  });

  test('une URL sans schéma est refusée', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openLinksPage(page);

    await page.locator('.section-header button', { hasText: 'Ajouter un lien' }).click();
    const form = page.locator('.form-section');
    await form.locator('input[formcontrolname="label"]').fill('Lien invalide');
    await form.locator('input[formcontrolname="url"]').fill('exemple.com');
    await form.locator('input[formcontrolname="url"]').blur();

    await expect(form.locator('mat-error')).toContainText('URL invalide', { timeout: 5000 });
    await expect(
      form.locator('[data-testid="form-submit"]'),
    ).toBeDisabled();
  });

  test('quitter avec une saisie en cours demande confirmation', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openLinksPage(page);

    await page.locator('.section-header button', { hasText: 'Ajouter un lien' }).click();
    await page.locator('.form-section input[formcontrolname="label"]').fill('Brouillon');

    await page.locator('button.back-button').click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText('non enregistrées');

    // On reste sur la page si l'on annule.
    await dialog.locator('button', { hasText: 'Annuler' }).click();
    await expect(page).toHaveURL(/\/admin\/sponsors\/\d+\/liens$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : parcours métier — admin puis page publique
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Liens de sponsor — ajout, visibilité publique, suppression', () => {
  let ready = false;

  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) {
      test.skip();
      return;
    }
    ready = await ensureTestSponsor(page);
    if (!ready) test.skip();
  });

  test('ajouter un lien principal', async ({ page }) => {
    await openLinksPage(page);

    await page.locator('.section-header button', { hasText: 'Ajouter un lien' }).click();
    const form = page.locator('.form-section');
    await form.locator('input[formcontrolname="label"]').fill(LINK_LABEL);
    await form.locator('input[formcontrolname="url"]').fill(LINK_URL);
    await form.locator('mat-checkbox').click();
    await form.locator('[data-testid="form-submit"]').click();

    // Le formulaire se replie et le lien rejoint la liste.
    await expect(page.locator('.form-section')).toHaveCount(0, { timeout: 15000 });
    const item = page.locator('.link-item').filter({ hasText: LINK_LABEL });
    await expect(item).toBeVisible({ timeout: 15000 });
    await expect(item).toHaveClass(/primary/);
    await expect(item.locator('.link-url')).toHaveAttribute('href', LINK_URL);
  });

  test('le compteur de liens de la liste est à jour', async ({ page }) => {
    await navigateToSponsors(page);
    await expect(sponsorItem(page, TEST_SPONSOR_NAME).locator('.links-count')).toContainText('1', {
      timeout: 15000,
    });
  });

  test('le lien apparaît sur la page publique des sponsors', async ({ page }) => {
    // Le sponsor doit être actif pour être publié.
    await navigateToSponsors(page);
    const toggle = sponsorItem(page, TEST_SPONSOR_NAME).locator('mat-slide-toggle');
    if ((await toggle.getAttribute('aria-label'))?.startsWith('Activer')) {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-label', /^Désactiver/, { timeout: 10000 });
    }

    await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    const card = page
      .locator('.sponsor-section')
      .filter({ has: page.locator('.sponsor-name', { hasText: TEST_SPONSOR_NAME }) });

    await expect(card).toBeVisible({ timeout: 20000 });
    await expect(card.locator('a.sponsor-link')).toHaveAttribute('href', LINK_URL, {
      timeout: 10000,
    });
  });

  test('modifier le label du lien', async ({ page }) => {
    await openLinksPage(page);

    await page.locator(`button[aria-label="Modifier ${LINK_LABEL}"]`).click();
    const form = page.locator('.form-section');
    await expect(form.locator('input[formcontrolname="label"]')).toHaveValue(LINK_LABEL);

    await form.locator('input[formcontrolname="label"]').fill(UPDATED_LINK_LABEL);
    await form.locator('[data-testid="form-submit"]').click();

    await expect(page.locator('.link-item').filter({ hasText: UPDATED_LINK_LABEL })).toBeVisible({
      timeout: 15000,
    });
  });

  test('supprimer le lien le retire de la liste', async ({ page }) => {
    await openLinksPage(page);

    await page.locator(`button[aria-label="Supprimer ${UPDATED_LINK_LABEL}"]`).click();
    await confirmDeletion(page);

    await expect(
      page.locator('.link-item').filter({ hasText: UPDATED_LINK_LABEL }),
    ).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('.empty-state')).toBeVisible({ timeout: 10000 });
  });

  test('nettoyage : supprimer le sponsor de test', async ({ page }) => {
    await deleteTestSponsor(page);
    await expect(sponsorItem(page, TEST_SPONSOR_NAME)).toHaveCount(0);
  });
});
