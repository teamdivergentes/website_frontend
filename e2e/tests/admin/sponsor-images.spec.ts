/**
 * Tests E2E — Page admin Images de sponsor (`/admin/sponsors/:id/images`)
 *
 * Non-régression de la migration dialogue -> page routée (EPIC-41, feature 3).
 * L'écran était un dialogue au palier `lg` (920px) ouvert depuis la liste des
 * sponsors : une collection éditable dans une modale, sans action de validation
 * — un simple bouton « Fermer ». C'est désormais une page adressable.
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
 * - .images-count                                  → compteur d'images
 * - button[aria-label^="Gérer les images de"]      → accès à la page images
 * - .skeleton-list[role="status"]                  → squelette de chargement
 *
 * Page images (sponsor-images-page.component.ts) :
 * - .page-header h1                                → « Images de <sponsor> »
 * - button.back-button                             → retour à la liste
 * - .error-state / [data-testid="error-retry"]     → sponsor inconnu + réessai
 * - .image-section[data-slot="primary"]            → emplacement du logo
 * - .image-section[data-slot="secondary1"|"secondary2"] → emplacements secondaires
 * - .current-image img                             → image occupant l'emplacement
 * - app-image-upload input[type="file"]            → champ de téléversement caché
 * - button[aria-label^="Supprimer Image"]          → suppression d'une image
 *
 * Fil d'Ariane (admin-header.component.ts) :
 * - nav.page-title .breadcrumb-link / .breadcrumb-current
 *
 * Page publique des sponsors (sponsors.html, sponsor-card.component.ts) :
 * - .sponsor-section                               → carte d'un sponsor
 * - .sponsor-name                                  → nom affiché
 * - img.main-logo                                  → logo principal
 *
 * Dialog de confirmation (confirm-dialog.component.ts) :
 * - mat-dialog-container button « Supprimer »
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_SPONSOR_NAME = 'Sponsor Images E2E';

/**
 * PNG 1x1 opaque, le plus petit fichier qu'accepte la validation d'upload
 * (`image/*`, moins de 5 MB).
 */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

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

/** Ouvre la page images du sponsor de test depuis la liste. */
async function openImagesPage(page: Page): Promise<void> {
  await navigateToSponsors(page);
  await sponsorItem(page, TEST_SPONSOR_NAME)
    .locator(`button[aria-label="Gérer les images de ${TEST_SPONSOR_NAME}"]`)
    .click();

  await expect(page).toHaveURL(/\/admin\/sponsors\/\d+\/images$/, { timeout: 10000 });
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});
}

/** Dépose un fichier dans l'emplacement demandé et attend son rattachement. */
async function uploadInto(page: Page, slot: string): Promise<void> {
  const section = page.locator(`.image-section[data-slot="${slot}"]`);
  await section.locator('app-image-upload input[type="file"]').setInputFiles({
    name: 'logo-e2e.png',
    mimeType: 'image/png',
    buffer: PNG_1X1,
  });

  await expect(section.locator('.current-image img')).toBeVisible({ timeout: 20000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : la page en tant que page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Images de sponsor — la page routée', () => {
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
    await openImagesPage(page);

    // Le dialogue montait un `mat-dialog-container` : il ne doit plus y en avoir.
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    await expect(page.locator('.page-header h1')).toContainText(
      `Images de ${TEST_SPONSOR_NAME}`,
    );
  });

  test('les trois emplacements sont rendus', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openImagesPage(page);

    await expect(page.locator('.image-section[data-slot="primary"]')).toBeVisible();
    await expect(page.locator('.image-section[data-slot="secondary1"]')).toBeVisible();
    await expect(page.locator('.image-section[data-slot="secondary2"]')).toBeVisible();
  });

  test('l’URL est partageable : un accès direct rend la même page', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openImagesPage(page);
    const url = page.url();

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.page-header h1')).toContainText(
      `Images de ${TEST_SPONSOR_NAME}`,
      { timeout: 15000 },
    );
  });

  test('le fil d’Ariane descend jusqu’à « Images »', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openImagesPage(page);

    const trail = page.locator('nav.page-title');
    await expect(trail.locator('.breadcrumb-link', { hasText: 'Sponsors' })).toBeVisible();
    await expect(trail.locator('.breadcrumb-current')).toHaveText('Images');
  });

  test('le bouton de retour ramène à la liste des sponsors', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openImagesPage(page);

    await page.locator('button.back-button').click();
    await expect(page).toHaveURL(/\/admin\/sponsors$/, { timeout: 10000 });
  });

  test('le retour arrière du navigateur fonctionne', async ({ page }) => {
    test.skip(!(await ensureTestSponsor(page)), "le sponsor de test n'a pas pu etre cree");
    await openImagesPage(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/sponsors$/, { timeout: 10000 });
  });

  test('un identifiant inconnu affiche une erreur réessayable, pas une galerie vide', async ({
    page,
  }) => {
    await page.goto('/admin/sponsors/999999/images', { waitUntil: 'domcontentloaded' });

    const errorState = page.locator('.error-state');
    await expect(errorState).toBeVisible({ timeout: 15000 });
    await expect(errorState).toContainText(/n'existe pas/);
    await expect(page.locator('[data-testid="error-retry"]')).toBeVisible();
    await expect(page.locator('.image-section')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : parcours métier — admin puis page publique
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Images de sponsor — ajout, visibilité publique, suppression', () => {
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

  test('ajouter une image dans l’emplacement principal', async ({ page }) => {
    await openImagesPage(page);
    await uploadInto(page, 'primary');

    // La zone de téléversement laisse place à l'image rattachée.
    await expect(
      page.locator('.image-section[data-slot="primary"] app-image-upload'),
    ).toHaveCount(0);
  });

  test('le compteur d’images de la liste est à jour', async ({ page }) => {
    await navigateToSponsors(page);
    await expect(
      sponsorItem(page, TEST_SPONSOR_NAME).locator('.images-count'),
    ).toContainText('1', { timeout: 15000 });
  });

  test('l’image apparaît sur la page publique des sponsors', async ({ page }) => {
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
    await expect(card.locator('img.main-logo')).toBeVisible({ timeout: 10000 });
  });

  test('supprimer l’image la retire de l’emplacement', async ({ page }) => {
    await openImagesPage(page);

    const section = page.locator('.image-section[data-slot="primary"]');
    await section.locator('button[aria-label^="Supprimer Image principale"]').click();

    const confirmDialog = page.locator('mat-dialog-container');
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await confirmDialog
      .locator('button[mat-raised-button]')
      .filter({ hasText: /Supprimer|Confirmer/ })
      .last()
      .click();

    await expect(section.locator('.current-image')).toHaveCount(0, { timeout: 15000 });
    await expect(section.locator('app-image-upload')).toBeVisible({ timeout: 10000 });
  });

  test('nettoyage : supprimer le sponsor de test', async ({ page }) => {
    await deleteTestSponsor(page);
    await expect(sponsorItem(page, TEST_SPONSOR_NAME)).toHaveCount(0);
  });
});
