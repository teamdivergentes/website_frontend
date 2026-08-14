/**
 * Tests E2E — Page admin Rôles (CRUD + Permissions)
 *
 * Vérifie les opérations CRUD sur les rôles ainsi que la gestion
 * des permissions groupées par module.
 * Les tests de mutation (create/edit/delete) utilisent test.describe.serial()
 * pour garantir l'ordre d'exécution et le nettoyage des données.
 *
 * **Le formulaire n'est plus un dialogue.** Depuis l'EPIC-41 feature 3, la
 * création et l'édition vivent sur `/admin/roles/new` et
 * `/admin/roles/edit/:id`. Les sélecteurs `mat-dialog-container`,
 * `h2[mat-dialog-title]` et `button[mat-dialog-close]` ont disparu avec lui —
 * ce dernier ne désignait d'ailleurs plus rien depuis le passage au pied
 * d'action partagé, et les tests qui le visaient ne pouvaient que timeouter.
 *
 * Sélecteurs de la liste (roles.component.ts) :
 * - .roles-admin-page              → conteneur principal
 * - .page-header h1                → titre "Gestion des Rôles"
 * - .page-header button            → bouton "Nouveau rôle" (mat-raised-button)
 * - table[mat-table]               → tableau Material des rôles
 * - tr[mat-row]                    → ligne de rôle
 * - .role-name                     → nom du rôle (avec badge éventuel)
 * - mat-chip.system-badge          → badge "Système" pour rôles non supprimables
 * - .permissions-chips mat-chip    → chip d'une permission
 * - .permissions-chips .more-chip  → chip "+N" pour les permissions supplémentaires
 * - button[mat-icon-button]        → bouton menu "..." (more_vert)
 * - button[mat-menu-item] "Modifier" → action éditer
 * - button[mat-menu-item].danger   → action supprimer
 * - .empty-state                   → état vide
 * - .loading-overlay               → spinner de chargement
 * - app-error-state                → bandeau d'erreur de chargement
 *
 * Sélecteurs de la page de formulaire (role-form-page.component.ts) :
 * - .page-header h1                → titre ("Nouveau rôle" / "Modifier le rôle")
 * - .page-header .back-button      → retour à la liste
 * - input[formcontrolname="name"]  → champ Nom du rôle
 * - mat-error                      → message d'erreur de validation
 * - .permissions-section           → section Permissions
 * - [data-testid="permissions-tally"] → total coché, toutes cartes confondues
 * - .validation-error              → alerte "au moins une permission"
 * - .permission-group              → carte d'un module (plus d'accordéon)
 * - .permission-group .group-name  → nom du module
 * - .permission-group .selected-count → compteur "(X/Y)" du module
 * - .group-actions button "Tout sélectionner" / "Tout désélectionner"
 * - .permissions-list mat-checkbox → case d'une permission
 * - [data-testid="form-submit"]    → validation ("Créer" / "Enregistrer")
 * - [data-testid="form-cancel"]    → Annuler
 * - [data-testid="error-retry"]    → réessai après un identifiant inconnu
 *
 * Dialog de confirmation (ConfirmDialogComponent) :
 * - mat-dialog-container button contenant "Confirmer" → confirmer
 * - mat-dialog-container button contenant "Quitter"   → abandonner une saisie
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

  await page.locator('.loading-overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

  return loaded;
}

/** La page de formulaire est prête quand sa matrice est rendue. */
async function waitForFormPage(page: Page): Promise<void> {
  await expect(page.locator('input[formcontrolname="name"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.permission-group').first()).toBeVisible({ timeout: 10000 });
}

/**
 * Ouvre la page de création et remplit le nom.
 *
 * On attend une URL, plus l'apparition d'un overlay : c'est tout l'objet de la
 * migration, la création est désormais adressable.
 */
async function openCreatePageAndFillName(page: Page, roleName: string): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau rôle' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const opened = await page
    .waitForURL('**/admin/roles/new', { timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!opened) return false;

  await expect(page.locator('.page-header h1')).toContainText('Nouveau rôle');
  await waitForFormPage(page);

  await page.locator('input[formcontrolname="name"]').fill(roleName);
  return true;
}

/** Coche tout le contenu du module désigné, ou du premier module rendu. */
async function selectWholeGroup(page: Page, moduleName?: string): Promise<void> {
  const group = moduleName
    ? page.locator('.permission-group').filter({ hasText: moduleName }).first()
    : page.locator('.permission-group').first();

  await expect(group).toBeVisible({ timeout: 10000 });

  const selectAllBtn = group.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' });
  await expect(selectAllBtn).toBeVisible({ timeout: 5000 });
  await selectAllBtn.click();
}

/** Supprime un rôle par son nom via le menu "...". */
async function deleteRoleByName(page: Page, roleName: string): Promise<void> {
  const row = page.locator('tr[mat-row]').filter({
    has: page.locator('.role-name', { hasText: roleName })
  });

  const count = await row.count();
  if (count === 0) return;

  const menuBtn = row.locator('button[mat-icon-button]');
  await menuBtn.click();

  const deleteMenuItem = page.locator('button[mat-menu-item].danger').filter({ hasText: /Supprimer/ });
  await expect(deleteMenuItem).toBeVisible({ timeout: 5000 });
  await deleteMenuItem.click();

  const confirmBtn = page.locator('mat-dialog-container button')
    .filter({ hasText: /Confirmer|Supprimer|Oui/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  await expect(row).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la liste (lecture seule)
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

  test('création : ouvrir la page et créer un nouveau rôle', async ({ page }) => {
    await navigateToRoles(page);

    const filled = await openCreatePageAndFillName(page, TEST_ROLE_NAME);
    expect(filled).toBe(true);

    await selectWholeGroup(page, 'Jeux');

    const saveBtn = page.locator('[data-testid="form-submit"]');
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le retour à la liste remplace la fermeture du dialogue.
    await page.waitForURL('**/admin/roles', { timeout: 15000 });

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

    await row.locator('button[mat-icon-button]').click();

    const editMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Modifier' });
    await expect(editMenuItem).toBeVisible({ timeout: 5000 });
    await editMenuItem.click();

    // L'édition a désormais une URL : elle se partage en support.
    await page.waitForURL(/\/admin\/roles\/edit\/\d+/, { timeout: 10000 });
    await expect(page.locator('.page-header h1')).toContainText('Modifier le rôle');
    await waitForFormPage(page);

    const nameInput = page.locator('input[formcontrolname="name"]');
    await expect(nameInput).toHaveValue(TEST_ROLE_NAME);

    await nameInput.clear();
    await nameInput.fill(UPDATED_ROLE_NAME);

    const saveBtn = page.locator('[data-testid="form-submit"]');
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    await page.waitForURL('**/admin/roles', { timeout: 15000 });

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

    const deletedRow = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: targetName })
    });
    await expect(deletedRow).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : la matrice de permissions sur une page entière
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
    await page.goto('/admin/roles/new', { waitUntil: 'domcontentloaded' });
    await waitForFormPage(page);
  });

  test('la page de création affiche la section Permissions', async ({ page }) => {
    const permissionsSection = page.locator('.permissions-section');
    await expect(permissionsSection).toBeVisible({ timeout: 5000 });
    await expect(permissionsSection.locator('.section-label')).toContainText('Permissions');
  });

  test('tous les modules sont visibles sans rien déplier', async ({ page }) => {
    // C'est le gain de la migration : le dialogue repliait chaque module
    // derrière un accordéon pour tenir dans la hauteur d'une modale.
    const groups = page.locator('.permission-group');
    expect(await groups.count()).toBeGreaterThanOrEqual(2);

    await expect(groups.first().locator('.permissions-list mat-checkbox').first()).toBeVisible({ timeout: 5000 });
    await expect(groups.last().locator('.permissions-list mat-checkbox').first()).toBeVisible({ timeout: 5000 });

    // Plus aucun accordéon dans la page.
    expect(await page.locator('mat-expansion-panel').count()).toBe(0);
  });

  test('chaque module porte ses boutons "Tout sélectionner" / "Tout désélectionner"', async ({ page }) => {
    const firstGroup = page.locator('.permission-group').first();

    await expect(firstGroup.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' })).toBeVisible({ timeout: 5000 });
    await expect(firstGroup.locator('.group-actions button').filter({ hasText: 'Tout désélectionner' })).toBeVisible({ timeout: 5000 });
  });

  test('"Tout sélectionner" met à jour le compteur du module', async ({ page }) => {
    const firstGroup = page.locator('.permission-group').first();
    await firstGroup.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' }).click();

    const selectedCount = firstGroup.locator('.selected-count');
    await expect(selectedCount).toBeVisible({ timeout: 5000 });

    const countText = await selectedCount.textContent();
    expect(countText).toMatch(/\(\d+\/\d+\)/);

    const match = countText?.match(/\((\d+)\/(\d+)\)/);
    if (match) {
      const selected = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      expect(selected).toBe(total);
      expect(total).toBeGreaterThan(0);
    }
  });

  test('"Tout désélectionner" remet le compteur du module à 0', async ({ page }) => {
    const firstGroup = page.locator('.permission-group').first();
    await firstGroup.locator('.group-actions button').filter({ hasText: 'Tout sélectionner' }).click();
    await firstGroup.locator('.group-actions button').filter({ hasText: 'Tout désélectionner' }).click();

    const countText = await firstGroup.locator('.selected-count').textContent();
    const match = countText?.match(/\((\d+)\/(\d+)\)/);
    if (match) {
      expect(parseInt(match[1], 10)).toBe(0);
    }
  });

  test('le total de section suit les modules', async ({ page }) => {
    const tally = page.locator('[data-testid="permissions-tally"]');
    await expect(tally).toContainText(/^\s*0\//, { timeout: 5000 });

    await selectWholeGroup(page);
    await expect(tally).not.toContainText(/^\s*0\//, { timeout: 5000 });
  });

  test('l\'alerte "au moins une permission" s\'affiche tant que rien n\'est coché', async ({ page }) => {
    const validationError = page.locator('.validation-error');
    await expect(validationError).toBeVisible({ timeout: 5000 });
    await expect(validationError).toContainText(/au moins une permission/);

    await selectWholeGroup(page);
    await expect(validationError).toBeHidden({ timeout: 5000 });
  });

  test('les permissions d\'un rôle existant sont pré-cochées', async ({ page }) => {
    await navigateToRoles(page);

    if (!(await page.locator('table[mat-table]').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Tableau vide, test ignoré' });
      return;
    }

    const firstRow = page.locator('tr[mat-row]').first();
    await firstRow.locator('button[mat-icon-button]').click();

    const editMenuItem = page.locator('button[mat-menu-item]').filter({ hasText: 'Modifier' });
    await expect(editMenuItem).toBeVisible({ timeout: 5000 });
    await editMenuItem.click();

    await page.waitForURL(/\/admin\/roles\/edit\/\d+/, { timeout: 10000 });
    await waitForFormPage(page);

    // Un rôle du seed a forcément au moins une permission.
    const tally = page.locator('[data-testid="permissions-tally"]');
    const tallyText = (await tally.textContent())?.trim() ?? '';
    const match = tallyText.match(/(\d+)\/(\d+)/);
    expect(match).not.toBeNull();
    if (match) {
      expect(parseInt(match[1], 10)).toBeGreaterThanOrEqual(1);
    }
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
    await page.goto('/admin/roles/new', { waitUntil: 'domcontentloaded' });
    await waitForFormPage(page);
  });

  test('le bouton de validation est désactivé si le nom est vide', async ({ page }) => {
    await expect(page.locator('[data-testid="form-submit"]')).toBeDisabled({ timeout: 5000 });
  });

  test('le bouton reste désactivé si le nom est rempli mais aucune permission cochée', async ({ page }) => {
    await page.locator('input[formcontrolname="name"]').fill('Rôle sans permission');
    await expect(page.locator('[data-testid="form-submit"]')).toBeDisabled({ timeout: 5000 });
  });

  test('l\'erreur "Le nom est requis" s\'affiche si le champ nom est touché et vide', async ({ page }) => {
    const nameInput = page.locator('input[formcontrolname="name"]');
    await nameInput.click();
    await nameInput.blur();

    await expect(page.locator('mat-error').filter({ hasText: /Le nom est requis/ })).toBeVisible({ timeout: 5000 });
  });

  test('Annuler revient à la liste sans créer de rôle', async ({ page }) => {
    await page.locator('[data-testid="form-cancel"]').click();

    await page.waitForURL('**/admin/roles', { timeout: 10000 });
    await expect(page.locator('.page-header h1')).toHaveText('Gestion des Rôles');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 5 : garde de sortie — non-régression de la migration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Roles admin — Garde de sortie', () => {
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
    await page.goto('/admin/roles/new', { waitUntil: 'domcontentloaded' });
    await waitForFormPage(page);
  });

  test('une saisie dans le nom retient le retour arrière', async ({ page }) => {
    await page.locator('input[formcontrolname="name"]').fill('Brouillon E2E');
    await page.locator('.page-header .back-button').click();

    const confirm = page.locator('mat-dialog-container');
    await expect(confirm).toBeVisible({ timeout: 5000 });
    await expect(confirm).toContainText(/non enregistrées/);

    // Rester sur place : on refuse d'abandonner.
    await confirm.locator('button').filter({ hasText: /Annuler/ }).click();
    await expect(page).toHaveURL(/\/admin\/roles\/new/);
    await expect(page.locator('input[formcontrolname="name"]')).toHaveValue('Brouillon E2E');
  });

  test('une permission cochée retient aussi le retour arrière', async ({ page }) => {
    // La matrice n'est pas un champ de saisie : c'est le cas que la migration
    // pouvait manquer si les cases vivaient hors du formulaire réactif.
    await selectWholeGroup(page);
    await page.locator('.page-header .back-button').click();

    const confirm = page.locator('mat-dialog-container');
    await expect(confirm).toBeVisible({ timeout: 5000 });
    await expect(confirm).toContainText(/non enregistrées/);

    await confirm.locator('button').filter({ hasText: /Quitter/ }).click();
    await page.waitForURL('**/admin/roles', { timeout: 10000 });
  });

  test('un formulaire intact se quitte sans rien demander', async ({ page }) => {
    await page.locator('.page-header .back-button').click();

    await page.waitForURL('**/admin/roles', { timeout: 10000 });
    expect(await page.locator('mat-dialog-container').count()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 6 : identifiant inconnu
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Roles admin — Identifiant inconnu', () => {
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

  test('un rôle inexistant affiche un état d\'erreur réessayable', async ({ page }) => {
    // Un formulaire vide ferait croire à une création, et l'enregistrement
    // échouerait ensuite sur une route d'édition.
    await page.goto('/admin/roles/edit/999999', { waitUntil: 'domcontentloaded' });

    const errorState = page.locator('app-error-state');
    await expect(errorState).toBeVisible({ timeout: 15000 });
    await expect(errorState).toContainText(/Impossible de charger ce rôle/);
    await expect(page.locator('[data-testid="error-retry"]')).toBeVisible({ timeout: 5000 });
    expect(await page.locator('input[formcontrolname="name"]').count()).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 7 : parcours complet — un rôle créé ouvre bien les pages qu'il accorde
// ─────────────────────────────────────────────────────────────────────────────

const JOURNEY_ROLE_NAME = 'Rôle E2E Parcours';
const JOURNEY_USER_EMAIL = 'e2e-parcours-role@teamdivergentes.fr';
const JOURNEY_USER_PASSWORD = 'E2eParcours!2026';

test.describe.serial('Page Roles admin — Parcours de bout en bout', () => {
  test('un compte portant le rôle créé accède aux pages accordées, et à elles seules', async ({ page }) => {
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

    // ── 1. Créer le rôle depuis la page, en ne cochant que le module Jeux ──
    await navigateToRoles(page);
    const filled = await openCreatePageAndFillName(page, JOURNEY_ROLE_NAME);
    expect(filled).toBe(true);
    await selectWholeGroup(page, 'Jeux');
    await page.locator('[data-testid="form-submit"]').click();
    await page.waitForURL('**/admin/roles', { timeout: 15000 });

    const createdRow = page.locator('tr[mat-row]').filter({
      has: page.locator('.role-name', { hasText: JOURNEY_ROLE_NAME })
    });
    await expect(createdRow).toBeVisible({ timeout: 15000 });

    // ── 2. Rattacher un compte de test à ce rôle ──
    // Provisionné par l'API : le parcours à vérifier est celui du rôle, pas
    // celui de la page utilisateurs, qui a ses propres tests.
    const rolesResponse = await page.request.get('/api/roles');
    expect(rolesResponse.ok()).toBe(true);
    const roles = (await rolesResponse.json()) as Array<{ id: number; name: string }>;
    const journeyRole = roles.find((role) => role.name === JOURNEY_ROLE_NAME);
    expect(journeyRole).toBeTruthy();

    const created = await page.request.post('/api/users', {
      data: {
        email: JOURNEY_USER_EMAIL,
        password: JOURNEY_USER_PASSWORD,
        roleId: journeyRole!.id,
        actif: true,
      },
    });
    if (!created.ok()) {
      test.info().annotations.push({
        type: 'note',
        description: `Création du compte de test impossible (${created.status()}), parcours abrégé`,
      });
    }
    const createdUser = created.ok()
      ? ((await created.json()) as { id: number })
      : null;

    try {
      if (!createdUser) return;

      // ── 3. Se connecter avec ce compte ──
      await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
      await page.locator('#email').fill(JOURNEY_USER_EMAIL);
      await page.locator('#password').fill(JOURNEY_USER_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/admin/, { timeout: 15000 });

      // ── 4. La page accordée s'ouvre ──
      await page.goto('/admin/games', { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(/\/admin\/games/, { timeout: 10000 });

      // ── 5. Une page non accordée renvoie au tableau de bord ──
      await page.goto('/admin/sponsors', { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/admin\/sponsors/, { timeout: 10000 });
    } finally {
      // ── 6. Nettoyage : compte puis rôle, dans cet ordre ──
      await loginAsAdmin(page);
      if (createdUser) {
        await page.request.delete(`/api/users/${createdUser.id}`).catch(() => undefined);
      }
      await navigateToRoles(page);
      await deleteRoleByName(page, JOURNEY_ROLE_NAME).catch(() => undefined);
    }
  });
});
