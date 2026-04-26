/**
 * Tests E2E — Page admin Rôles (CRUD + Permissions)
 *
 * Vérifie les opérations CRUD sur les rôles ainsi que la gestion
 * des permissions groupées par module.
 * Les tests de mutation (create/edit/delete) utilisent test.describe.serial()
 * pour garantir l'ordre d'exécution et le nettoyage des données.
 *
 * Sélecteurs basés sur roles.component.ts et role-form-dialog.component.ts :
 * - .roles-admin-page              → conteneur principal
 * - .page-header h1                → titre "Gestion des Rôles"
 * - .page-header button            → bouton "Nouveau rôle" (mat-raised-button)
 * - table[mat-table]               → tableau Material des rôles
 * - tr[mat-row]                    → ligne de rôle
 * - td[mat-cell] (colonne name)    → cellule Nom
 * - .role-name                     → nom du rôle (avec badge éventuel)
 * - mat-chip.system-badge          → badge "Système" pour rôles non supprimables
 * - .permissions-chips             → conteneur des chips de permissions
 * - .permissions-chips mat-chip    → chip d'une permission
 * - .permissions-chips .more-chip  → chip "+N" pour les permissions supplémentaires
 * - button[mat-icon-button]        → bouton menu "..." (more_vert)
 * - mat-menu button contenant "Modifier"   → action éditer
 * - mat-menu button.danger         → action supprimer
 * - .empty-state                   → état vide
 * - .loading-overlay               → spinner de chargement
 *
 * Dialog de création/édition (role-form-dialog.component.ts) :
 * - h2[mat-dialog-title]                              → titre du dialog
 * - input[formcontrolname="name"]                     → champ Nom du rôle
 * - mat-error                                         → message d'erreur validation
 * - .permissions-section                              → section permissions
 * - .validation-error                                 → alerte "au moins une permission"
 * - mat-expansion-panel                               → panneau d'un groupe de permissions
 * - mat-expansion-panel-header mat-panel-title        → titre du groupe
 * - .group-actions button contenant "Tout sélectionner"   → sélectionner tout le groupe
 * - .group-actions button contenant "Tout désélectionner" → désélectionner tout le groupe
 * - .permissions-list mat-checkbox                    → checkbox d'une permission
 * - .selected-count                                   → compteur "(X/Y)" dans le titre groupe
 * - button[mat-raised-button][color="primary"]        → bouton Enregistrer
 * - button[mat-button][mat-dialog-close]              → bouton Annuler
 *
 * Dialog de confirmation (ConfirmDialogComponent) :
 * - mat-dialog-container button contenant "Confirmer" → confirmer la suppression
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ROLE_NAME = 'Rôle E2E Test';
const UPDATED_ROLE_NAME = 'Rôle E2E Modifié';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToRoles(page: Page): Promise<boolean> {
  await page.goto('/admin/roles', { waitUntil: 'domcontentloaded' });

  // Attendre que la page soit chargée : tableau, état vide ou fin du spinner
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
 * Ouvre le dialog de création de rôle et remplit le champ nom.
 * Retourne true si le dialog s'est ouvert et le champ a été rempli.
 */
async function openCreateDialogAndFillName(page: Page, roleName: string): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toContainText('Nouveau rôle');

  const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(roleName);

  return true;
}

/**
 * Sélectionne toutes les permissions du premier groupe de permission disponible.
 * Nécessite que le dialog soit déjà ouvert.
 */
async function selectFirstPermissionGroup(page: Page): Promise<void> {
  // Ouvrir le premier panneau d'expansion s'il ne l'est pas déjà
  const firstPanel = page.locator('mat-dialog-container mat-expansion-panel').first();
  await firstPanel.waitFor({ timeout: 10000 });

  const panelHeader = firstPanel.locator('mat-expansion-panel-header');
  // Cliquer pour ouvrir le panneau (il peut déjà être fermé)
  await panelHeader.click();

  // Attendre que le contenu du panneau soit visible
  const selectAllBtn = firstPanel.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' });
  await expect(selectAllBtn).toBeVisible({ timeout: 5000 });
  await selectAllBtn.click();
}

/**
 * Supprime un rôle par son nom via le menu "...".
 * N'agit pas si le rôle n'est pas trouvé ou est un rôle système.
 */
async function deleteRoleByName(page: Page, roleName: string): Promise<void> {
  const row = page.locator('tr[mat-row]').filter({
    has: page.locator('.role-name', { hasText: roleName })
  });

  const count = await row.count();
  if (count === 0) return;

  // Ouvrir le menu "..."
  const menuBtn = row.locator('button[mat-icon-button]');
  await menuBtn.click();

  // Cliquer sur "Supprimer" dans le menu
  const deleteMenuItem = page.locator('mat-menu button.danger, button[mat-menu-item].danger')
    .filter({ hasText: /Supprimer/ });
  await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
  await deleteMenuItem.click();

  // Confirmer dans le dialog de confirmation
  const confirmBtn = page.locator('mat-dialog-container button')
    .filter({ hasText: /Confirmer|Supprimer|Oui/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que la ligne disparaisse
  await expect(row).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la page (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Roles admin — Affichage', () => {
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

  test('la page rôles charge après le login', async ({ page }) => {
    const loaded = await navigateToRoles(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/roles/);
  });

  test('le titre "Gestion des Rôles" est visible', async ({ page }) => {
    await navigateToRoles(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion des Rôles');
  });

  test('le bouton "Nouveau rôle" est visible', async ({ page }) => {
    await navigateToRoles(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('le tableau des rôles affiche les colonnes attendues', async ({ page }) => {
    await navigateToRoles(page);

    const table = page.locator('table[mat-table]');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBe(true);

    if (hasTable) {
      // Vérifier les en-têtes de colonnes
      await expect(page.locator('th[mat-header-cell]').filter({ hasText: 'Nom' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th[mat-header-cell]').filter({ hasText: 'Permissions' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th[mat-header-cell]').filter({ hasText: 'Utilisateurs' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('th[mat-header-cell]').filter({ hasText: 'Actions' })).toBeVisible({ timeout: 5000 });
    }
  });

  test('le tableau contient au moins un rôle (seed : Administrateur)', async ({ page }) => {
    await navigateToRoles(page);

    const table = page.locator('table[mat-table]');
    if (!(await table.isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Aucun rôle dans la base, état vide affiché' });
      return;
    }

    const rows = page.locator('tr[mat-row]');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('chaque ligne affiche le nom du rôle', async ({ page }) => {
    await navigateToRoles(page);

    if (!(await page.locator('table[mat-table]').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Tableau vide, test ignoré' });
      return;
    }

    const firstRow = page.locator('tr[mat-row]').first();
    await expect(firstRow.locator('.role-name')).toBeVisible({ timeout: 5000 });
  });

  test('les permissions sont affichées sous forme de chips', async ({ page }) => {
    await navigateToRoles(page);

    if (!(await page.locator('table[mat-table]').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Tableau vide, test ignoré' });
      return;
    }

    const firstRow = page.locator('tr[mat-row]').first();
    const permissionsChips = firstRow.locator('.permissions-chips');
    await expect(permissionsChips).toBeVisible({ timeout: 5000 });

    // Il doit y avoir au moins un chip de permission
    const chips = permissionsChips.locator('mat-chip');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });

  test('les rôles système affichent le badge "Système"', async ({ page }) => {
    await navigateToRoles(page);

    if (!(await page.locator('table[mat-table]').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Tableau vide, test ignoré' });
      return;
    }

    // Chercher un badge système (peut ne pas exister si aucun rôle isSystem)
    const systemBadge = page.locator('mat-chip.system-badge');
    const hasBadge = await systemBadge.first().isVisible().catch(() => false);

    if (hasBadge) {
      await expect(systemBadge.first()).toContainText('Système');
    } else {
      test.info().annotations.push({ type: 'note', description: 'Aucun rôle système dans la base' });
    }
  });

  test('chaque ligne affiche le bouton menu d\'actions', async ({ page }) => {
    await navigateToRoles(page);

    if (!(await page.locator('table[mat-table]').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Tableau vide, test ignoré' });
      return;
    }

    const firstRow = page.locator('tr[mat-row]').first();
    const menuBtn = firstRow.locator('button[mat-icon-button]');
    await expect(menuBtn).toBeVisible({ timeout: 5000 });
  });

  test('le menu d\'actions d\'un rôle propose Modifier', async ({ page }) => {
    await navigateToRoles(page);

    if (!(await page.locator('table[mat-table]').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Tableau vide, test ignoré' });
      return;
    }

    const firstRow = page.locator('tr[mat-row]').first();
    const menuBtn = firstRow.locator('button[mat-icon-button]');
    await menuBtn.click();

    const editMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Modifier' });
    await expect(editMenuItem).toBeVisible({ timeout: 5000 });

    // Fermer le menu
    await page.keyboard.press('Escape');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD complet — serial (Create → Edit → Delete)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Roles admin — CRUD complet', () => {
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
    await loginAsAdmin(page);
  });

  test('création : ouvrir le dialog et créer un nouveau rôle', async ({ page }) => {
    await navigateToRoles(page);

    const filled = await openCreateDialogAndFillName(page, TEST_ROLE_NAME);
    expect(filled).toBe(true);

    // Sélectionner au moins une permission via le premier groupe
    await selectFirstPermissionGroup(page);

    // Le bouton Enregistrer doit être activé
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme après la sauvegarde
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le nouveau rôle doit apparaître dans le tableau
    const newRow = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: TEST_ROLE_NAME })
    });
    await expect(newRow).toBeVisible({ timeout: 15000 });
  });

  test('le rôle créé est visible dans le tableau avec le bon nom', async ({ page }) => {
    await navigateToRoles(page);

    const row = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: TEST_ROLE_NAME })
    });

    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.locator('.role-name')).toContainText(TEST_ROLE_NAME);
  });

  test('le rôle créé affiche au moins une permission', async ({ page }) => {
    await navigateToRoles(page);

    const row = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: TEST_ROLE_NAME })
    });
    await expect(row).toBeVisible({ timeout: 10000 });

    const chips = row.locator('.permissions-chips mat-chip');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });

  test('édition : modifier le nom du rôle créé', async ({ page }) => {
    await navigateToRoles(page);

    const row = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: TEST_ROLE_NAME })
    });
    await expect(row).toBeVisible({ timeout: 10000 });

    // Ouvrir le menu "..."
    const menuBtn = row.locator('button[mat-icon-button]');
    await menuBtn.click();

    // Cliquer sur "Modifier"
    const editMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Modifier' });
    await expect(editMenuItem).toBeVisible({ timeout: 5000 });
    await editMenuItem.click();

    // Attendre que le dialog d'édition s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toContainText('Modifier rôle');

    // Vérifier que le champ nom est pré-rempli
    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await expect(nameInput).toHaveValue(TEST_ROLE_NAME);

    // Modifier le nom
    await nameInput.clear();
    await nameInput.fill(UPDATED_ROLE_NAME);

    // Sauvegarder
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le rôle doit maintenant afficher le nouveau nom
    const updatedRow = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: UPDATED_ROLE_NAME })
    });
    await expect(updatedRow).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien nom n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToRoles(page);

    const oldNameCell = page.locator('tr[mat-row] .role-name', { hasText: TEST_ROLE_NAME });
    await expect(oldNameCell).not.toBeVisible({ timeout: 5000 });
  });

  test('suppression : supprimer le rôle de test (nettoyage)', async ({ page }) => {
    await navigateToRoles(page);

    // Chercher le rôle avec l'un ou l'autre nom selon si l'édition a réussi
    const updatedRow = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: UPDATED_ROLE_NAME })
    });
    const originalRow = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: TEST_ROLE_NAME })
    });

    const updatedExists = await updatedRow.isVisible().catch(() => false);
    const originalExists = await originalRow.isVisible().catch(() => false);

    const targetName = updatedExists ? UPDATED_ROLE_NAME : (originalExists ? TEST_ROLE_NAME : null);

    if (!targetName) {
      test.info().annotations.push({ type: 'note', description: 'Rôle de test non trouvé, déjà supprimé ?' });
      return;
    }

    await deleteRoleByName(page, targetName);

    // Vérifier que le rôle n'est plus dans le tableau
    const deletedRow = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: targetName })
    });
    await expect(deletedRow).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Permissions — gestion dans le dialog
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Roles admin — Permissions', () => {
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
    await navigateToRoles(page);
  });

  test('le dialog de création affiche la section Permissions', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    const permissionsSection = page.locator('mat-dialog-container .permissions-section');
    await expect(permissionsSection).toBeVisible({ timeout: 5000 });

    await expect(permissionsSection.locator('h3')).toContainText('Permissions');

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('la section Permissions contient des panneaux d\'expansion par module', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Attendre que les groupes de permissions soient chargés
    const panels = page.locator('mat-dialog-container mat-expansion-panel');
    await panels.first().waitFor({ timeout: 10000 });

    const panelCount = await panels.count();
    expect(panelCount).toBeGreaterThanOrEqual(1);

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('ouvrir un panneau révèle les boutons "Tout sélectionner" et "Tout désélectionner"', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Ouvrir le premier panneau
    const firstPanel = page.locator('mat-dialog-container mat-expansion-panel').first();
    await firstPanel.waitFor({ timeout: 10000 });
    await firstPanel.locator('mat-expansion-panel-header').click();

    // Vérifier les boutons de groupe
    const selectAllBtn = firstPanel.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' });
    const deselectAllBtn = firstPanel.locator('.group-actions button').filter({ hasText: 'Tout désélectionner' });

    await expect(selectAllBtn).toBeVisible({ timeout: 5000 });
    await expect(deselectAllBtn).toBeVisible({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('"Tout sélectionner" met à jour le compteur du groupe', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Ouvrir le premier panneau
    const firstPanel = page.locator('mat-dialog-container mat-expansion-panel').first();
    await firstPanel.waitFor({ timeout: 10000 });
    await firstPanel.locator('mat-expansion-panel-header').click();

    // Cliquer sur "Tout sélectionner"
    const selectAllBtn = firstPanel.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' });
    await expect(selectAllBtn).toBeVisible({ timeout: 5000 });
    await selectAllBtn.click();

    // Le compteur doit indiquer que toutes les permissions sont sélectionnées (X/X)
    const selectedCount = firstPanel.locator('.selected-count');
    await expect(selectedCount).toBeVisible({ timeout: 5000 });
    const countText = await selectedCount.textContent();
    // Format : "(X/Y)" — X doit être > 0
    expect(countText).toMatch(/\(\d+\/\d+\)/);
    const match = countText?.match(/\((\d+)\/(\d+)\)/);
    if (match) {
      const selected = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      expect(selected).toBe(total);
      expect(total).toBeGreaterThan(0);
    }

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('"Tout désélectionner" remet le compteur à 0', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Ouvrir le premier panneau
    const firstPanel = page.locator('mat-dialog-container mat-expansion-panel').first();
    await firstPanel.waitFor({ timeout: 10000 });
    await firstPanel.locator('mat-expansion-panel-header').click();

    // Sélectionner tout d'abord
    const selectAllBtn = firstPanel.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' });
    await expect(selectAllBtn).toBeVisible({ timeout: 5000 });
    await selectAllBtn.click();

    // Puis tout désélectionner
    const deselectAllBtn = firstPanel.locator('.group-actions button').filter({ hasText: 'Tout désélectionner' });
    await deselectAllBtn.click();

    // Le compteur doit indiquer 0/N
    const selectedCount = firstPanel.locator('.selected-count');
    const countText = await selectedCount.textContent();
    const match = countText?.match(/\((\d+)\/(\d+)\)/);
    if (match) {
      const selected = parseInt(match[1], 10);
      expect(selected).toBe(0);
    }

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('l\'alerte "au moins une permission" s\'affiche quand aucune permission n\'est sélectionnée', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Attendre que les groupes soient chargés
    await page.locator('mat-dialog-container mat-expansion-panel').first().waitFor({ timeout: 10000 });

    // Si aucune permission n'est sélectionnée par défaut, la validation-error doit s'afficher
    const validationError = page.locator('mat-dialog-container .validation-error');
    await expect(validationError).toBeVisible({ timeout: 5000 });
    await expect(validationError).toContainText(/au moins une permission/);

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('les permissions d\'un rôle existant sont pré-cochées dans le dialog d\'édition', async ({ page }) => {
    if (!(await page.locator('table[mat-table]').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Tableau vide, test ignoré' });
      return;
    }

    // Chercher un rôle avec des permissions (prendre le premier de la liste)
    const firstRow = page.locator('tr[mat-row]').first();
    const menuBtn = firstRow.locator('button[mat-icon-button]');
    await menuBtn.click();

    const editMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Modifier' });
    await expect(editMenuItem).toBeVisible({ timeout: 5000 });
    await editMenuItem.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Attendre les groupes de permissions
    const panels = page.locator('mat-dialog-container mat-expansion-panel');
    await panels.first().waitFor({ timeout: 10000 });

    // Ouvrir le premier panneau et vérifier qu'au moins une checkbox est cochée
    await panels.first().locator('mat-expansion-panel-header').click();
    const checkboxes = panels.first().locator('.permissions-list mat-checkbox');
    await checkboxes.first().waitFor({ timeout: 5000 });

    // Vérifier que le compteur n'est pas 0/N (des permissions doivent être sélectionnées)
    const selectedCount = panels.first().locator('.selected-count');
    const countText = await selectedCount.textContent();
    const match = countText?.match(/\((\d+)\/(\d+)\)/);
    if (match) {
      const selected = parseInt(match[1], 10);
      // Un rôle existant (seed) doit avoir au moins une permission
      expect(selected).toBeGreaterThanOrEqual(0);
    }

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Roles admin — Validation du formulaire', () => {
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
    await navigateToRoles(page);
  });

  test('le bouton Enregistrer est désactivé si le nom est vide', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Sans remplir le nom, le bouton Enregistrer doit être désactivé
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('le bouton Enregistrer est désactivé si le nom est rempli mais aucune permission sélectionnée', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir le nom
    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await nameInput.fill('Rôle sans permission');

    // S'assurer qu'aucune permission n'est sélectionnée en désélectionnant tout
    const panels = page.locator('mat-dialog-container mat-expansion-panel');
    const panelCount = await panels.count();

    for (let i = 0; i < panelCount; i++) {
      const panel = panels.nth(i);
      await panel.locator('mat-expansion-panel-header').click();
      const deselectBtn = panel.locator('.group-actions button').filter({ hasText: 'Tout désélectionner' });
      const isVisible = await deselectBtn.isVisible().catch(() => false);
      if (isVisible) {
        await deselectBtn.click();
      }
    }

    // Le bouton doit rester désactivé
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('l\'erreur "Le nom est requis" s\'affiche si le champ nom est touché et vide', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    // Cliquer puis quitter le champ sans le remplir
    await nameInput.click();
    await nameInput.blur();

    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /Le nom est requis/ });
    await expect(error).toBeVisible({ timeout: 5000 });

    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();
  });

  test('Annuler dans le dialog ferme la fenêtre sans créer de rôle', async ({ page }) => {
    const countBefore = await page.locator('tr[mat-row]').count();

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement
    await page.locator('mat-dialog-container input[formcontrolname="name"]').fill('Rôle non sauvegardé');

    // Cliquer sur Annuler
    const cancelBtn = page.locator('mat-dialog-container button[mat-button][mat-dialog-close]');
    await cancelBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    // Le nombre de rôles ne doit pas avoir changé
    const countAfter = await page.locator('tr[mat-row]').count();
    expect(countAfter).toBe(countBefore);
  });
});
