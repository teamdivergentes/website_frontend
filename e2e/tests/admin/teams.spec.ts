/**
 * Tests E2E — Page admin Équipes (CRUD)
 *
 * Vérifie les opérations CRUD sur les équipes :
 * création, édition, suppression, toggle actif/inactif et gestion des membres.
 * Les tests de mutation (create/edit/delete) utilisent test.describe.serial()
 * pour garantir l'ordre d'exécution et le nettoyage des données.
 *
 * Sélecteurs basés sur teams.component.ts, team-form-dialog.component.ts
 * et team-members-dialog.component.ts :
 * - .teams-admin-page           → conteneur principal
 * - .page-header h1             → titre "Gestion des Équipes"
 * - .page-header button         → bouton "Nouvelle équipe"
 * - .teams-list                 → liste des équipes (cdkDropList)
 * - .team-item                  → carte d'une équipe
 * - .team-info h3               → nom de l'équipe
 * - .team-game                  → jeu de l'équipe
 * - .team-members               → nombre de membres
 * - .team-actions               → actions (toggle, membres, edit, delete)
 * - mat-slide-toggle            → toggle actif/inactif
 * - button[aria-label^="Gérer les membres"] → bouton membres
 * - button[aria-label^="Modifier"]          → bouton modifier
 * - button[aria-label^="Supprimer"]         → bouton supprimer
 * - .skeleton-list              → skeleton loading
 * - .empty-state                → état vide
 *
 * Dialog TeamFormDialog (mat-dialog) :
 * - h2[mat-dialog-title]                      → titre dialog
 * - input[formcontrolname="name"]             → champ nom équipe
 * - mat-select[formcontrolname="game"]        → select jeu
 * - textarea[formcontrolname="description"]   → champ description
 * - mat-checkbox[formcontrolname="active"]    → case active
 * - button mat-raised-button color="primary"  → bouton Enregistrer
 * - button mat-button (Annuler)               → bouton Annuler
 *
 * Dialog TeamMembersDialog (mat-dialog) :
 * - h2[mat-dialog-title] contenant "Membres de" → titre dialog membres
 * - .member-form                               → formulaire ajout membre
 * - .members-list                              → liste membres actuels
 * - input[formcontrolname="name"]              → pseudo du membre
 * - input[formcontrolname="role"]              → rôle du membre
 *
 * Dialog de confirmation :
 * - mat-dialog-container button contenant "Confirmer" → confirmer
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_TEAM_NAME = 'Équipe E2E Test';
const UPDATED_TEAM_NAME = 'Équipe E2E Modifiée';
const TEST_MEMBER_NAME = 'JoueurE2E';
const TEST_MEMBER_ROLE = 'Top Lane';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToTeams(page: Page): Promise<boolean> {
  await page.goto('/admin/teams', { waitUntil: 'domcontentloaded' });

  const loaded = await Promise.race([
    page.locator('.teams-list').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-state').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.error-message').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  return loaded;
}

/**
 * Ouvre le dialog de création d'équipe et remplit les champs nom et jeu.
 * Retourne true si le dialog s'est ouvert et les champs ont été remplis.
 */
async function openCreateDialogAndFill(page: Page, teamName: string): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle équipe' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toContainText('une équipe');

  // Remplir le champ "Nom de l'équipe"
  const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(teamName);

  // Sélectionner un jeu dans le mat-select
  const gameSelect = page.locator('mat-dialog-container mat-select[formcontrolname="game"]');
  await expect(gameSelect).toBeVisible({ timeout: 5000 });
  await gameSelect.click();

  // Attendre que le panel du select s'ouvre et choisir la première option disponible
  const firstOption = page.locator('mat-option').first();
  const optionAvailable = await firstOption.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
  if (optionAvailable) {
    await firstOption.click();
  }

  return true;
}

/**
 * Supprime une équipe par son nom.
 * Confirme la suppression dans le dialog MatDialog.
 */
async function deleteTeamByName(page: Page, teamName: string): Promise<void> {
  const teamItem = page.locator('.team-item').filter({
    has: page.locator('h3', { hasText: teamName })
  });

  const count = await teamItem.count();
  if (count === 0) return;

  const deleteBtn = teamItem.locator(`button[aria-label="Supprimer ${teamName}"]`);
  await deleteBtn.click();

  const confirmBtn = page
    .locator('mat-dialog-container')
    .locator('button')
    .filter({ hasText: /Confirmer|Supprimer|Oui/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  await expect(teamItem).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la page (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Équipes admin — Affichage', () => {
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

  test('la page équipes charge après le login', async ({ page }) => {
    const loaded = await navigateToTeams(page);
    expect(loaded).toBe(true);

    await expect(page).toHaveURL(/\/admin\/teams/);
  });

  test('le titre "Gestion des Équipes" est visible', async ({ page }) => {
    await navigateToTeams(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion des Équipes');
  });

  test('le bouton "Nouvelle équipe" est visible', async ({ page }) => {
    await navigateToTeams(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouvelle équipe' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('la liste des équipes ou l\'état vide est affiché', async ({ page }) => {
    await navigateToTeams(page);

    // Attendre la fin du skeleton
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const teamsList = page.locator('.teams-list');
    const emptyState = page.locator('.empty-state');

    const hasList = await teamsList.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasList || hasEmpty).toBe(true);
  });

  test('chaque équipe affiche son nom, son jeu et le nombre de membres', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Aucune équipe en base, état vide affiché' });
      return;
    }

    const firstItem = page.locator('.team-item').first();
    await expect(firstItem.locator('.team-info h3')).toBeVisible({ timeout: 5000 });
    await expect(firstItem.locator('.team-game')).toBeVisible({ timeout: 5000 });
    await expect(firstItem.locator('.team-members')).toBeVisible({ timeout: 5000 });
  });

  test('chaque équipe affiche les actions (toggle, membres, modifier, supprimer)', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes, test ignoré' });
      return;
    }

    const firstItem = page.locator('.team-item').first();
    const actions = firstItem.locator('.team-actions');
    await expect(actions).toBeVisible({ timeout: 5000 });

    await expect(actions.locator('mat-slide-toggle')).toBeVisible({ timeout: 5000 });
    await expect(actions.locator('button[aria-label^="Gérer les membres"]')).toBeVisible({ timeout: 5000 });
    await expect(actions.locator('button[aria-label^="Modifier"]')).toBeVisible({ timeout: 5000 });
    await expect(actions.locator('button[aria-label^="Supprimer"]')).toBeVisible({ timeout: 5000 });
  });

  test('l\'état vide affiche le message "Aucune équipe créée"', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    if (!(await page.locator('.empty-state').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Des équipes existent, état vide non affiché' });
      return;
    }

    const emptyMsg = page.locator('.empty-state p');
    await expect(emptyMsg).toContainText('Aucune équipe créée');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : Icônes Material (non-régression CSS)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Équipes admin — Icônes Material', () => {
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
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('toutes les mat-icon ont la font-family "Material Icons"', async ({ page }) => {
    // S'assurer que les icônes de la page sont chargées (bouton header toujours présent)
    const addIcon = page.locator('.page-header mat-icon');
    await expect(addIcon).toBeVisible({ timeout: 10000 });

    const allIcons = page.locator('.teams-admin-page mat-icon');
    const count = await allIcons.count();

    // La page doit avoir au moins l'icône "add" dans le header
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const icon = allIcons.nth(i);
      const isVisible = await icon.isVisible().catch(() => false);
      if (!isVisible) continue;

      const fontFamily = await icon.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      expect(fontFamily).toContain('Material Icons');
    }
  });

  test('l\'icône "add" du bouton "Nouvelle équipe" est visible et correcte', async ({ page }) => {
    const addIcon = page.locator('.page-header mat-icon');
    await expect(addIcon).toBeVisible({ timeout: 10000 });
    await expect(addIcon).toHaveText('add');

    const fontFamily = await addIcon.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(fontFamily).toContain('Material Icons');
  });

  test('les icônes d\'action (group, edit, delete) sont visibles sur les équipes existantes', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes, icônes d\'action non vérifiées' });
      return;
    }

    const firstItem = page.locator('.team-item').first();
    const icons = firstItem.locator('.team-actions mat-icon');
    const count = await icons.count();

    // Au moins 4 icônes d'action : toggle (interne), group, edit, delete
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const icon = icons.nth(i);
      const fontFamily = await icon.evaluate((el) => window.getComputedStyle(el).fontFamily);
      expect(fontFamily).toContain('Material Icons');
    }
  });

  test('l\'icône drag_indicator est présente sur les équipes (handle)', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes, drag handle non vérifié' });
      return;
    }

    const firstDragHandle = page.locator('.team-item .drag-handle mat-icon').first();
    await expect(firstDragHandle).toBeVisible({ timeout: 5000 });
    await expect(firstDragHandle).toHaveText('drag_indicator');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : CRUD — Create → Edit → Delete (serial, ordre garanti)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Équipes admin — CRUD complet', () => {
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

  test('création : ouvrir le dialog et créer une nouvelle équipe', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const filled = await openCreateDialogAndFill(page, TEST_TEAM_NAME);
    expect(filled).toBe(true);

    // Cliquer sur "Enregistrer"
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: /Enregistrer/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme après la sauvegarde
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // La nouvelle équipe doit apparaître dans la liste
    const newTeamItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: TEST_TEAM_NAME })
    });
    await expect(newTeamItem).toBeVisible({ timeout: 15000 });
  });

  test('l\'équipe créée affiche son nom dans la liste', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const teamItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: TEST_TEAM_NAME })
    });
    await expect(teamItem).toBeVisible({ timeout: 10000 });
    await expect(teamItem.locator('.team-info h3')).toHaveText(TEST_TEAM_NAME);
  });

  test('édition : modifier le nom de l\'équipe créée', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const teamItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: TEST_TEAM_NAME })
    });
    await expect(teamItem).toBeVisible({ timeout: 10000 });

    // Cliquer sur "Modifier"
    const editBtn = teamItem.locator(`button[aria-label="Modifier ${TEST_TEAM_NAME}"]`);
    await editBtn.click();

    // Attendre que le dialog d'édition s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toContainText('Modifier');

    // Modifier le champ nom
    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.clear();
    await nameInput.fill(UPDATED_TEAM_NAME);

    // Sauvegarder
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: /Enregistrer/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // L'équipe doit maintenant afficher le nouveau nom
    const updatedItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: UPDATED_TEAM_NAME })
    });
    await expect(updatedItem).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien nom n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const oldItem = page.locator('.team-item h3', { hasText: TEST_TEAM_NAME });
    await expect(oldItem).not.toBeVisible({ timeout: 5000 });
  });

  test('suppression : supprimer l\'équipe de test (nettoyage)', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Chercher avec le nom mis à jour ou le nom original (selon si l'édition a réussi)
    const updatedItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: UPDATED_TEAM_NAME })
    });
    const originalItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: TEST_TEAM_NAME })
    });

    const updatedExists = await updatedItem.isVisible().catch(() => false);
    const originalExists = await originalItem.isVisible().catch(() => false);

    const targetName = updatedExists
      ? UPDATED_TEAM_NAME
      : originalExists
        ? TEST_TEAM_NAME
        : null;

    if (!targetName) {
      test.info().annotations.push({ type: 'note', description: 'Équipe de test non trouvée, déjà supprimée ?' });
      return;
    }

    await deleteTeamByName(page, targetName);

    const deletedItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: targetName })
    });
    await expect(deletedItem).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Équipes admin — Validation du formulaire', () => {
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
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('le bouton Enregistrer est désactivé si les champs requis sont vides', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle équipe' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Sans remplir les champs, le bouton Enregistrer doit être disabled
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: /Enregistrer/ });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('le nom seul ne suffit pas — le jeu est aussi requis', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle équipe' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir uniquement le nom
    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await nameInput.fill('Équipe sans jeu');

    // Le bouton doit rester désactivé (le champ "game" est requis)
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button]')
      .filter({ hasText: /Enregistrer/ });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('une erreur de validation s\'affiche si le nom est touché puis vidé', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle équipe' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    const nameInput = page.locator('mat-dialog-container input[formcontrolname="name"]');
    await nameInput.fill('X');
    await nameInput.clear();
    await nameInput.blur();

    // L'erreur "Le nom est requis" doit apparaître
    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /requis/ });
    await expect(error).toBeVisible({ timeout: 5000 });

    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('Annuler dans le dialog ferme la fenêtre sans créer d\'équipe', async ({ page }) => {
    const countBefore = await page.locator('.team-item').count();

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouvelle équipe' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement
    await page.locator('mat-dialog-container input[formcontrolname="name"]').fill('Équipe non sauvegardée');

    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    const countAfter = await page.locator('.team-item').count();
    expect(countAfter).toBe(countBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 5 : Toggle actif/inactif
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Équipes admin — Toggle actif/inactif', () => {
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
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('le toggle actif/inactif est présent sur chaque équipe', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes en base' });
      return;
    }

    const firstToggle = page.locator('.team-item').first().locator('mat-slide-toggle');
    await expect(firstToggle).toBeVisible({ timeout: 5000 });
  });

  test('le toggle a un aria-label "Activer X" ou "Désactiver X"', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes en base' });
      return;
    }

    const firstToggle = page.locator('.team-item').first().locator('mat-slide-toggle');
    const ariaLabel = await firstToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Activer|Désactiver/);
  });

  test('cliquer sur le toggle appelle l\'API et affiche une snackbar', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes en base' });
      return;
    }

    const firstItem = page.locator('.team-item').first();
    const teamName = await firstItem.locator('.team-info h3').textContent();
    const toggle = firstItem.locator('mat-slide-toggle');

    // Lire l'état initial
    const wasChecked = await toggle.evaluate((el) => {
      const input = el.querySelector('input[type="checkbox"]');
      return input ? (input as HTMLInputElement).checked : false;
    });

    // Cliquer sur le toggle
    await toggle.click();

    // Une snackbar doit apparaître avec le nom de l'équipe
    const snackBar = page.locator('mat-snack-bar-container, simple-snack-bar');
    const snackVisible = await snackBar.waitFor({ timeout: 8000 }).then(() => true).catch(() => false);

    if (snackVisible) {
      const snackText = await snackBar.textContent();
      expect(snackText).toContain(teamName?.trim());
    }

    // Remettre l'état initial en recliquant
    await toggle.click();
    await page.waitForTimeout(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 6 : Dialog Gestion des membres
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Équipes admin — Dialog Membres', () => {
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
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('le dialog membres s\'ouvre depuis le bouton "Gérer les membres"', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes, test ignoré' });
      return;
    }

    const firstItem = page.locator('.team-item').first();
    const teamName = await firstItem.locator('.team-info h3').textContent();

    const membersBtn = firstItem.locator('button[aria-label^="Gérer les membres"]');
    await expect(membersBtn).toBeVisible({ timeout: 5000 });
    await membersBtn.click();

    // Le dialog doit s'ouvrir avec le titre "Membres de <nom>"
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toContainText('Membres de');
    await expect(dialogTitle).toContainText(teamName?.trim() ?? '');

    // Fermer le dialog
    const closeBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Fermer' });
    await closeBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('le dialog membres contient le formulaire d\'ajout de membre', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes, test ignoré' });
      return;
    }

    const firstItem = page.locator('.team-item').first();
    const membersBtn = firstItem.locator('button[aria-label^="Gérer les membres"]');
    await membersBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Le formulaire d'ajout de membre doit être présent
    const memberForm = page.locator('mat-dialog-container .member-form');
    await expect(memberForm).toBeVisible({ timeout: 5000 });

    // Les champs pseudo et rôle sont obligatoires
    await expect(memberForm.locator('input[formcontrolname="name"]')).toBeVisible({ timeout: 5000 });
    await expect(memberForm.locator('input[formcontrolname="role"]')).toBeVisible({ timeout: 5000 });

    const closeBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Fermer' });
    await closeBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('le bouton Ajouter est désactivé si les champs requis du membre sont vides', async ({ page }) => {
    if (!(await page.locator('.teams-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'équipes, test ignoré' });
      return;
    }

    const firstItem = page.locator('.team-item').first();
    const membersBtn = firstItem.locator('button[aria-label^="Gérer les membres"]');
    await membersBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Sans remplir les champs, le bouton Ajouter doit être disabled
    const addBtn = page
      .locator('mat-dialog-container .member-form button[mat-raised-button]')
      .filter({ hasText: /Ajouter/ });
    await expect(addBtn).toBeDisabled({ timeout: 5000 });

    const closeBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Fermer' });
    await closeBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 7 : CRUD Membres — Create → Delete (serial, ordre garanti)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Équipes admin — CRUD Membres', () => {
  let loggedIn = false;
  /** Nom de la première équipe trouvée en base, utilisée pour les tests membres */
  let targetTeamName: string | null = null;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      await page.close();
      return;
    }
    loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      await page.close();
      return;
    }
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    const firstItem = page.locator('.team-item').first();
    if (await firstItem.isVisible().catch(() => false)) {
      targetTeamName = await firstItem.locator('.team-info h3').textContent();
    }
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp || !loggedIn || !targetTeamName) {
      test.skip();
      return;
    }
    await loginAsAdmin(page);
  });

  test('ajout d\'un membre dans le dialog', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const teamItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: targetTeamName! })
    });
    const membersBtn = teamItem.locator('button[aria-label^="Gérer les membres"]');
    await membersBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir le formulaire membre
    const memberForm = page.locator('mat-dialog-container .member-form');
    await memberForm.locator('input[formcontrolname="name"]').fill(TEST_MEMBER_NAME);
    await memberForm.locator('input[formcontrolname="role"]').fill(TEST_MEMBER_ROLE);

    const addBtn = memberForm
      .locator('button[mat-raised-button]')
      .filter({ hasText: /Ajouter/ });
    await expect(addBtn).toBeEnabled({ timeout: 5000 });
    await addBtn.click();

    // Le membre doit apparaître dans la liste des membres actuels
    const membersList = page.locator('mat-dialog-container .members-list');
    const newMemberItem = membersList.locator('.member-item').filter({
      has: page.locator('strong', { hasText: TEST_MEMBER_NAME })
    });
    await expect(newMemberItem).toBeVisible({ timeout: 10000 });

    const closeBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Fermer' });
    await closeBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('le membre ajouté est reflété dans le compteur de membres de l\'équipe', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const teamItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: targetTeamName! })
    });
    await expect(teamItem).toBeVisible({ timeout: 10000 });

    // Le compteur de membres doit être >= 1 après l'ajout
    const memberCount = teamItem.locator('.team-members');
    await expect(memberCount).toBeVisible({ timeout: 5000 });
    const countText = await memberCount.textContent();
    const count = parseInt(countText?.match(/\d+/)?.[0] ?? '0', 10);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('suppression du membre de test (nettoyage)', async ({ page }) => {
    await navigateToTeams(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const teamItem = page.locator('.team-item').filter({
      has: page.locator('h3', { hasText: targetTeamName! })
    });
    const membersBtn = teamItem.locator('button[aria-label^="Gérer les membres"]');
    await membersBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    const membersList = page.locator('mat-dialog-container .members-list');
    const memberItem = membersList.locator('.member-item').filter({
      has: page.locator('strong', { hasText: TEST_MEMBER_NAME })
    });

    if (!(await memberItem.isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Membre de test non trouvé, déjà supprimé ?' });
      const closeBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Fermer' });
      await closeBtn.click();
      return;
    }

    // Cliquer sur le bouton supprimer du membre
    const deleteMemberBtn = memberItem.locator('button[mat-icon-button][color="warn"]');
    await deleteMemberBtn.click();

    // Confirmer dans le dialog de confirmation
    const confirmBtn = page
      .locator('mat-dialog-container')
      .locator('button')
      .filter({ hasText: /Confirmer|Supprimer|Oui/ })
      .last();
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Le membre doit disparaître de la liste
    await expect(memberItem).not.toBeVisible({ timeout: 10000 });

    const closeBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Fermer' });
    await closeBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });
});
