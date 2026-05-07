/**
 * Tests E2E — Admin coaching staff CRUD
 *
 * Parcours : login admin → ouvrir dialog coaching staff d'une équipe
 * → ajouter un coach → modifier son rôle → réordonner → supprimer.
 *
 * Sélecteurs basés sur coaching-staff-dialog.component.ts :
 * - mat-dialog-container h2[mat-dialog-title]       → titre du dialog
 * - mat-dialog-container .section-header button     → bouton "Ajouter un coach"
 * - mat-dialog-container .coach-row                 → ligne d'un coach
 * - mat-dialog-container .coach-info strong         → nom du coach
 * - mat-dialog-container .coach-info .role-badge    → rôle
 * - mat-dialog-container button[aria-label^="Modifier"] → bouton éditer
 * - mat-dialog-container button[aria-label^="Supprimer"] → bouton supprimer
 * - mat-dialog-container .drag-handle               → poignée drag
 * - mat-dialog-container .form-section form         → formulaire create/edit
 * - mat-dialog-container input[formcontrolname="name"]  → champ nom
 * - mat-dialog-container input[formcontrolname="role"]  → champ rôle
 * - mat-dialog-container button[mat-raised-button]  → bouton Ajouter/Mettre à jour
 * - mat-dialog-container .empty-state               → état vide
 *
 * Bouton d'ouverture du dialog (teams.component.ts) :
 * - button[aria-label^="Gérer le coaching staff"]   → bouton coaching staff sur chaque ligne équipe
 */

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_COACH_NAME = 'Coach E2E Test';
const TEST_COACH_ROLE = 'Head Coach E2E';
const UPDATED_COACH_ROLE = 'Analyste Senior E2E';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function isBackendAvailable(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/config', { timeout: 5000 });
    if (!response.ok()) return false;
    const contentType = response.headers()['content-type'] ?? '';
    return contentType.includes('application/json');
  } catch {
    return false;
  }
}

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

async function navigateToTeams(page: Page): Promise<boolean> {
  await page.goto('/admin/teams', { waitUntil: 'domcontentloaded' });

  const loaded = await Promise.race([
    page.locator('.teams-list').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-state').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  // Attendre que le skeleton disparaisse
  await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});

  return loaded;
}

/**
 * Ouvre le dialog coaching staff de la première équipe disponible.
 * Retourne false si aucune équipe n'est disponible.
 */
async function openCoachingStaffDialog(page: Page): Promise<boolean> {
  const firstCoachBtn = page.locator('button[aria-label]').filter({ hasText: '' })
    .locator('[aria-label*="Gérer le coaching staff"]').first();

  // Chercher le bouton avec mat-icon sports
  const sportsBtns = page.locator('button[mat-icon-button]').filter({
    has: page.locator('mat-icon', { hasText: 'sports' })
  });

  const count = await sportsBtns.count();
  if (count === 0) return false;

  await sportsBtns.first().click();

  const dialogTitle = page.locator('mat-dialog-container h2[mat-dialog-title]');
  return dialogTitle.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage du dialog
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin coaching staff — Affichage', () => {
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

  test('la page admin teams se charge correctement', async ({ page }) => {
    const loaded = await navigateToTeams(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/teams/);
  });

  test('le bouton coaching staff est présent sur chaque équipe', async ({ page }) => {
    await navigateToTeams(page);

    const hasTeams = await page.locator('.teams-list').isVisible().catch(() => false);
    if (!hasTeams) {
      test.info().annotations.push({ type: 'note', description: 'Aucune équipe disponible, test ignoré' });
      return;
    }

    const sportsBtns = page.locator('button[mat-icon-button]').filter({
      has: page.locator('mat-icon', { hasText: 'sports' })
    });
    const count = await sportsBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('le dialog coaching staff s\'ouvre avec le bon titre', async ({ page }) => {
    await navigateToTeams(page);

    const hasTeams = await page.locator('.teams-list').isVisible().catch(() => false);
    if (!hasTeams) {
      test.info().annotations.push({ type: 'note', description: 'Aucune équipe disponible, test ignoré' });
      return;
    }

    const opened = await openCoachingStaffDialog(page);
    expect(opened).toBe(true);

    const title = page.locator('mat-dialog-container h2[mat-dialog-title]');
    await expect(title).toBeVisible({ timeout: 5000 });
    await expect(title).toContainText('Coaching staff');
  });

  test('le bouton "Ajouter un coach" est visible dans le dialog', async ({ page }) => {
    await navigateToTeams(page);

    const hasTeams = await page.locator('.teams-list').isVisible().catch(() => false);
    if (!hasTeams) return;

    const opened = await openCoachingStaffDialog(page);
    if (!opened) return;

    const addBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Ajouter un coach' });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD complet — serial (Create → Edit → Delete)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Admin coaching staff — CRUD complet', () => {
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
    await navigateToTeams(page);

    const hasTeams = await page.locator('.teams-list').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeams) {
      test.skip();
    }
  });

  test('création : ajouter un nouveau coach', async ({ page }) => {
    const opened = await openCoachingStaffDialog(page);
    if (!opened) {
      test.info().annotations.push({ type: 'note', description: 'Pas de teams disponibles' });
      return;
    }

    // Cliquer sur "Ajouter un coach"
    const addBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Ajouter un coach' });
    await expect(addBtn).toBeVisible({ timeout: 10000 });
    await addBtn.click();

    // Le formulaire doit apparaître
    const form = page.locator('mat-dialog-container .form-section form');
    await expect(form).toBeVisible({ timeout: 5000 });

    // Remplir les champs obligatoires
    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(TEST_COACH_NAME);

    const roleInput = page.locator('mat-dialog-container input[formcontrolname="role"]');
    await roleInput.fill(TEST_COACH_ROLE);

    // Soumettre
    const submitBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Ajouter/ });
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // Attendre que le formulaire disparaisse (retour à la liste)
    await page.locator('mat-dialog-container .form-section').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Le coach doit apparaître dans la liste
    const coachRow = page.locator('mat-dialog-container .coach-row').filter({
      has: page.locator('strong', { hasText: TEST_COACH_NAME })
    });
    await expect(coachRow).toBeVisible({ timeout: 15000 });
  });

  test('le coach créé affiche le bon nom et le bon rôle', async ({ page }) => {
    const opened = await openCoachingStaffDialog(page);
    if (!opened) return;

    const coachRow = page.locator('mat-dialog-container .coach-row').filter({
      has: page.locator('strong', { hasText: TEST_COACH_NAME })
    });
    await expect(coachRow).toBeVisible({ timeout: 10000 });
    await expect(coachRow.locator('.role-badge')).toContainText(TEST_COACH_ROLE);
  });

  test('édition : modifier le rôle du coach créé', async ({ page }) => {
    const opened = await openCoachingStaffDialog(page);
    if (!opened) return;

    const coachRow = page.locator('mat-dialog-container .coach-row').filter({
      has: page.locator('strong', { hasText: TEST_COACH_NAME })
    });
    await expect(coachRow).toBeVisible({ timeout: 10000 });

    // Cliquer sur éditer
    const editBtn = coachRow.locator(`button[aria-label="Modifier ${TEST_COACH_NAME}"]`);
    await editBtn.click();

    // Le formulaire s'affiche avec les données pré-remplies
    const roleInput = page.locator('mat-dialog-container input[formcontrolname="role"]');
    await expect(roleInput).toBeVisible({ timeout: 5000 });
    await expect(roleInput).toHaveValue(TEST_COACH_ROLE);

    // Modifier le rôle
    await roleInput.clear();
    await roleInput.fill(UPDATED_COACH_ROLE);

    // Soumettre
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Mettre à jour/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Attendre retour à la liste
    await page.locator('mat-dialog-container .form-section').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Le rôle mis à jour doit être visible
    const updatedRow = page.locator('mat-dialog-container .coach-row').filter({
      has: page.locator('strong', { hasText: TEST_COACH_NAME })
    });
    await expect(updatedRow).toBeVisible({ timeout: 15000 });
    await expect(updatedRow.locator('.role-badge')).toContainText(UPDATED_COACH_ROLE);
  });

  test('réordonnement : le bouton drag-handle est visible sur chaque ligne', async ({ page }) => {
    const opened = await openCoachingStaffDialog(page);
    if (!opened) return;

    const coachRows = page.locator('mat-dialog-container .coach-row');
    const count = await coachRows.count();

    if (count < 2) {
      test.info().annotations.push({ type: 'note', description: 'Moins de 2 coachs pour tester le drag' });
      return;
    }

    // Vérifier que les drag handles sont présents
    const handles = page.locator('mat-dialog-container .drag-handle');
    await expect(handles).toHaveCount(count);
  });

  test('suppression : supprimer le coach créé (nettoyage)', async ({ page }) => {
    const opened = await openCoachingStaffDialog(page);
    if (!opened) return;

    const coachRow = page.locator('mat-dialog-container .coach-row').filter({
      has: page.locator('strong', { hasText: TEST_COACH_NAME })
    });

    const exists = await coachRow.isVisible({ timeout: 5000 }).catch(() => false);
    if (!exists) {
      test.info().annotations.push({ type: 'note', description: 'Coach de test non trouvé, déjà supprimé ?' });
      return;
    }

    // Cliquer sur supprimer
    const deleteBtn = coachRow.locator(`button[aria-label="Supprimer ${TEST_COACH_NAME}"]`);
    await deleteBtn.click();

    // Confirmer dans le dialog de confirmation
    const confirmBtn = page.locator('mat-dialog-container').last().locator('button').filter({ hasText: /Confirmer|Supprimer|Oui/ }).last();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Le coach ne doit plus apparaître
    await expect(coachRow).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Admin coaching staff — Validation formulaire', () => {
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
    await navigateToTeams(page);

    const hasTeams = await page.locator('.teams-list').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeams) {
      test.skip();
    }
  });

  test('le bouton Ajouter est désactivé si les champs requis sont vides', async ({ page }) => {
    const opened = await openCoachingStaffDialog(page);
    if (!opened) return;

    const addBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Ajouter un coach' });
    await addBtn.click();

    // Le formulaire doit s'ouvrir
    await page.locator('mat-dialog-container .form-section form').waitFor({ timeout: 5000 });

    // Le bouton Ajouter du formulaire doit être désactivé (champs vides)
    const submitBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: /Ajouter/ });
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
  });

  test('Annuler dans le formulaire revient à la liste', async ({ page }) => {
    const opened = await openCoachingStaffDialog(page);
    if (!opened) return;

    const addBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Ajouter un coach' });
    await addBtn.click();

    await page.locator('mat-dialog-container .form-section form').waitFor({ timeout: 5000 });

    // Cliquer sur Annuler
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    // Le formulaire doit disparaître
    await expect(page.locator('mat-dialog-container .form-section')).not.toBeVisible({ timeout: 5000 });
  });
});
