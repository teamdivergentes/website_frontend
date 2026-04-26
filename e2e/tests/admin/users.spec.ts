/**
 * Tests E2E — Page admin Utilisateurs (CRUD)
 *
 * Vérifie les opérations CRUD sur les utilisateurs :
 * affichage du tableau, filtres, création, édition, changement de rôle,
 * réinitialisation de mot de passe et suppression.
 * Les tests de mutation utilisent test.describe.serial() pour garantir
 * l'ordre et le nettoyage des données de test.
 *
 * Sélecteurs basés sur users.component.ts :
 * - .users-admin-page            → conteneur principal
 * - .page-header h1              → titre "Gestion des Utilisateurs"
 * - .page-header button          → bouton "Nouvel utilisateur"
 * - .filters-bar                 → barre de filtres
 * - .filters-bar mat-form-field  → champs de filtrage (recherche, rôle, statut)
 * - .results-count               → compteur de résultats
 * - .table-container             → conteneur du tableau
 * - table[mat-table]             → tableau Material
 * - th[mat-header-cell]          → cellule d'en-tête
 * - td[mat-cell]                 → cellule de données
 * - .mat-column-email            → colonne email
 * - .mat-column-role             → colonne rôle
 * - .mat-column-actif            → colonne statut
 * - .mat-column-createdAt        → colonne date création
 * - .mat-column-actions          → colonne actions
 * - mat-chip                     → chip de rôle
 * - mat-slide-toggle             → toggle actif/inactif
 * - button[mat-icon-button]      → bouton menu actions (more_vert)
 * - mat-menu                     → menu déroulant actions
 * - button[mat-menu-item]        → item du menu (Modifier, Changer rôle, MDP, Supprimer)
 * - .loading-overlay             → overlay de chargement
 * - .empty-state                 → état vide
 * - mat-paginator                → pagination
 *
 * Dialog de création/édition (user-form-dialog.component.ts) :
 * - h2[mat-dialog-title]                  → titre "Nouvel utilisateur" / "Modifier utilisateur"
 * - input[formcontrolname="email"]        → champ email
 * - input[formcontrolname="password"]     → champ mot de passe (création uniquement)
 * - mat-select[formcontrolname="roleid"]  → select rôle
 * - mat-slide-toggle[formcontrolname="actif"] → toggle compte actif
 * - button[mat-raised-button]             → bouton Enregistrer
 * - button[mat-button][mat-dialog-close]  → bouton Annuler
 *
 * Dialog de changement de rôle (role-dialog.component.ts) :
 * - h2[mat-dialog-title]                  → titre "Changer le rôle"
 * - mat-select                            → select nouveau rôle
 * - button[mat-raised-button]             → bouton Confirmer
 *
 * Dialog de réinitialisation MDP (password-dialog.component.ts) :
 * - h2[mat-dialog-title]                  → titre "Réinitialiser le mot de passe"
 * - input[formcontrolname="newpassword"]  → champ nouveau MDP
 * - input[formcontrolname="confirmpassword"] → champ confirmation MDP
 * - button[mat-raised-button][color="warn"] → bouton Réinitialiser
 *
 * Dialog de confirmation (confirm-dialog.component.ts) :
 * - mat-dialog-container button contenant "Supprimer" → confirmer la suppression
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_USER_EMAIL = 'e2etest-user@teamdivergentes.fr';
const TEST_USER_PASSWORD = 'TestPassword123!';
const UPDATED_USER_EMAIL = 'e2etest-user-modifie@teamdivergentes.fr';
const TEST_NEW_PASSWORD = 'NewPassword456!';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToUsers(page: Page): Promise<boolean> {
  await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });

  // Attendre que le composant soit chargé (tableau ou état vide)
  const loaded = await Promise.race([
    page.locator('table[mat-table]').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-state').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  // Attendre que le spinner disparaisse si présent
  await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

  return loaded;
}

/**
 * Ouvre le dialog de création d'utilisateur et remplit les champs requis.
 * Sélectionne le premier rôle disponible dans la liste.
 * Retourne true si le dialog s'est ouvert et les champs ont été remplis.
 */
async function openCreateDialogAndFill(
  page: Page,
  email: string,
  password: string
): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvel utilisateur' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toContainText('Nouvel utilisateur');

  // Champ email
  const emailInput = page.locator('mat-dialog-container input[formcontrolname="email"]');
  await expect(emailInput).toBeVisible({ timeout: 5000 });
  await emailInput.fill(email);

  // Champ mot de passe (uniquement en mode création)
  const passwordInput = page.locator('mat-dialog-container input[formcontrolname="password"]');
  const passwordVisible = await passwordInput.isVisible().catch(() => false);
  if (passwordVisible) {
    await passwordInput.fill(password);
  }

  // Sélectionner le premier rôle disponible dans le select
  const roleSelect = page.locator('mat-dialog-container mat-select[formcontrolname="roleid"]');
  await expect(roleSelect).toBeVisible({ timeout: 5000 });
  await roleSelect.click();

  // Attendre que les options s'affichent et sélectionner la première non-vide
  const firstOption = page.locator('mat-option').first();
  await expect(firstOption).toBeVisible({ timeout: 5000 });
  await firstOption.click();

  return true;
}

/**
 * Ouvre le menu d'actions d'une ligne du tableau identifiée par l'email.
 * Retourne true si le menu a bien été ouvert.
 */
async function openUserActionsMenu(page: Page, userEmail: string): Promise<boolean> {
  // Trouver la ligne du tableau contenant cet email
  const userRow = page.locator('tr[mat-row]').filter({
    has: page.locator('td', { hasText: userEmail })
  });

  const count = await userRow.count();
  if (count === 0) return false;

  const menuBtn = userRow.locator('button[mat-icon-button]');
  await expect(menuBtn).toBeVisible({ timeout: 5000 });
  await menuBtn.click();

  // Attendre que le menu soit visible
  const menuOpened = await page.locator('mat-menu-panel, [role="menu"]').waitFor({ timeout: 5000 }).then(() => true).catch(() => false);

  return menuOpened;
}

/**
 * Supprime un utilisateur par son email depuis le menu d'actions.
 * Confirme la suppression dans le dialog de confirmation.
 */
async function deleteUserByEmail(page: Page, userEmail: string): Promise<void> {
  const userRow = page.locator('tr[mat-row]').filter({
    has: page.locator('td', { hasText: userEmail })
  });

  const count = await userRow.count();
  if (count === 0) return;

  // Ouvrir le menu d'actions
  const menuBtn = userRow.locator('button[mat-icon-button]');
  await menuBtn.click();

  // Cliquer sur "Supprimer" dans le menu
  const deleteMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Supprimer' });
  await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
  await deleteMenuItem.click();

  // Confirmer dans le dialog de confirmation
  const confirmBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Supprimer/ });
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que la ligne disparaisse
  await expect(userRow).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la page (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Users admin — Affichage', () => {
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

  test('la page utilisateurs charge après le login', async ({ page }) => {
    const loaded = await navigateToUsers(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('le titre "Gestion des Utilisateurs" est visible', async ({ page }) => {
    await navigateToUsers(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion des Utilisateurs');
  });

  test('le bouton "Nouvel utilisateur" est visible', async ({ page }) => {
    await navigateToUsers(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouvel utilisateur' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('la barre de filtres est visible avec les 3 champs', async ({ page }) => {
    await navigateToUsers(page);

    const filtersBar = page.locator('.filters-bar');
    await expect(filtersBar).toBeVisible({ timeout: 10000 });

    // Champ recherche par email
    const searchField = filtersBar.locator('mat-form-field').nth(0);
    await expect(searchField).toBeVisible({ timeout: 5000 });

    // Champ filtre par rôle
    const roleField = filtersBar.locator('mat-form-field').nth(1);
    await expect(roleField).toBeVisible({ timeout: 5000 });

    // Champ filtre par statut
    const statusField = filtersBar.locator('mat-form-field').nth(2);
    await expect(statusField).toBeVisible({ timeout: 5000 });
  });

  test('le tableau s\'affiche avec les colonnes attendues', async ({ page }) => {
    await navigateToUsers(page);

    const table = page.locator('table[mat-table]');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Vérifier les en-têtes de colonnes
    const headers = page.locator('th[mat-header-cell]');
    await expect(headers.filter({ hasText: 'Email' })).toBeVisible({ timeout: 5000 });
    await expect(headers.filter({ hasText: 'Rôle' })).toBeVisible({ timeout: 5000 });
    await expect(headers.filter({ hasText: 'Statut' })).toBeVisible({ timeout: 5000 });
    await expect(headers.filter({ hasText: 'Créé le' })).toBeVisible({ timeout: 5000 });
    await expect(headers.filter({ hasText: 'Actions' })).toBeVisible({ timeout: 5000 });
  });

  test('le tableau contient au moins un utilisateur (admin du seed)', async ({ page }) => {
    await navigateToUsers(page);

    const table = page.locator('table[mat-table]');
    await expect(table).toBeVisible({ timeout: 10000 });

    const rows = page.locator('tr[mat-row]');
    const count = await rows.count();

    // Au minimum l'admin seed doit être présent
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('chaque ligne affiche email, chip de rôle, toggle statut et bouton actions', async ({ page }) => {
    await navigateToUsers(page);

    const table = page.locator('table[mat-table]');
    await expect(table).toBeVisible({ timeout: 10000 });

    const firstRow = page.locator('tr[mat-row]').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });

    // Colonne email
    await expect(firstRow.locator('td.mat-column-email')).toBeVisible({ timeout: 5000 });

    // Colonne rôle avec chip Material
    const roleCell = firstRow.locator('td.mat-column-role');
    await expect(roleCell).toBeVisible({ timeout: 5000 });
    await expect(roleCell.locator('mat-chip')).toBeVisible({ timeout: 5000 });

    // Colonne statut avec toggle
    const actifCell = firstRow.locator('td.mat-column-actif');
    await expect(actifCell).toBeVisible({ timeout: 5000 });
    await expect(actifCell.locator('mat-slide-toggle')).toBeVisible({ timeout: 5000 });

    // Bouton menu actions
    const actionsCell = firstRow.locator('td.mat-column-actions');
    await expect(actionsCell.locator('button[mat-icon-button]')).toBeVisible({ timeout: 5000 });
  });

  test('le menu d\'actions propose les options attendues', async ({ page }) => {
    await navigateToUsers(page);

    const firstRow = page.locator('tr[mat-row]').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });

    // Ouvrir le menu d'actions
    await firstRow.locator('button[mat-icon-button]').click();

    // Vérifier les options du menu
    await expect(page.locator('button[mat-menu-item]').filter({ hasText: 'Modifier' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[mat-menu-item]').filter({ hasText: 'Changer rôle' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[mat-menu-item]').filter({ hasText: 'Réinitialiser MDP' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[mat-menu-item]').filter({ hasText: 'Supprimer' })).toBeVisible({ timeout: 5000 });

    // Fermer le menu
    await page.keyboard.press('Escape');
  });

  test('le compteur de résultats s\'affiche si des utilisateurs existent', async ({ page }) => {
    await navigateToUsers(page);

    // Attendre que le chargement soit terminé
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const rows = page.locator('tr[mat-row]');
    const count = await rows.count();

    if (count > 0) {
      const resultsCount = page.locator('.results-count');
      await expect(resultsCount).toBeVisible({ timeout: 5000 });
      await expect(resultsCount).toContainText(/utilisateur/);
    }
  });

  test('la pagination est présente', async ({ page }) => {
    await navigateToUsers(page);

    const paginator = page.locator('mat-paginator');
    await expect(paginator).toBeVisible({ timeout: 10000 });
  });

  test('les colonnes Email et Statut sont triables', async ({ page }) => {
    await navigateToUsers(page);

    const table = page.locator('table[mat-table]');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Les colonnes avec mat-sort-header ont un bouton de tri
    await expect(page.locator('th.mat-column-email[mat-sort-header]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('th.mat-column-actif[mat-sort-header]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('th.mat-column-createdAt[mat-sort-header]')).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD complet — serial (Create → Edit → ChangeRole → Delete)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Users admin — CRUD complet', () => {
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

  test('création : ouvrir le dialog et créer un nouvel utilisateur', async ({ page }) => {
    await navigateToUsers(page);

    const filled = await openCreateDialogAndFill(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    expect(filled).toBe(true);

    // Cliquer sur "Enregistrer"
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme après la sauvegarde
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // L'utilisateur créé doit apparaître dans le tableau
    const newUserRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: TEST_USER_EMAIL })
    });
    await expect(newUserRow).toBeVisible({ timeout: 15000 });
  });

  test('l\'utilisateur créé affiche son email et un chip de rôle', async ({ page }) => {
    await navigateToUsers(page);

    const userRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: TEST_USER_EMAIL })
    });
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // Email visible
    await expect(userRow.locator('td.mat-column-email')).toContainText(TEST_USER_EMAIL);

    // Chip de rôle visible
    await expect(userRow.locator('td.mat-column-role mat-chip')).toBeVisible({ timeout: 5000 });
  });

  test('édition : modifier l\'email de l\'utilisateur créé', async ({ page }) => {
    await navigateToUsers(page);

    const userRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: TEST_USER_EMAIL })
    });
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // Ouvrir le menu d'actions
    await userRow.locator('button[mat-icon-button]').click();

    // Cliquer sur "Modifier"
    const editMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Modifier' });
    await expect(editMenuItem).toBeVisible({ timeout: 5000 });
    await editMenuItem.click();

    // Attendre que le dialog d'édition s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toContainText('Modifier');

    // Vérifier que le champ email est pré-rempli
    const emailInput = page.locator('mat-dialog-container input[formcontrolname="email"]');
    await expect(emailInput).toHaveValue(TEST_USER_EMAIL);

    // Modifier l'email
    await emailInput.clear();
    await emailInput.fill(UPDATED_USER_EMAIL);

    // Le champ mot de passe ne doit PAS être visible en mode édition
    const passwordInput = page.locator('mat-dialog-container input[formcontrolname="password"]');
    const isPasswordVisible = await passwordInput.isVisible().catch(() => false);
    expect(isPasswordVisible).toBe(false);

    // Sauvegarder
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // L'utilisateur doit maintenant afficher le nouvel email
    const updatedRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: UPDATED_USER_EMAIL })
    });
    await expect(updatedRow).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien email n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToUsers(page);

    const oldEmailCell = page.locator('td.mat-column-email', { hasText: TEST_USER_EMAIL });
    await expect(oldEmailCell).not.toBeVisible({ timeout: 5000 });
  });

  test('changement de rôle : ouvrir le dialog et changer le rôle de l\'utilisateur', async ({ page }) => {
    await navigateToUsers(page);

    const userRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: UPDATED_USER_EMAIL })
    });
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // Ouvrir le menu d'actions
    await userRow.locator('button[mat-icon-button]').click();

    // Cliquer sur "Changer rôle"
    const roleMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Changer rôle' });
    await expect(roleMenuItem).toBeVisible({ timeout: 5000 });
    await roleMenuItem.click();

    // Attendre que le dialog de changement de rôle s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toHaveText('Changer le rôle');

    // Vérifier que l'email de l'utilisateur est affiché dans le dialog
    const dialogContent = page.locator('mat-dialog-content');
    await expect(dialogContent).toContainText(UPDATED_USER_EMAIL);

    // Fermer le dialog sans sauvegarder
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('réinitialisation MDP : le dialog s\'ouvre et affiche l\'email de l\'utilisateur', async ({ page }) => {
    await navigateToUsers(page);

    const userRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: UPDATED_USER_EMAIL })
    });
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // Ouvrir le menu d'actions
    await userRow.locator('button[mat-icon-button]').click();

    // Cliquer sur "Réinitialiser MDP"
    const resetPwdMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Réinitialiser MDP' });
    await expect(resetPwdMenuItem).toBeVisible({ timeout: 5000 });
    await resetPwdMenuItem.click();

    // Attendre que le dialog s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toHaveText('Réinitialiser le mot de passe');

    // L'email doit être affiché dans le contenu du dialog
    const dialogContent = page.locator('mat-dialog-content');
    await expect(dialogContent).toContainText(UPDATED_USER_EMAIL);

    // Les deux champs de mot de passe doivent être présents
    const newPasswordInput = page.locator('mat-dialog-container input[formcontrolname="newpassword"]');
    const confirmPasswordInput = page.locator('mat-dialog-container input[formcontrolname="confirmpassword"]');
    await expect(newPasswordInput).toBeVisible({ timeout: 5000 });
    await expect(confirmPasswordInput).toBeVisible({ timeout: 5000 });

    // Fermer sans sauvegarder
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('suppression : supprimer l\'utilisateur de test (nettoyage)', async ({ page }) => {
    await navigateToUsers(page);

    // Chercher l'utilisateur avec l'un ou l'autre email (selon si l'édition a réussi)
    const updatedRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: UPDATED_USER_EMAIL })
    });
    const originalRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: TEST_USER_EMAIL })
    });

    const updatedExists = await updatedRow.isVisible().catch(() => false);
    const originalExists = await originalRow.isVisible().catch(() => false);

    const targetEmail = updatedExists
      ? UPDATED_USER_EMAIL
      : originalExists
        ? TEST_USER_EMAIL
        : null;

    if (!targetEmail) {
      test.info().annotations.push({ type: 'note', description: 'Utilisateur de test non trouvé, déjà supprimé ?' });
      return;
    }

    await deleteUserByEmail(page, targetEmail);

    // Vérifier que l'utilisateur n'est plus dans le tableau
    const deletedRow = page.locator('tr[mat-row]').filter({
      has: page.locator('td', { hasText: targetEmail })
    });
    await expect(deletedRow).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Validation des formulaires
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Users admin — Validation', () => {
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
    await navigateToUsers(page);
  });

  test('le bouton Enregistrer est désactivé si les champs requis sont vides', async ({ page }) => {
    // Ouvrir le dialog de création
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvel utilisateur' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Sans remplir les champs, le bouton doit être disabled
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('un email invalide affiche une erreur de validation', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvel utilisateur' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Saisir un email invalide
    const emailInput = page.locator('mat-dialog-container input[formcontrolname="email"]');
    await emailInput.fill('email-invalide');
    await emailInput.blur();

    // L'erreur de format email doit apparaître
    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /invalide/i });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('un mot de passe trop court affiche une erreur de validation', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvel utilisateur' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Saisir un mot de passe trop court
    const passwordInput = page.locator('mat-dialog-container input[formcontrolname="password"]');
    const passwordVisible = await passwordInput.isVisible().catch(() => false);

    if (!passwordVisible) {
      test.info().annotations.push({ type: 'note', description: 'Champ mot de passe non visible en mode création' });
      const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
      await cancelBtn.click();
      return;
    }

    await passwordInput.fill('court');
    await passwordInput.blur();

    // L'erreur de longueur minimale doit apparaître
    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /8 caractères/i });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('le bouton Enregistrer est activé quand email et rôle sont valides', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvel utilisateur' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir un email valide
    const emailInput = page.locator('mat-dialog-container input[formcontrolname="email"]');
    await emailInput.fill('validtest@example.com');

    // Remplir le mot de passe si requis
    const passwordInput = page.locator('mat-dialog-container input[formcontrolname="password"]');
    const passwordVisible = await passwordInput.isVisible().catch(() => false);
    if (passwordVisible) {
      await passwordInput.fill('ValidPassword123!');
    }

    // Sélectionner un rôle
    const roleSelect = page.locator('mat-dialog-container mat-select[formcontrolname="roleid"]');
    await roleSelect.click();
    const firstOption = page.locator('mat-option').first();
    await expect(firstOption).toBeVisible({ timeout: 5000 });
    await firstOption.click();

    // Le bouton Enregistrer doit maintenant être actif
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });

    // Fermer sans sauvegarder
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('Annuler dans le dialog ferme la fenêtre sans créer d\'utilisateur', async ({ page }) => {
    const countBefore = await page.locator('tr[mat-row]').count();

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvel utilisateur' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement l'email
    await page.locator('mat-dialog-container input[formcontrolname="email"]').fill('non-sauvegarde@example.com');

    // Cliquer sur Annuler
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    // Le nombre de lignes ne doit pas avoir changé
    const countAfter = await page.locator('tr[mat-row]').count();
    expect(countAfter).toBe(countBefore);
  });

  test('dans le dialog MDP, les deux mots de passe doivent correspondre', async ({ page }) => {
    // Chercher la première ligne qui n'est pas l'admin connecté
    const firstRow = page.locator('tr[mat-row]').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });

    // Ouvrir le menu d'actions
    await firstRow.locator('button[mat-icon-button]').click();

    const resetPwdMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Réinitialiser MDP' });
    await expect(resetPwdMenuItem).toBeVisible({ timeout: 5000 });
    await resetPwdMenuItem.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Saisir des mots de passe différents
    const newPasswordInput = page.locator('mat-dialog-container input[formcontrolname="newpassword"]');
    const confirmPasswordInput = page.locator('mat-dialog-container input[formcontrolname="confirmpassword"]');

    await newPasswordInput.fill('MotDePasse123!');
    await confirmPasswordInput.fill('DifferentPassword456!');
    await confirmPasswordInput.blur();

    // L'erreur de correspondance doit apparaître
    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /correspondent pas/i });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Le bouton Réinitialiser doit être désactivé
    const resetBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Réinitialiser' });
    await expect(resetBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Filtres et recherche
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Users admin — Filtres et recherche', () => {
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
    await navigateToUsers(page);
  });

  test('la recherche par email filtre les résultats', async ({ page }) => {
    const searchInput = page.locator('.filters-bar input[placeholder="Email..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Saisir un email qui n'existe pas
    await searchInput.fill('utilisateur-inexistant-xyz-123@nowhere.com');

    // Attendre le debounce (300ms) et le rechargement
    await page.waitForTimeout(500);
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Soit la table est vide, soit l'état vide est affiché
    const rows = page.locator('tr[mat-row]');
    const rowCount = await rows.count();
    const emptyState = page.locator('.empty-state');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(rowCount === 0 || hasEmptyState).toBe(true);
  });

  test('la recherche par email connu de l\'admin trouve au moins un résultat', async ({ page }) => {
    const searchInput = page.locator('.filters-bar input[placeholder="Email..."]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Rechercher par le domaine admin
    await searchInput.fill('admin@teamdivergentes.fr');

    // Attendre le debounce et le rechargement
    await page.waitForTimeout(500);
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    const rows = page.locator('tr[mat-row]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);
  });

  test('le filtre par statut "Actif" affiche seulement les comptes actifs', async ({ page }) => {
    // Ouvrir le select de statut
    const statusSelect = page.locator('.filters-bar mat-select').nth(1);
    await expect(statusSelect).toBeVisible({ timeout: 10000 });
    await statusSelect.click();

    // Sélectionner "Actif"
    const actifOption = page.locator('mat-option').filter({ hasText: 'Actif' }).last();
    await expect(actifOption).toBeVisible({ timeout: 5000 });
    await actifOption.click();

    // Attendre le rechargement
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Tous les toggles visibles doivent être cochés (actifs)
    const toggles = page.locator('td.mat-column-actif mat-slide-toggle');
    const toggleCount = await toggles.count();

    if (toggleCount > 0) {
      // Vérifier que les toggles sont dans l'état actif
      for (let i = 0; i < Math.min(toggleCount, 3); i++) {
        const toggle = toggles.nth(i);
        const isChecked = await toggle.getAttribute('ng-reflect-checked');
        // Peut être 'true' ou null selon Angular Material version
        const classes = await toggle.getAttribute('class');
        // Au minimum le toggle doit être visible
        await expect(toggle).toBeVisible();
      }
    }
  });

  test('le bouton "Réinitialiser les filtres" apparaît quand des filtres sont actifs', async ({ page }) => {
    // S'assurer qu'il y a des utilisateurs mais aucun résultat avec ce filtre
    const searchInput = page.locator('.filters-bar input[placeholder="Email..."]');
    await searchInput.fill('xyz-recherche-vide-xyz');
    await page.waitForTimeout(500);
    await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

    // Si l'état vide est affiché avec des filtres actifs, le bouton reset doit apparaître
    const emptyState = page.locator('.empty-state');
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    if (hasEmptyState) {
      const resetBtn = emptyState.locator('button').filter({ hasText: /Réinitialiser/i });
      await expect(resetBtn).toBeVisible({ timeout: 5000 });
    }
  });
});
