/**
 * Tests E2E — Page admin Sponsors (CRUD)
 *
 * Vérifie les opérations CRUD sur les sponsors :
 * affichage de la liste, création, édition, suppression et toggle actif.
 * Les tests de mutation (create/edit/delete) utilisent test.describe.serial()
 * pour garantir l'ordre d'exécution et le nettoyage des données.
 *
 * Sélecteurs basés sur sponsors.component.ts et sponsors-list.component.ts :
 * - .admin-page                 → conteneur principal
 * - .page-header h1             → titre "Gestion des Sponsors"
 * - .page-header button         → bouton "Nouveau sponsor"
 * - .sponsors-list              → liste des sponsors (cdkDropList)
 * - .sponsor-item               → ligne d'un sponsor
 * - .sponsor-thumb              → vignette image / no-image
 * - .sponsor-info h3            → nom du sponsor
 * - .sponsor-info .meta         → métadonnées (compteurs images, liens, dates)
 * - .images-count               → compteur d'images
 * - .links-count                → compteur de liens
 * - mat-slide-toggle            → toggle actif/inactif
 * - button[aria-label^="Gérer les images de"] → bouton gestion images
 * - button[aria-label^="Gérer les liens de"]  → bouton gestion liens
 * - button[aria-label^="Modifier "]           → bouton modifier
 * - button[aria-label^="Supprimer "]          → bouton supprimer (couleur warn)
 * - .skeleton-list              → skeleton loading (role="status")
 * - .empty-list                 → état vide ("Aucun sponsor")
 * - .error-message              → message d'erreur
 *
 * Dialog de création/édition (SponsorFormDialogComponent) :
 * - h2[mat-dialog-title]                       → titre "Nouveau sponsor" / "Modifier le sponsor"
 * - input[formcontrolname="name"]              → champ Nom (requis)
 * - textarea[formcontrolname="description"]    → champ Description
 * - mat-select[formcontrolname="imageLayout"]  → select Position des images
 * - mat-option                                 → options du select
 * - button[mat-raised-button][color="primary"] → bouton Enregistrer
 * - button[mat-button]                         → bouton Annuler
 *
 * Dialog de confirmation (ConfirmDialogComponent) :
 * - h2[mat-dialog-title]          → titre "Confirmer la suppression"
 * - mat-dialog-content p          → message de confirmation
 * - button[mat-raised-button]     → bouton "Supprimer" (confirmer)
 * - button[mat-button][cdkfocusinitial] → bouton "Annuler"
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_SPONSOR_NAME = 'Sponsor E2E Test';
const TEST_SPONSOR_DESCRIPTION = 'Description de test automatisée';
const UPDATED_SPONSOR_NAME = 'Sponsor E2E Modifié';
const UPDATED_SPONSOR_DESCRIPTION = 'Description mise à jour par les tests';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToSponsors(page: Page): Promise<boolean> {
  await page.goto('/admin/sponsors', { waitUntil: 'domcontentloaded' });

  // Attendre que le skeleton disparaisse ou qu'un état final soit visible
  const loaded = await Promise.race([
    page.locator('.sponsors-list').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-list').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.error-message').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  // S'assurer que le skeleton est bien caché avant de continuer
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});

  return loaded;
}

/**
 * Ouvre le dialog de création de sponsor et remplit les champs requis.
 * Retourne true si le dialog s'est ouvert et les champs ont été remplis.
 */
async function openCreateDialogAndFill(
  page: Page,
  name: string,
  description?: string,
): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau sponsor' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toHaveText('Nouveau sponsor');

  // Remplir le champ Nom (requis)
  const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(name);

  // Remplir la description (optionnel)
  if (description) {
    const descInput = page.locator('mat-dialog-container textarea[formcontrolname="description"]');
    await expect(descInput).toBeVisible({ timeout: 5000 });
    await descInput.fill(description);
  }

  return true;
}

/**
 * Supprime un sponsor par son nom en cherchant le bouton de suppression dans la liste.
 * Confirme dans le dialog ConfirmDialogComponent.
 */
async function deleteSponsorByName(page: Page, sponsorName: string): Promise<void> {
  const sponsorItem = page.locator('.sponsor-item').filter({
    has: page.locator('h3', { hasText: sponsorName }),
  });

  const count = await sponsorItem.count();
  if (count === 0) return;

  const deleteBtn = sponsorItem.locator(
    `button[aria-label="Supprimer ${sponsorName}"]`,
  );
  await deleteBtn.click();

  // Confirmer dans le dialog de suppression
  const confirmBtn = page
    .locator('mat-dialog-container button[mat-raised-button]')
    .filter({ hasText: /Supprimer|Confirmer|Oui/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que le sponsor disparaisse de la liste
  await expect(sponsorItem).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la page (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Sponsors admin — Affichage', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('la page sponsors charge après le login', async ({ page }) => {
    const loaded = await navigateToSponsors(page);
    expect(loaded).toBe(true);

    await expect(page).toHaveURL(/\/admin\/sponsors/);
  });

  test('le titre "Gestion des Sponsors" est visible', async ({ page }) => {
    await navigateToSponsors(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion des Sponsors');
  });

  test('le bouton "Nouveau sponsor" est visible', async ({ page }) => {
    await navigateToSponsors(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouveau sponsor' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('la liste des sponsors est affichée (ou état vide si aucun sponsor)', async ({ page }) => {
    await navigateToSponsors(page);

    const hasList = await page.locator('.sponsors-list').isVisible().catch(() => false);
    const hasEmpty = await page.locator('.empty-list').isVisible().catch(() => false);

    // Il doit y avoir soit une liste, soit un état vide
    expect(hasList || hasEmpty).toBe(true);

    if (hasList) {
      const items = page.locator('.sponsor-item');
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('chaque sponsor affiche son nom et sa vignette', async ({ page }) => {
    await navigateToSponsors(page);

    const hasList = await page.locator('.sponsors-list').isVisible().catch(() => false);
    if (!hasList) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucun sponsor dans la base, état vide affiché',
      });
      return;
    }

    const firstItem = page.locator('.sponsor-item').first();
    await expect(firstItem.locator('.sponsor-info h3')).toBeVisible({ timeout: 5000 });
    await expect(firstItem.locator('.sponsor-thumb')).toBeVisible({ timeout: 5000 });
  });

  test('chaque sponsor affiche les compteurs d\'images et de liens', async ({ page }) => {
    await navigateToSponsors(page);

    if (!(await page.locator('.sponsors-list').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Pas de sponsors, test ignoré',
      });
      return;
    }

    const firstItem = page.locator('.sponsor-item').first();
    await expect(firstItem.locator('.sponsor-info .meta')).toBeVisible({ timeout: 5000 });
    await expect(firstItem.locator('.images-count')).toBeVisible({ timeout: 5000 });
    await expect(firstItem.locator('.links-count')).toBeVisible({ timeout: 5000 });
  });

  test('chaque sponsor affiche les boutons d\'actions (toggle, images, liens, modifier, supprimer)', async ({ page }) => {
    await navigateToSponsors(page);

    if (!(await page.locator('.sponsors-list').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Pas de sponsors, test ignoré',
      });
      return;
    }

    const firstItem = page.locator('.sponsor-item').first();
    const actions = firstItem.locator('.actions');
    await expect(actions).toBeVisible({ timeout: 5000 });

    // Toggle actif/inactif
    await expect(firstItem.locator('mat-slide-toggle')).toBeVisible({ timeout: 5000 });
    // Bouton gestion images
    await expect(actions.locator('button[aria-label^="Gérer les images de"]')).toBeVisible({
      timeout: 5000,
    });
    // Bouton gestion liens
    await expect(actions.locator('button[aria-label^="Gérer les liens de"]')).toBeVisible({
      timeout: 5000,
    });
    // Bouton modifier
    await expect(actions.locator('button[aria-label^="Modifier "]')).toBeVisible({ timeout: 5000 });
    // Bouton supprimer
    await expect(actions.locator('button[aria-label^="Supprimer "]')).toBeVisible({ timeout: 5000 });
  });

  test('le toggle a un aria-label descriptif (Activer / Désactiver)', async ({ page }) => {
    await navigateToSponsors(page);

    if (!(await page.locator('.sponsors-list').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Pas de sponsors dans la base',
      });
      return;
    }

    const firstToggle = page.locator('.sponsor-item').first().locator('mat-slide-toggle');
    const ariaLabel = await firstToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Activer|Désactiver/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD complet — serial (Create → Edit → Delete)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Sponsors admin — CRUD complet', () => {
  let loggedIn = false;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      await page.close();
      return;
    }
    loggedIn = await loginAsAdmin(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp || !loggedIn) {
      test.skip();
      return;
    }
    // Re-login dans chaque test pour obtenir le contexte de page courant
    await loginAsAdmin(page);
  });

  test('création : ouvrir le dialog et créer un nouveau sponsor', async ({ page }) => {
    await navigateToSponsors(page);

    const filled = await openCreateDialogAndFill(page, TEST_SPONSOR_NAME, TEST_SPONSOR_DESCRIPTION);
    expect(filled).toBe(true);

    // Cliquer sur "Enregistrer"
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme après la sauvegarde
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le nouveau sponsor doit apparaître dans la liste
    const newSponsorItem = page.locator('.sponsor-item').filter({
      has: page.locator('h3', { hasText: TEST_SPONSOR_NAME }),
    });
    await expect(newSponsorItem).toBeVisible({ timeout: 15000 });
  });

  test('le sponsor créé affiche le bon nom', async ({ page }) => {
    await navigateToSponsors(page);

    const sponsorItem = page.locator('.sponsor-item').filter({
      has: page.locator('h3', { hasText: TEST_SPONSOR_NAME }),
    });

    await expect(sponsorItem).toBeVisible({ timeout: 10000 });
    await expect(sponsorItem.locator('.sponsor-info h3')).toHaveText(TEST_SPONSOR_NAME);
  });

  test('édition : modifier le nom du sponsor créé', async ({ page }) => {
    await navigateToSponsors(page);

    const sponsorItem = page.locator('.sponsor-item').filter({
      has: page.locator('h3', { hasText: TEST_SPONSOR_NAME }),
    });
    await expect(sponsorItem).toBeVisible({ timeout: 10000 });

    // Cliquer sur "Modifier"
    const editBtn = sponsorItem.locator(`button[aria-label="Modifier ${TEST_SPONSOR_NAME}"]`);
    await editBtn.click();

    // Attendre que le dialog d'édition s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toHaveText('Modifier le sponsor');

    // Vérifier que le champ nom est pré-rempli
    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await expect(nameInput).toHaveValue(TEST_SPONSOR_NAME);

    // Modifier le nom
    await nameInput.clear();
    await nameInput.fill(UPDATED_SPONSOR_NAME);

    // Modifier la description
    const descInput = page.locator('mat-dialog-container textarea[formcontrolname="description"]');
    await descInput.clear();
    await descInput.fill(UPDATED_SPONSOR_DESCRIPTION);

    // Sauvegarder
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le sponsor doit maintenant afficher le nouveau nom
    const updatedItem = page.locator('.sponsor-item').filter({
      has: page.locator('h3', { hasText: UPDATED_SPONSOR_NAME }),
    });
    await expect(updatedItem).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien nom n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToSponsors(page);

    const oldNameItem = page.locator('.sponsor-item h3', { hasText: TEST_SPONSOR_NAME });
    await expect(oldNameItem).not.toBeVisible({ timeout: 5000 });
  });

  test('suppression : supprimer le sponsor de test (nettoyage)', async ({ page }) => {
    await navigateToSponsors(page);

    // Chercher le sponsor avec l'un ou l'autre nom (selon si l'édition a réussi)
    const updatedItem = page.locator('.sponsor-item').filter({
      has: page.locator('h3', { hasText: UPDATED_SPONSOR_NAME }),
    });
    const originalItem = page.locator('.sponsor-item').filter({
      has: page.locator('h3', { hasText: TEST_SPONSOR_NAME }),
    });

    const updatedExists = await updatedItem.isVisible().catch(() => false);
    const originalExists = await originalItem.isVisible().catch(() => false);

    const targetName = updatedExists
      ? UPDATED_SPONSOR_NAME
      : originalExists
        ? TEST_SPONSOR_NAME
        : null;

    if (!targetName) {
      test.info().annotations.push({
        type: 'note',
        description: 'Sponsor de test non trouvé, déjà supprimé ?',
      });
      return;
    }

    await deleteSponsorByName(page, targetName);

    // Vérifier que le sponsor n'est plus dans la liste
    const deletedItem = page.locator('.sponsor-item').filter({
      has: page.locator('h3', { hasText: targetName }),
    });
    await expect(deletedItem).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Dialog — Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Sponsors admin — Validation du formulaire', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }
    await navigateToSponsors(page);
  });

  test('le bouton Enregistrer est désactivé si le nom est vide', async ({ page }) => {
    // Ouvrir le dialog de création
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau sponsor' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Sans remplir le champ nom, le bouton Enregistrer doit être disabled
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('une erreur de validation apparaît si le nom est touché puis vidé', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau sponsor' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await nameInput.fill('quelque chose');
    await nameInput.clear();
    await nameInput.blur();

    // L'erreur de required doit apparaître
    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /requis/ });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('Annuler dans le dialog ferme la fenêtre sans créer de sponsor', async ({ page }) => {
    const countBefore = await page.locator('.sponsor-item').count();

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau sponsor' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement
    await page
      .locator('mat-dialog-container input[formcontrolname="name"]')
      .fill('Sponsor non sauvegardé');

    // Cliquer sur Annuler
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    // Le nombre de sponsors ne doit pas avoir changé
    const countAfter = await page.locator('.sponsor-item').count();
    expect(countAfter).toBe(countBefore);
  });

  test('le select "Position des images" propose 3 layouts', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau sponsor' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Ouvrir le select imageLayout
    const layoutSelect = page.locator(
      'mat-dialog-container mat-select[formcontrolname="imageLayout"]',
    );
    await expect(layoutSelect).toBeVisible({ timeout: 5000 });
    await layoutSelect.click();

    // Les 3 layouts doivent être présents
    await expect(
      page.locator('mat-option').filter({ hasText: /Layout 1/ }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('mat-option').filter({ hasText: /Layout 2/ }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('mat-option').filter({ hasText: /Layout 3/ }),
    ).toBeVisible({ timeout: 5000 });

    // Fermer le panneau et le dialog
    await page.keyboard.press('Escape');
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('Annuler dans le dialog de suppression ne supprime pas le sponsor', async ({ page }) => {
    if (!(await page.locator('.sponsors-list').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Pas de sponsors dans la base, test ignoré',
      });
      return;
    }

    const countBefore = await page.locator('.sponsor-item').count();

    // Cliquer sur le bouton supprimer du premier sponsor
    const firstItem = page.locator('.sponsor-item').first();
    const firstName = await firstItem.locator('h3').textContent();
    const deleteBtn = firstItem.locator('button[aria-label^="Supprimer "]');
    await deleteBtn.click();

    // Le dialog de confirmation s'ouvre
    const confirmDialog = page.locator('mat-dialog-container');
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });
    await expect(confirmDialog.locator('h2[mat-dialog-title]')).toContainText(
      'Confirmer la suppression',
    );

    // Cliquer sur Annuler
    const cancelBtn = confirmDialog
      .locator('button[mat-button]')
      .filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    // Le dialog se ferme
    await confirmDialog.waitFor({ state: 'hidden', timeout: 10000 });

    // Le nombre de sponsors ne doit pas avoir changé
    const countAfter = await page.locator('.sponsor-item').count();
    expect(countAfter).toBe(countBefore);

    // Le premier sponsor doit toujours être présent
    if (firstName) {
      const stillVisible = page.locator('.sponsor-item').filter({
        has: page.locator('h3', { hasText: firstName.trim() }),
      });
      await expect(stillVisible).toBeVisible({ timeout: 5000 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Toggle actif/inactif
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Sponsors admin — Toggle actif/inactif', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }
    await navigateToSponsors(page);
  });

  test('le toggle actif/inactif est présent sur chaque sponsor', async ({ page }) => {
    if (!(await page.locator('.sponsors-list').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Pas de sponsors dans la base',
      });
      return;
    }

    const firstToggle = page.locator('.sponsor-item').first().locator('mat-slide-toggle');
    await expect(firstToggle).toBeVisible({ timeout: 5000 });
  });

  test('le toggle a un aria-label "Activer X" ou "Désactiver X"', async ({ page }) => {
    if (!(await page.locator('.sponsors-list').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Pas de sponsors dans la base',
      });
      return;
    }

    const firstToggle = page.locator('.sponsor-item').first().locator('mat-slide-toggle');
    const ariaLabel = await firstToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/^(Activer|Désactiver) .+/);
  });

  test('cliquer sur le toggle change l\'état du sponsor', async ({ page }) => {
    if (!(await page.locator('.sponsors-list').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Pas de sponsors dans la base',
      });
      return;
    }

    const firstItem = page.locator('.sponsor-item').first();
    const toggle = firstItem.locator('mat-slide-toggle');

    // Lire l'état initial
    const initialAriaLabel = await toggle.getAttribute('aria-label');
    const wasActive = initialAriaLabel?.startsWith('Désactiver');

    // Cliquer pour changer l'état
    await toggle.click();

    // Laisser le temps à la requête API de se terminer
    await page.waitForTimeout(1500);

    // L'aria-label doit avoir changé de sens
    const newAriaLabel = await toggle.getAttribute('aria-label');
    if (wasActive) {
      expect(newAriaLabel).toMatch(/^Activer .+/);
    } else {
      expect(newAriaLabel).toMatch(/^Désactiver .+/);
    }

    // Remettre dans l'état initial pour ne pas polluer les autres tests
    await toggle.click();
    await page.waitForTimeout(1500);
  });
});
