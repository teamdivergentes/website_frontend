/**
 * Tests E2E — Page admin Recrutement (CRUD)
 *
 * Vérifie les opérations CRUD sur les offres de recrutement :
 * affichage de la liste, création, édition, suppression et toggle actif.
 * Les tests de mutation utilisent test.describe.serial() pour garantir
 * l'ordre d'exécution et le nettoyage des données de test.
 *
 * Sélecteurs basés sur recruitment.component.ts et recruitment-form-dialog.component.ts :
 * - .recruitment-admin-page       → conteneur principal
 * - .page-header h1               → titre "Gestion du Recrutement"
 * - .page-header button           → bouton "Nouvelle offre"
 * - .posts-list                   → liste des offres (cdkDropList)
 * - .post-item                    → item d'une offre
 * - .post-info h3                 → titre de l'offre
 * - .post-type                    → badge type de contrat
 * - .post-description             → description courte
 * - .post-actions                 → actions (toggle, modifier, supprimer)
 * - mat-slide-toggle              → toggle actif/inactif
 * - button[aria-label^="Modifier"] → bouton modifier
 * - button[aria-label^="Supprimer"] → bouton supprimer
 * - .skeleton-list                → skeleton loading
 * - .empty-state                  → état vide
 * - .error-message                → message d'erreur
 *
 * Dialog MatDialog (recruitment-form-dialog.component.ts) :
 * - h2[mat-dialog-title]                    → titre dialog ("Créer une offre" / "Modifier une offre")
 * - input[formcontrolname="title"]          → champ titre du poste
 * - mat-select[formcontrolname="type"]      → select type de contrat
 * - mat-option                              → options du select (Bénévole, CDI, CDD, Stage, Freelance, Alternance)
 * - textarea[formcontrolname="description"] → champ description courte
 * - textarea[formcontrolname="missions"]    → champ missions principales
 * - textarea[formcontrolname="skills"]      → champ compétences
 * - mat-checkbox[formcontrolname="active"]  → checkbox offre active
 * - button[mat-raised-button][color="primary"] → bouton Enregistrer
 * - button[mat-button]                      → bouton Annuler
 *
 * Dialog de confirmation :
 * - mat-dialog-container button contenant "Confirmer" → confirmer la suppression
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_POST_TITLE = 'Testeur E2E Automatisé';
const TEST_POST_DESCRIPTION = 'Offre de test créée par les tests E2E Playwright. À supprimer.';
const UPDATED_POST_TITLE = 'Testeur E2E Senior';
const UPDATED_POST_DESCRIPTION = 'Description mise à jour par les tests E2E Playwright.';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToRecruitment(page: Page): Promise<boolean> {
  await page.goto('/admin/recruitment', { waitUntil: 'domcontentloaded' });

  // Attendre que le composant soit chargé (skeleton disparu, puis liste ou état vide)
  const loaded = await Promise.race([
    page.locator('.posts-list').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-state').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.error-message').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  // Attendre que le skeleton disparaisse s'il est présent
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});

  return loaded;
}

/**
 * Ouvre le dialog de création d'offre et remplit les champs obligatoires.
 * Retourne true si le dialog s'est ouvert et les champs ont été remplis.
 */
async function openCreateDialogAndFill(
  page: Page,
  title: string,
  type: 'Bénévole' | 'CDI' | 'CDD' | 'Stage' | 'Freelance' | 'Alternance',
  description: string,
): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle offre' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toContainText('Créer une offre');

  // Champ Titre du poste
  const titleInput = page.locator('mat-dialog-container input[formcontrolname="title"]');
  await expect(titleInput).toBeVisible({ timeout: 5000 });
  await titleInput.fill(title);

  // Select Type de contrat
  const typeSelect = page.locator('mat-dialog-container mat-select[formcontrolname="type"]');
  await expect(typeSelect).toBeVisible({ timeout: 5000 });
  await typeSelect.click();

  const typeOption = page.locator('mat-option').filter({ hasText: type });
  await expect(typeOption).toBeVisible({ timeout: 5000 });
  await typeOption.click();

  // Champ Description courte
  const descInput = page.locator('mat-dialog-container textarea[formcontrolname="description"]');
  await expect(descInput).toBeVisible({ timeout: 5000 });
  await descInput.fill(description);

  return true;
}

/**
 * Supprime une offre par son titre. Cherche dans la liste active et confirme la suppression.
 */
async function deletePostByTitle(page: Page, postTitle: string): Promise<void> {
  const postItem = page.locator('.post-item').filter({
    has: page.locator('h3', { hasText: postTitle }),
  });

  const count = await postItem.count();
  if (count === 0) return;

  const deleteBtn = postItem.locator(`button[aria-label="Supprimer ${postTitle}"]`);
  await deleteBtn.click();

  // Confirmer dans le dialog de confirmation MatDialog
  const confirmBtn = page
    .locator('mat-dialog-container')
    .locator('button')
    .filter({ hasText: /Confirmer|Supprimer|Oui/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que l'offre disparaisse de la liste
  await expect(postItem).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la page (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Recrutement admin — Affichage', () => {
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

  test('la page recrutement charge après le login', async ({ page }) => {
    const loaded = await navigateToRecruitment(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/recruitment/);
  });

  test('le titre "Gestion du Recrutement" est visible', async ({ page }) => {
    await navigateToRecruitment(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion du Recrutement');
  });

  test('le bouton "Nouvelle offre" est visible', async ({ page }) => {
    await navigateToRecruitment(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouvelle offre' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('la liste des offres ou l\'état vide est affiché', async ({ page }) => {
    await navigateToRecruitment(page);

    const hasList = await page.locator('.posts-list').isVisible().catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible().catch(() => false);

    // L'un ou l'autre doit être visible
    expect(hasList || hasEmpty).toBe(true);
  });

  test('chaque offre affiche son titre et son type de contrat', async ({ page }) => {
    await navigateToRecruitment(page);

    const hasList = await page.locator('.posts-list').isVisible().catch(() => false);
    if (!hasList) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucune offre dans la base, état vide affiché',
      });
      return;
    }

    const firstItem = page.locator('.post-item').first();
    await expect(firstItem.locator('.post-info h3')).toBeVisible({ timeout: 5000 });
    await expect(firstItem.locator('.post-type')).toBeVisible({ timeout: 5000 });
  });

  test('chaque offre affiche les actions (toggle, modifier, supprimer)', async ({ page }) => {
    await navigateToRecruitment(page);

    const hasList = await page.locator('.posts-list').isVisible().catch(() => false);
    if (!hasList) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucune offre dans la base, test ignoré',
      });
      return;
    }

    const firstItem = page.locator('.post-item').first();
    const actions = firstItem.locator('.post-actions');
    await expect(actions).toBeVisible({ timeout: 5000 });

    // Toggle actif/inactif
    await expect(actions.locator('mat-slide-toggle')).toBeVisible({ timeout: 5000 });
    // Bouton modifier
    await expect(actions.locator('button[aria-label^="Modifier"]')).toBeVisible({ timeout: 5000 });
    // Bouton supprimer
    await expect(actions.locator('button[aria-label^="Supprimer"]')).toBeVisible({ timeout: 5000 });
  });

  test('le toggle actif/inactif a un aria-label descriptif', async ({ page }) => {
    await navigateToRecruitment(page);

    const hasList = await page.locator('.posts-list').isVisible().catch(() => false);
    if (!hasList) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucune offre dans la base, test ignoré',
      });
      return;
    }

    const firstToggle = page.locator('.post-item').first().locator('mat-slide-toggle');
    const ariaLabel = await firstToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Activer|Désactiver/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD complet — serial (Create → Edit → Delete)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Recrutement admin — CRUD complet', () => {
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

  test('création : ouvrir le dialog et créer une nouvelle offre', async ({ page }) => {
    await navigateToRecruitment(page);

    const filled = await openCreateDialogAndFill(
      page,
      TEST_POST_TITLE,
      'Bénévole',
      TEST_POST_DESCRIPTION,
    );
    expect(filled).toBe(true);

    // Cliquer sur "Enregistrer"
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme après la sauvegarde
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // La nouvelle offre doit apparaître dans la liste
    const newPostItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: TEST_POST_TITLE }),
    });
    await expect(newPostItem).toBeVisible({ timeout: 15000 });
  });

  test('l\'offre créée affiche le bon titre et le bon type', async ({ page }) => {
    await navigateToRecruitment(page);

    const postItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: TEST_POST_TITLE }),
    });

    await expect(postItem).toBeVisible({ timeout: 10000 });
    await expect(postItem.locator('.post-type')).toContainText('Bénévole');
  });

  test('édition : modifier le titre de l\'offre créée', async ({ page }) => {
    await navigateToRecruitment(page);

    const postItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: TEST_POST_TITLE }),
    });
    await expect(postItem).toBeVisible({ timeout: 10000 });

    // Cliquer sur "Modifier"
    const editBtn = postItem.locator(`button[aria-label="Modifier ${TEST_POST_TITLE}"]`);
    await editBtn.click();

    // Attendre que le dialog d'édition s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toContainText('Modifier une offre');

    // Vérifier que le titre est pré-rempli
    const titleInput = page.locator('mat-dialog-container input[formcontrolname="title"]');
    await expect(titleInput).toHaveValue(TEST_POST_TITLE);

    // Modifier le titre
    await titleInput.clear();
    await titleInput.fill(UPDATED_POST_TITLE);

    // Modifier la description
    const descInput = page.locator('mat-dialog-container textarea[formcontrolname="description"]');
    await descInput.clear();
    await descInput.fill(UPDATED_POST_DESCRIPTION);

    // Sauvegarder
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // L'offre doit maintenant afficher le nouveau titre
    const updatedItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: UPDATED_POST_TITLE }),
    });
    await expect(updatedItem).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien titre n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToRecruitment(page);

    const oldTitleItem = page.locator('.post-item h3', { hasText: TEST_POST_TITLE });
    await expect(oldTitleItem).not.toBeVisible({ timeout: 5000 });
  });

  test('toggle : activer/désactiver une offre', async ({ page }) => {
    await navigateToRecruitment(page);

    const postItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: UPDATED_POST_TITLE }),
    });
    await expect(postItem).toBeVisible({ timeout: 10000 });

    const toggle = postItem.locator('mat-slide-toggle');
    await expect(toggle).toBeVisible({ timeout: 5000 });

    // Mémoriser l'état initial du toggle
    const initialAriaLabel = await toggle.getAttribute('aria-label');
    expect(initialAriaLabel).toMatch(/Activer|Désactiver/);

    // Cliquer sur le toggle pour changer l'état
    await toggle.click();
    await expect(toggle).not.toHaveAttribute('aria-label', initialAriaLabel ?? '', { timeout: 5000 });

    // L'aria-label doit avoir changé
    const newAriaLabel = await toggle.getAttribute('aria-label');
    expect(newAriaLabel).not.toBe(initialAriaLabel);
  });

  test('suppression : supprimer l\'offre de test (nettoyage)', async ({ page }) => {
    await navigateToRecruitment(page);

    // Chercher l'offre avec l'un ou l'autre titre (selon si l'édition a réussi)
    const updatedItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: UPDATED_POST_TITLE }),
    });
    const originalItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: TEST_POST_TITLE }),
    });

    const updatedExists = await updatedItem.isVisible().catch(() => false);
    const originalExists = await originalItem.isVisible().catch(() => false);

    const targetTitle = updatedExists
      ? UPDATED_POST_TITLE
      : originalExists
        ? TEST_POST_TITLE
        : null;

    if (!targetTitle) {
      test.info().annotations.push({
        type: 'note',
        description: 'Offre de test non trouvée, déjà supprimée ?',
      });
      return;
    }

    await deletePostByTitle(page, targetTitle);

    // Vérifier que l'offre n'est plus dans la liste
    const deletedItem = page.locator('.post-item').filter({
      has: page.locator('h3', { hasText: targetTitle }),
    });
    await expect(deletedItem).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Dialog — Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Recrutement admin — Validation', () => {
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
    await navigateToRecruitment(page);
  });

  test('le bouton Enregistrer est désactivé si les champs requis sont vides', async ({ page }) => {
    // Ouvrir le dialog de création
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle offre' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Sans remplir les champs, le bouton Enregistrer doit être disabled
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('une erreur de validation apparaît si le titre est vide et soumis', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle offre' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Toucher le champ titre sans le remplir pour déclencher la validation
    const titleInput = page.locator('mat-dialog-container input[formcontrolname="title"]');
    await titleInput.click();
    await titleInput.blur();

    // L'erreur "Le titre est requis" doit apparaître
    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /titre est requis/i });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('le select type de contrat propose toutes les options', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle offre' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Ouvrir le select
    const typeSelect = page.locator('mat-dialog-container mat-select[formcontrolname="type"]');
    await typeSelect.click();

    // Toutes les options doivent être présentes
    await expect(page.locator('mat-option').filter({ hasText: 'Bénévole' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('mat-option').filter({ hasText: 'CDI' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('mat-option').filter({ hasText: 'CDD' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('mat-option').filter({ hasText: 'Stage' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('mat-option').filter({ hasText: 'Freelance' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('mat-option').filter({ hasText: 'Alternance' })).toBeVisible({ timeout: 5000 });

    // Fermer le panneau
    await page.keyboard.press('Escape');
    const cancelBtn = page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('Annuler dans le dialog ferme la fenêtre sans créer d\'offre', async ({ page }) => {
    const countBefore = await page.locator('.post-item').count();

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle offre' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement
    await page
      .locator('mat-dialog-container input[formcontrolname="title"]')
      .fill('Offre non sauvegardée');

    // Cliquer sur Annuler
    const cancelBtn = page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    // Le nombre d'offres ne doit pas avoir changé
    const countAfter = await page.locator('.post-item').count();
    expect(countAfter).toBe(countBefore);
  });

  test('le formulaire d\'édition est pré-rempli avec les données existantes', async ({ page }) => {
    const hasList = await page.locator('.posts-list').isVisible().catch(() => false);
    if (!hasList) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucune offre dans la base, test ignoré',
      });
      return;
    }

    // Cliquer sur le bouton modifier de la première offre
    const firstItem = page.locator('.post-item').first();
    const firstTitle = await firstItem.locator('.post-info h3').textContent();
    const editBtn = firstItem.locator('button[aria-label^="Modifier"]');
    await editBtn.click();

    // Attendre que le dialog s'ouvre
    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });
    await expect(page.locator('h2[mat-dialog-title]')).toContainText('Modifier une offre');

    // Le titre doit être pré-rempli avec la valeur existante
    const titleInput = page.locator('mat-dialog-container input[formcontrolname="title"]');
    const inputValue = await titleInput.inputValue();
    expect(inputValue).toBe(firstTitle?.trim());

    // Fermer sans sauvegarder
    const cancelBtn = page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });
});
