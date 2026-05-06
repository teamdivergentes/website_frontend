/**
 * Tests E2E — Page admin Staff (CRUD)
 *
 * Vérifie les opérations CRUD sur les membres du staff :
 * affichage par catégorie, création, édition, suppression.
 * Les tests de mutation utilisent test.describe.serial() pour garantir
 * l'ordre et le nettoyage des données de test.
 *
 * Sélecteurs basés sur staff-list.component.html et staff-form.component.ts :
 * - .staff-list-page            → conteneur principal
 * - .page-header h1             → titre "Gestion du Staff"
 * - .page-header button.btn-primary → bouton "Ajouter un membre"
 * - .category-tabs              → onglets de filtrage par catégorie
 * - .category-tabs .tab         → bouton d'onglet
 * - .category-tabs .tab.active  → onglet actif
 * - .staff-grid                 → grille de membres (cdkDropList)
 * - .staff-card                 → carte d'un membre
 * - .member-info h3             → nom du membre
 * - .member-info .role          → rôle du membre
 * - .member-info .badge         → badge catégorie
 * - .card-actions               → boutons d'action (éditer, supprimer)
 * - .btn-icon.btn-edit          → bouton éditer
 * - .btn-icon.btn-delete        → bouton supprimer
 * - .skeleton-grid              → skeleton loading
 * - .empty-state                → état vide
 *
 * Dialog MatDialog (staff-form.component.ts template inline) :
 * - h2[mat-dialog-title]                → titre dialog
 * - input[formcontrolname="name"]       → champ nom
 * - input[formcontrolname="role"]       → champ rôle
 * - mat-select[formcontrolname="category"] → select catégorie
 * - mat-option                          → options du select
 * - button[mat-raised-button][color="primary"] → bouton Créer/Mettre à jour
 * - button[mat-button]                  → bouton Annuler
 *
 * Dialog de confirmation :
 * - mat-dialog-container button contenant "Confirmer" → confirmer la suppression
 */

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_STAFF_NAME = 'Membre E2E Test';
const TEST_STAFF_ROLE = 'Testeur Automatisé';
const UPDATED_STAFF_NAME = 'Membre E2E Modifié';
const UPDATED_STAFF_ROLE = 'Testeur Senior';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page): Promise<boolean> {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  const formVisible = await page.locator('form').waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!formVisible) return false;

  await page.locator('#email').fill('admin@teamdivergentes.fr');
  await page.locator('#password').fill('admin123');
  await page.locator('button[type="submit"]').click();

  return page
    .waitForURL(/\/admin/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
}

async function navigateToStaff(page: Page): Promise<boolean> {
  await page.goto('/admin/staff', { waitUntil: 'domcontentloaded' });

  const loaded = await Promise.race([
    page.locator('.staff-grid').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-state').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.skeleton-grid[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  // Attendre que le skeleton disparaisse si présent
  await page.locator('.skeleton-grid[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

  return loaded;
}

async function isBackendAvailable(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/config', { timeout: 5000 });
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Ouvre le dialog d'ajout de membre et remplit les champs obligatoires.
 * La catégorie est sélectionnée via le select Material.
 */
async function openCreateDialogAndFill(
  page: Page,
  name: string,
  role: string,
  category: 'Administration' | 'Headstaff' | 'Ambassadeur' = 'Administration'
): Promise<boolean> {
  const createBtn = page.locator('.page-header button.btn-primary').filter({ hasText: 'Ajouter un membre' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toContainText(/Ajouter un membre/);

  // Champ Nom
  const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(name);

  // Champ Rôle
  const roleInput = page.locator('mat-dialog-container input[formcontrolname="role"]');
  await expect(roleInput).toBeVisible({ timeout: 5000 });
  await roleInput.fill(role);

  // Select Catégorie — cliquer sur le select pour l'ouvrir
  const categorySelect = page.locator('mat-dialog-container mat-select[formcontrolname="category"]');
  await expect(categorySelect).toBeVisible({ timeout: 5000 });
  await categorySelect.click();

  // Sélectionner l'option souhaitée dans le panneau Material
  const option = page.locator('mat-option').filter({ hasText: category });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();

  return true;
}

/**
 * Supprime un membre par son nom. Cherche dans la grille active.
 */
async function deleteStaffByName(page: Page, memberName: string): Promise<void> {
  const card = page.locator('.staff-card').filter({
    has: page.locator('h3', { hasText: memberName })
  });

  const count = await card.count();
  if (count === 0) return;

  const deleteBtn = card.locator(`button[aria-label="Supprimer ${memberName}"]`);
  await deleteBtn.click();

  // Confirmer dans le dialog de suppression
  const confirmBtn = page.locator('mat-dialog-container').locator('button').filter({ hasText: /Confirmer|Supprimer|Oui/ }).last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que la carte disparaisse
  await expect(card).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la page (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Staff admin — Affichage', () => {
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

  test('la page staff charge après le login', async ({ page }) => {
    const loaded = await navigateToStaff(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/staff/);
  });

  test('le titre "Gestion du Staff" est visible', async ({ page }) => {
    await navigateToStaff(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion du Staff');
  });

  test('le bouton "Ajouter un membre" est visible', async ({ page }) => {
    await navigateToStaff(page);
    const btn = page.locator('.page-header button.btn-primary').filter({ hasText: 'Ajouter un membre' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('les 3 onglets de catégorie sont présents', async ({ page }) => {
    await navigateToStaff(page);
    const tabs = page.locator('.category-tabs .tab');

    await expect(tabs).toHaveCount(3);

    // Vérifier les textes des onglets (avec compteur entre parenthèses)
    await expect(tabs.nth(0)).toContainText('Administration');
    await expect(tabs.nth(1)).toContainText('Headstaff');
    await expect(tabs.nth(2)).toContainText('Ambassadeurs');
  });

  test('l\'onglet "Administration" est actif par défaut', async ({ page }) => {
    await navigateToStaff(page);
    const activeTab = page.locator('.category-tabs .tab.active');
    await expect(activeTab).toBeVisible({ timeout: 10000 });
    await expect(activeTab).toContainText('Administration');
  });

  test('clic sur l\'onglet "Headstaff" filtre la liste', async ({ page }) => {
    await navigateToStaff(page);

    const headstaffTab = page.locator('.category-tabs .tab').filter({ hasText: 'Headstaff' });
    await headstaffTab.click();

    // L'onglet Headstaff doit être actif
    await expect(headstaffTab).toHaveClass(/active/, { timeout: 5000 });
  });

  test('clic sur l\'onglet "Ambassadeurs" filtre la liste', async ({ page }) => {
    await navigateToStaff(page);

    const ambassadorsTab = page.locator('.category-tabs .tab').filter({ hasText: 'Ambassadeurs' });
    await ambassadorsTab.click();

    await expect(ambassadorsTab).toHaveClass(/active/, { timeout: 5000 });
  });

  test('la grille de membres s\'affiche (ou état vide si aucun membre)', async ({ page }) => {
    await navigateToStaff(page);

    const hasGrid = await page.locator('.staff-grid').isVisible().catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible().catch(() => false);

    expect(hasGrid || hasEmpty).toBe(true);
  });

  test('chaque carte de membre affiche le nom, le rôle et le badge catégorie', async ({ page }) => {
    await navigateToStaff(page);

    const hasGrid = await page.locator('.staff-grid').isVisible().catch(() => false);
    if (!hasGrid) {
      test.info().annotations.push({ type: 'note', description: 'Aucun membre dans la catégorie Administration' });
      return;
    }

    const firstCard = page.locator('.staff-card').first();
    await expect(firstCard.locator('.member-info h3')).toBeVisible({ timeout: 5000 });
    await expect(firstCard.locator('.member-info .role')).toBeVisible({ timeout: 5000 });
    await expect(firstCard.locator('.member-info .badge')).toBeVisible({ timeout: 5000 });
  });

  test('chaque carte affiche les boutons éditer et supprimer', async ({ page }) => {
    await navigateToStaff(page);

    if (!(await page.locator('.staff-grid').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Aucun membre, test ignoré' });
      return;
    }

    const firstCard = page.locator('.staff-card').first();
    await expect(firstCard.locator('.btn-icon.btn-edit')).toBeVisible({ timeout: 5000 });
    await expect(firstCard.locator('.btn-icon.btn-delete')).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD complet — serial (Create → Edit → Delete)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Staff admin — CRUD complet', () => {
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

  test('création : ajouter un nouveau membre du staff', async ({ page }) => {
    await navigateToStaff(page);

    const filled = await openCreateDialogAndFill(page, TEST_STAFF_NAME, TEST_STAFF_ROLE, 'Administration');
    expect(filled).toBe(true);

    // Cliquer sur "Créer"
    const createBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Créer/ });
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    await createBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le nouveau membre doit apparaître dans la liste Administration
    const newCard = page.locator('.staff-card').filter({
      has: page.locator('h3', { hasText: TEST_STAFF_NAME })
    });
    await expect(newCard).toBeVisible({ timeout: 15000 });
  });

  test('le membre créé affiche le bon nom et le bon rôle', async ({ page }) => {
    await navigateToStaff(page);

    const card = page.locator('.staff-card').filter({
      has: page.locator('h3', { hasText: TEST_STAFF_NAME })
    });

    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card.locator('.role')).toContainText(TEST_STAFF_ROLE);
  });

  test('édition : modifier le nom et le rôle du membre créé', async ({ page }) => {
    await navigateToStaff(page);

    const card = page.locator('.staff-card').filter({
      has: page.locator('h3', { hasText: TEST_STAFF_NAME })
    });
    await expect(card).toBeVisible({ timeout: 10000 });

    // Cliquer sur le bouton éditer
    const editBtn = card.locator(`button[aria-label="Modifier ${TEST_STAFF_NAME}"]`);
    await editBtn.click();

    // Attendre le dialog d'édition
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toContainText('Modifier un membre');

    // Vérifier que les champs sont pré-remplis
    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await expect(nameInput).toHaveValue(TEST_STAFF_NAME);

    // Modifier le nom
    await nameInput.clear();
    await nameInput.fill(UPDATED_STAFF_NAME);

    // Modifier le rôle
    const roleInput = page.locator('mat-dialog-container input[formcontrolname="role"]');
    await roleInput.clear();
    await roleInput.fill(UPDATED_STAFF_ROLE);

    // Sauvegarder
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Mettre à jour/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le membre doit afficher le nouveau nom
    const updatedCard = page.locator('.staff-card').filter({
      has: page.locator('h3', { hasText: UPDATED_STAFF_NAME })
    });
    await expect(updatedCard).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien nom n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToStaff(page);

    const oldNameCard = page.locator('.staff-card h3', { hasText: TEST_STAFF_NAME });
    await expect(oldNameCard).not.toBeVisible({ timeout: 5000 });
  });

  test('suppression : supprimer le membre créé (nettoyage)', async ({ page }) => {
    await navigateToStaff(page);

    // Chercher le membre avec l'un ou l'autre nom
    const updatedCard = page.locator('.staff-card').filter({
      has: page.locator('h3', { hasText: UPDATED_STAFF_NAME })
    });
    const originalCard = page.locator('.staff-card').filter({
      has: page.locator('h3', { hasText: TEST_STAFF_NAME })
    });

    const updatedExists = await updatedCard.isVisible().catch(() => false);
    const originalExists = await originalCard.isVisible().catch(() => false);

    const targetName = updatedExists ? UPDATED_STAFF_NAME : (originalExists ? TEST_STAFF_NAME : null);

    if (!targetName) {
      test.info().annotations.push({ type: 'note', description: 'Membre de test non trouvé, déjà supprimé ?' });
      return;
    }

    await deleteStaffByName(page, targetName);

    // Vérifier la suppression
    const deletedCard = page.locator('.staff-card').filter({
      has: page.locator('h3', { hasText: targetName })
    });
    await expect(deletedCard).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Dialog — Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Staff admin — Validation du formulaire', () => {
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
    await navigateToStaff(page);
  });

  test('le bouton Créer est désactivé si les champs requis sont vides', async ({ page }) => {
    const addBtn = page.locator('.page-header button.btn-primary').filter({ hasText: 'Ajouter un membre' });
    await addBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Le bouton Créer doit être désactivé si les champs obligatoires sont vides
    const createBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Créer/ });
    await expect(createBtn).toBeDisabled({ timeout: 5000 });

    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('Annuler dans le dialog ferme la fenêtre sans ajouter de membre', async ({ page }) => {
    const countBefore = await page.locator('.staff-card').count();

    const addBtn = page.locator('.page-header button.btn-primary').filter({ hasText: 'Ajouter un membre' });
    await addBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement
    await page.locator('mat-dialog-container input[formcontrolname="name"]').fill('Nom non sauvegardé');

    // Cliquer sur Annuler
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    const countAfter = await page.locator('.staff-card').count();
    expect(countAfter).toBe(countBefore);
  });

  test('le select catégorie propose les 3 options (Administration, Headstaff, Ambassadeur)', async ({ page }) => {
    const addBtn = page.locator('.page-header button.btn-primary').filter({ hasText: 'Ajouter un membre' });
    await addBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Ouvrir le select
    const categorySelect = page.locator('mat-dialog-container mat-select[formcontrolname="category"]');
    await categorySelect.click();

    // Les 3 options doivent être visibles
    await expect(page.locator('mat-option').filter({ hasText: 'Administration' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('mat-option').filter({ hasText: 'Headstaff' })).toBeVisible({ timeout: 5000 });
    await expect(page.locator('mat-option').filter({ hasText: 'Ambassadeur' })).toBeVisible({ timeout: 5000 });

    // Fermer le panneau en appuyant sur Escape
    await page.keyboard.press('Escape');
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });
});
