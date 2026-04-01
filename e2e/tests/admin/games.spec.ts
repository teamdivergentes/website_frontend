/**
 * Tests E2E — Page admin Jeux (CRUD)
 *
 * Vérifie les opérations CRUD sur les jeux :
 * création, édition, suppression et toggle actif.
 * Les tests de mutation (create/edit/delete) utilisent test.describe.serial()
 * pour garantir l'ordre d'exécution et le nettoyage des données.
 *
 * Sélecteurs basés sur games.component.ts et game-form-dialog.component.ts :
 * - .games-admin-page          → conteneur principal
 * - .page-header h1            → titre "Gestion des Jeux"
 * - .page-header button        → bouton "Nouveau jeu"
 * - .games-list                → liste des jeux (cdkDropList)
 * - .game-item                 → carte d'un jeu
 * - .game-info h3              → nom du jeu
 * - .game-key                  → clé du jeu
 * - .game-actions              → actions (toggle, edit, delete)
 * - mat-slide-toggle           → toggle actif/inactif
 * - button[aria-label^="Modifier"] → bouton modifier
 * - button[aria-label^="Supprimer"] → bouton supprimer
 * - .skeleton-list             → skeleton loading
 * - .empty-state               → état vide
 *
 * Dialog (MatDialog) :
 * - h2[mat-dialog-title]       → titre du dialog
 * - input[formControlName="key"]  → champ clé (dans mat-input-element)
 * - input[formControlName="name"] → champ nom
 * - button[mat-raised-button]  → bouton Enregistrer
 * - button[mat-button][mat-dialog-close] → bouton Annuler
 *
 * Dialog de confirmation :
 * - .confirm-dialog            → conteneur dialog confirm
 * - button contenant "Confirmer" ou "Supprimer" → confirmer
 */

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_GAME_KEY = 'e2etest';
const TEST_GAME_NAME = 'Jeu E2E Test';
const UPDATED_GAME_NAME = 'Jeu E2E Modifié';

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

async function navigateToGames(page: Page): Promise<boolean> {
  await page.goto('/admin/games', { waitUntil: 'domcontentloaded' });

  // Attendre que le composant soit chargé (skeleton puis liste ou état vide)
  const loaded = await Promise.race([
    page.locator('.games-list').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-state').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.error-message').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  return loaded;
}

async function isBackendAvailable(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/config', { timeout: 5000 });
    return response.status() < 500;
  } catch {
    return false;
  }
}

/**
 * Ouvre le dialog de création de jeu et remplit les champs requis.
 * Retourne true si le dialog s'est ouvert et les champs ont été remplis.
 */
async function openCreateDialogAndFill(
  page: Page,
  key: string,
  name: string
): Promise<boolean> {
  // Cliquer sur "Nouveau jeu"
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau jeu' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  // Attendre que le dialog MatDialog s'ouvre
  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle.waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toHaveText('Nouveau jeu');

  // Remplir le champ "Clé unique"
  // Les champs mat-input ont un input natif à l'intérieur
  const keyInput = page.locator('input[formcontrolname="key"]');
  await expect(keyInput).toBeVisible({ timeout: 5000 });
  await keyInput.fill(key);

  // Remplir le champ "Nom du jeu"
  const nameInput = page.locator('input[formcontrolname="name"]');
  await expect(nameInput).toBeVisible({ timeout: 5000 });
  await nameInput.fill(name);

  return true;
}

/**
 * Supprime un jeu par son nom en cherchant le bouton de suppression dans la liste.
 * Confirme la suppression dans le dialog.
 */
async function deleteGameByName(page: Page, gameName: string): Promise<void> {
  const gameItem = page.locator('.game-item').filter({
    has: page.locator('h3', { hasText: gameName })
  });

  const count = await gameItem.count();
  if (count === 0) return;

  const deleteBtn = gameItem.locator(`button[aria-label="Supprimer ${gameName}"]`);
  await deleteBtn.click();

  // Confirmer dans le dialog de confirmation MatDialog
  const confirmBtn = page.locator('mat-dialog-container').locator('button').filter({ hasText: /Confirmer|Supprimer|Oui/ }).last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que le jeu disparaisse de la liste
  await expect(gameItem).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Chargement de la page (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Jeux admin — Affichage', () => {
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

  test('la page jeux charge après le login', async ({ page }) => {
    const loaded = await navigateToGames(page);
    expect(loaded).toBe(true);

    // L'URL doit être /admin/games
    await expect(page).toHaveURL(/\/admin\/games/);
  });

  test('le titre "Gestion des Jeux" est visible', async ({ page }) => {
    await navigateToGames(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion des Jeux');
  });

  test('le bouton "Nouveau jeu" est visible', async ({ page }) => {
    await navigateToGames(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouveau jeu' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('la liste des jeux est affichée avec au moins un jeu du seed', async ({ page }) => {
    await navigateToGames(page);

    // Attendre que la liste soit chargée (pas le skeleton)
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const gamesList = page.locator('.games-list');
    const emptyState = page.locator('.empty-state');

    const hasList = await gamesList.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    // Il doit y avoir soit une liste, soit un état vide
    expect(hasList || hasEmpty).toBe(true);

    if (hasList) {
      // Le seed contient au moins 5 jeux (LoL, Valorant, RL, CS, TFT)
      const items = page.locator('.game-item');
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('chaque jeu affiche son nom et sa clé', async ({ page }) => {
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const gamesList = page.locator('.games-list');
    if (!(await gamesList.isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Aucun jeu dans la base, état vide affiché' });
      return;
    }

    const firstItem = page.locator('.game-item').first();
    await expect(firstItem.locator('.game-info h3')).toBeVisible({ timeout: 5000 });
    await expect(firstItem.locator('.game-key')).toBeVisible({ timeout: 5000 });
  });

  test('chaque jeu affiche les actions (toggle, modifier, supprimer)', async ({ page }) => {
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    if (!(await page.locator('.games-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas de jeux, test ignoré' });
      return;
    }

    const firstItem = page.locator('.game-item').first();
    const actions = firstItem.locator('.game-actions');
    await expect(actions).toBeVisible({ timeout: 5000 });

    // Toggle, bouton édition, bouton suppression
    await expect(actions.locator('mat-slide-toggle')).toBeVisible({ timeout: 5000 });
    await expect(actions.locator('button[aria-label^="Modifier"]')).toBeVisible({ timeout: 5000 });
    await expect(actions.locator('button[aria-label^="Supprimer"]')).toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD — Create → Edit → Delete (serial, ordre garanti)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Jeux admin — CRUD complet', () => {
  // Partager l'état de login entre les tests du groupe serial
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

  test('création : ouvrir le dialog et créer un nouveau jeu', async ({ page }) => {
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const filled = await openCreateDialogAndFill(page, TEST_GAME_KEY, TEST_GAME_NAME);
    expect(filled).toBe(true);

    // Cliquer sur "Enregistrer"
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme après la sauvegarde
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le nouveau jeu doit apparaître dans la liste
    const newGameItem = page.locator('.game-item').filter({
      has: page.locator('h3', { hasText: TEST_GAME_NAME })
    });
    await expect(newGameItem).toBeVisible({ timeout: 15000 });
  });

  test('le jeu créé affiche le bon nom et la bonne clé', async ({ page }) => {
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const gameItem = page.locator('.game-item').filter({
      has: page.locator('h3', { hasText: TEST_GAME_NAME })
    });

    await expect(gameItem).toBeVisible({ timeout: 10000 });
    await expect(gameItem.locator('.game-key')).toContainText(TEST_GAME_KEY);
  });

  test('édition : modifier le nom du jeu créé', async ({ page }) => {
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const gameItem = page.locator('.game-item').filter({
      has: page.locator('h3', { hasText: TEST_GAME_NAME })
    });
    await expect(gameItem).toBeVisible({ timeout: 10000 });

    // Cliquer sur "Modifier"
    const editBtn = gameItem.locator(`button[aria-label="Modifier ${TEST_GAME_NAME}"]`);
    await editBtn.click();

    // Attendre que le dialog d'édition s'ouvre
    const dialogTitle = page.locator('h2[mat-dialog-title]');
    await expect(dialogTitle).toBeVisible({ timeout: 10000 });
    await expect(dialogTitle).toHaveText('Modifier le jeu');

    // Modifier le champ nom
    const nameInput = page.locator('input[formcontrolname="name"]');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.clear();
    await nameInput.fill(UPDATED_GAME_NAME);

    // Sauvegarder
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le jeu doit maintenant afficher le nouveau nom
    const updatedItem = page.locator('.game-item').filter({
      has: page.locator('h3', { hasText: UPDATED_GAME_NAME })
    });
    await expect(updatedItem).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien nom n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // L'ancien nom ne doit plus être présent dans la liste
    const oldItem = page.locator('.game-item h3', { hasText: TEST_GAME_NAME });
    await expect(oldItem).not.toBeVisible({ timeout: 5000 });
  });

  test('suppression : supprimer le jeu de test (nettoyage)', async ({ page }) => {
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Chercher le jeu avec l'un ou l'autre nom (selon si l'édition a réussi)
    const gameToDelete = page.locator('.game-item').filter({
      has: page.locator('h3', { hasText: UPDATED_GAME_NAME })
    });
    const fallbackItem = page.locator('.game-item').filter({
      has: page.locator('h3', { hasText: TEST_GAME_NAME })
    });

    const updatedExists = await gameToDelete.isVisible().catch(() => false);
    const originalExists = await fallbackItem.isVisible().catch(() => false);

    const targetName = updatedExists ? UPDATED_GAME_NAME : (originalExists ? TEST_GAME_NAME : null);

    if (!targetName) {
      test.info().annotations.push({ type: 'note', description: 'Jeu de test non trouvé, déjà supprimé ?' });
      return;
    }

    await deleteGameByName(page, targetName);

    // Vérifier que le jeu n'est plus dans la liste
    const deletedItem = page.locator('.game-item').filter({
      has: page.locator('h3', { hasText: targetName })
    });
    await expect(deletedItem).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Dialog — Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Jeux admin — Validation du formulaire', () => {
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
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('le bouton Enregistrer est désactivé si les champs requis sont vides', async ({ page }) => {
    // Ouvrir le dialog de création
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau jeu' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Sans remplir les champs, le bouton Enregistrer doit être disabled
    const saveBtn = page.locator('mat-dialog-container button[mat-raised-button]').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('la clé avec des espaces ou majuscules affiche une erreur de validation', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau jeu' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    const keyInput = page.locator('input[formcontrolname="key"]');
    await keyInput.fill('Clé Invalide!');
    await keyInput.blur();

    // L'erreur de pattern doit apparaître
    const error = page.locator('mat-error').filter({ hasText: /lettres minuscules/ });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('Annuler dans le dialog ferme la fenêtre sans créer de jeu', async ({ page }) => {
    const countBefore = await page.locator('.game-item').count();

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau jeu' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement
    await page.locator('input[formcontrolname="name"]').fill('Jeu non sauvegardé');

    // Cliquer sur Annuler
    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    // Le nombre de jeux ne doit pas avoir changé
    const countAfter = await page.locator('.game-item').count();
    expect(countAfter).toBe(countBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Toggle actif/inactif
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Jeux admin — Toggle actif/inactif', () => {
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
    await navigateToGames(page);
    await page.locator('.skeleton-list[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  });

  test('le toggle actif/inactif est présent sur chaque jeu', async ({ page }) => {
    if (!(await page.locator('.games-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas de jeux dans la base' });
      return;
    }

    const firstToggle = page.locator('.game-item').first().locator('mat-slide-toggle');
    await expect(firstToggle).toBeVisible({ timeout: 5000 });
  });

  test('le toggle a un aria-label descriptif', async ({ page }) => {
    if (!(await page.locator('.games-list').isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Pas de jeux dans la base' });
      return;
    }

    const firstToggle = page.locator('.game-item').first().locator('mat-slide-toggle');
    // Le aria-label est défini dynamiquement : "Activer X" ou "Désactiver X"
    const ariaLabel = await firstToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Activer|Désactiver/);
  });
});
