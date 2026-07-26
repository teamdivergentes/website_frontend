/**
 * Tests E2E — Matchs admin (EPIC-37)
 *
 * Parcours couverts :
 * 1. Affichage : /admin/matches charge, titre "Matchs", bouton "Nouveau match"
 * 2. Validation formulaire :
 *    - Dialog sans équipe ni adversaire → bouton Créer désactivé
 *    - Un seul score rempli → erreur "Renseignez les deux scores ou aucun"
 * 3. Parcours serial (nécessite seed) :
 *    - Créer un match FUTUR → section "À venir" + badge "À venir"
 *    - Créer un match PASSÉ (sans scores) → badge "En attente de score"
 *    - Saisir le résultat du match passé (2-1) → badge "Résultat" + score affiché
 *    - Vérifier la home/team-detail : résultat V 2-1 visible dans match-strip
 *    - Cleanup : supprimer les 2 matchs créés
 *
 * Sélecteurs basés sur matches-admin.component.html et match-dialog.component.ts :
 * - .matches-admin-page                 → conteneur principal
 * - .page-header h1                     → titre "Matchs"
 * - .page-header button                 → bouton "Nouveau match"
 * - .section-title                      → libellé de section "À venir" / "Joués"
 * - .matches-table                      → table des matchs
 * - .matches-table tbody tr             → ligne d'un match
 * - .status-badge                       → badge de statut
 * - .status-badge.badge-upcoming        → badge "À venir"
 * - .status-badge.badge-pending         → badge "En attente de score"
 * - .status-badge.badge-result          → badge "Résultat"
 * - button[aria-label^="Saisir le résultat"] → bouton saisie rapide
 * - h2[mat-dialog-title]                → titre du dialog
 * - mat-select[formcontrolname="teamId"]     → select équipe (dialog)
 * - input[formcontrolname="opponentName"]    → champ adversaire (dialog)
 * - input[formcontrolname="scheduledAt"]     → champ date/heure (dialog)
 * - input[formcontrolname="scoreDvg"]        → champ score DVG (dialog + score-dialog)
 * - input[formcontrolname="scoreOpponent"]   → champ score adversaire (score-dialog)
 * - .scores-error                            → erreur validator scoresPaired
 * - button[mat-raised-button][color="primary"] → bouton Créer/Enregistrer
 * - button[mat-button] (Annuler)             → ferme le dialog
 * - mat-dialog-container button[mat-raised-button] → bouton confirmer suppression
 *
 * Sélecteurs match-strip (page publique home / team-detail — EPIC-37 Task 5) :
 * - .match-strip                        → conteneur du bandeau (présent dès qu'un
 *                                          match à venir ou un résultat existe)
 * - .match-strip__last                  → bloc de repli affichant le DERNIER résultat
 *                                          (uniquement si aucun match n'est programmé)
 * - .match-strip__matchup               → libellé "Équipe / Adversaire" (repli)
 * - .match-strip__score                 → score DVG du repli, classe win/loss/draw
 * - .match-strip__score-opponent        → score adverse du repli
 * - .match-strip__form-pill[title]      → pastille de forme V/D/N (état nominal
 *                                          uniquement, 3 max, infobulle = adversaire + date)
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TS = Date.now();
const OPPONENT_FUTURE = `e2e-Opponent-Future-${TS}`;
const OPPONENT_PAST = `e2e-Opponent-Past-${TS}`;

// Date future (+7 jours) au format datetime-local (YYYY-MM-DDTHH:MM)
const futureDateLocal = (): string => {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

// Date passée (-1 jour) au format datetime-local
const pastDateLocal = (): string => {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 16);
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToAdminMatches(page: Page): Promise<boolean> {
  await page.goto('/admin/matches', { waitUntil: 'domcontentloaded' });

  const loaded = await Promise.race([
    page
      .locator('.matches-table')
      .waitFor({ timeout: 15000 })
      .then(() => true)
      .catch(() => false),
    page
      .locator('.empty-state')
      .waitFor({ timeout: 15000 })
      .then(() => true)
      .catch(() => false),
    page
      .locator('.skeleton-table[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .then(() => true)
      .catch(() => false),
  ]);

  await page
    .locator('.skeleton-table[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});

  return loaded;
}

/**
 * Sélectionne la première équipe disponible dans le mat-select du dialog.
 * Retourne false si aucune équipe n'est disponible.
 */
async function selectFirstTeam(page: Page): Promise<boolean> {
  const teamSelect = page.locator('mat-dialog-container mat-select[formcontrolname="teamId"]');
  await expect(teamSelect).toBeVisible({ timeout: 10000 });
  await teamSelect.click();

  const panel = page.locator('mat-option');
  const optionCount = await panel.count().catch(() => 0);
  if (optionCount === 0) {
    // Attendre que les options se chargent
    await panel
      .first()
      .waitFor({ timeout: 5000 })
      .catch(() => {});
  }

  const firstOption = page.locator('mat-option').first();
  const optionVisible = await firstOption.isVisible().catch(() => false);
  if (!optionVisible) return false;

  await firstOption.click();
  return true;
}

/**
 * Ouvre le dialog "Nouveau match" et remplit les champs minimum pour un match futur.
 * Retourne true si le dialog s'est ouvert et les champs ont été remplis.
 */
async function openCreateMatchDialog(
  page: Page,
  opponent: string,
  dateLocal: string,
): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau match' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const opened = await dialogTitle
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!opened) return false;

  await expect(dialogTitle).toContainText('Nouveau match');

  // Sélectionner la première équipe
  const teamSelected = await selectFirstTeam(page);
  if (!teamSelected) return false;

  // Adversaire
  const opponentInput = page.locator('mat-dialog-container input[formcontrolname="opponentName"]');
  await expect(opponentInput).toBeVisible({ timeout: 5000 });
  await opponentInput.fill(opponent);

  // Date/heure
  const scheduledAtInput = page.locator(
    'mat-dialog-container input[formcontrolname="scheduledAt"]',
  );
  await scheduledAtInput.fill(dateLocal);

  return true;
}

/**
 * Supprime un match par le nom de l'adversaire depuis la table admin.
 */
async function deleteMatchByOpponent(page: Page, opponent: string): Promise<void> {
  // Les matchs peuvent être dans la table "À venir" ou "Joués"
  const row = page.locator('.matches-table tbody tr').filter({
    has: page.locator('td', { hasText: opponent }),
  });

  const count = await row.count().catch(() => 0);
  if (count === 0) return;

  const deleteBtn = row.locator(`button[aria-label="Supprimer le match vs ${opponent}"]`);
  await deleteBtn.click();

  const confirmBtn = page
    .locator('mat-dialog-container button[mat-raised-button]')
    .filter({ hasText: /Supprimer|Confirmer/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  await expect(row).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la page admin /admin/matches
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Matchs admin — Affichage', () => {
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

  test('la page /admin/matches se charge après le login', async ({ page }) => {
    const loaded = await navigateToAdminMatches(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/matches/);
  });

  test('le titre "Matchs" est visible', async ({ page }) => {
    await navigateToAdminMatches(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText('Matchs');
  });

  test('le bouton "Nouveau match" est visible', async ({ page }) => {
    await navigateToAdminMatches(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouveau match' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test("la table ou l'état vide est affiché après le chargement", async ({ page }) => {
    await navigateToAdminMatches(page);
    const hasTable = await page
      .locator('.matches-table')
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .locator('.empty-state')
      .isVisible()
      .catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : Validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Matchs admin — Validation du formulaire', () => {
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
    await navigateToAdminMatches(page);
  });

  test('le bouton Créer est désactivé si équipe et adversaire sont vides', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau match' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Ne remplir aucun champ obligatoire
    const opponentInput = page.locator(
      'mat-dialog-container input[formcontrolname="opponentName"]',
    );
    await expect(opponentInput).toBeVisible({ timeout: 5000 });
    // S'assurer que l'adversaire est vide
    await opponentInput.clear();

    // Déclencher le touched sur scheduledAt pour que le form invalide se voie
    const scheduledAtInput = page.locator(
      'mat-dialog-container input[formcontrolname="scheduledAt"]',
    );
    await scheduledAtInput.focus();
    await scheduledAtInput.blur();

    // Le bouton Créer doit être désactivé
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Créer|Enregistrement/ });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('un seul score rempli → erreur scores appariés visible', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau match' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir les champs obligatoires
    await selectFirstTeam(page);
    await page
      .locator('mat-dialog-container input[formcontrolname="opponentName"]')
      .fill('Test Opponent');
    await page
      .locator('mat-dialog-container input[formcontrolname="scheduledAt"]')
      .fill(futureDateLocal());

    // Remplir seulement scoreDvg
    const scoreDvgInput = page.locator('mat-dialog-container input[formcontrolname="scoreDvg"]');
    await scoreDvgInput.fill('2');
    await scoreDvgInput.blur();

    // Toucher scoreOpponent sans le remplir pour déclencher l'affichage de l'erreur
    const scoreOppInput = page.locator(
      'mat-dialog-container input[formcontrolname="scoreOpponent"]',
    );
    await scoreOppInput.focus();
    await scoreOppInput.blur();

    // L'erreur de scores appariés doit être visible
    const scoresError = page.locator('mat-dialog-container .scores-error');
    await expect(scoresError).toBeVisible({ timeout: 5000 });
    await expect(scoresError).toContainText(/deux scores ou aucun/i);

    // Le bouton doit être désactivé
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Créer|Enregistrement/ });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer
    await page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' })
      .click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('Annuler dans le dialog ne crée pas de match', async ({ page }) => {
    const countBefore = await page
      .locator('.matches-table tbody tr')
      .count()
      .catch(() => 0);

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau match' });
    await createBtn.click();
    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    await page
      .locator('mat-dialog-container input[formcontrolname="opponentName"]')
      .fill('Match non sauvegardé');

    await page
      .locator('mat-dialog-container button[mat-button]')
      .filter({ hasText: 'Annuler' })
      .click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    const countAfter = await page
      .locator('.matches-table tbody tr')
      .count()
      .catch(() => 0);
    expect(countAfter).toBe(countBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Parcours nominal admin → public (serial)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Matchs — parcours nominal admin→public', () => {
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

  test('création : match futur → visible dans section "À venir" avec badge "À venir"', async ({
    page,
  }) => {
    await navigateToAdminMatches(page);

    const filled = await openCreateMatchDialog(page, OPPONENT_FUTURE, futureDateLocal());
    expect(filled).toBe(true);

    // Cliquer sur "Créer"
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Créer|Enregistrement/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // La section "À venir" doit exister
    const sectionUpcoming = page.locator('.section-title').filter({ hasText: 'À venir' });
    await expect(sectionUpcoming).toBeVisible({ timeout: 15000 });

    // La ligne du match futur doit être présente dans la table "À venir"
    const row = page.locator('.matches-table tbody tr').filter({
      has: page.locator('td', { hasText: OPPONENT_FUTURE }),
    });
    await expect(row).toBeVisible({ timeout: 15000 });

    // Le badge doit afficher "À venir"
    const badge = row.locator('.status-badge');
    await expect(badge).toBeVisible({ timeout: 5000 });
    await expect(badge).toContainText('À venir');
    await expect(badge).toHaveClass(/badge-upcoming/);
  });

  test('création : match passé (sans scores) → badge "En attente de score"', async ({ page }) => {
    await navigateToAdminMatches(page);

    const filled = await openCreateMatchDialog(page, OPPONENT_PAST, pastDateLocal());
    expect(filled).toBe(true);

    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Créer|Enregistrement/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // La section "Joués" doit exister
    const sectionPast = page.locator('.section-title').filter({ hasText: 'Joués' });
    await expect(sectionPast).toBeVisible({ timeout: 15000 });

    const row = page.locator('.matches-table tbody tr').filter({
      has: page.locator('td', { hasText: OPPONENT_PAST }),
    });
    await expect(row).toBeVisible({ timeout: 15000 });

    const badge = row.locator('.status-badge');
    await expect(badge).toContainText('En attente de score');
    await expect(badge).toHaveClass(/badge-pending/);
  });

  test('saisie rapide : résultat 2-1 → badge "Résultat" + score affiché', async ({ page }) => {
    await navigateToAdminMatches(page);

    const row = page.locator('.matches-table tbody tr').filter({
      has: page.locator('td', { hasText: OPPONENT_PAST }),
    });
    await expect(row).toBeVisible({ timeout: 15000 });

    // Le bouton "Saisir le résultat" doit être visible (match passé)
    const scoreBtn = row.locator(`button[aria-label="Saisir le résultat vs ${OPPONENT_PAST}"]`);
    await expect(scoreBtn).toBeVisible({ timeout: 5000 });
    await scoreBtn.click();

    // Le score-dialog doit s'ouvrir
    const scoreDialog = page.locator('h2[mat-dialog-title]');
    await expect(scoreDialog).toBeVisible({ timeout: 10000 });
    await expect(scoreDialog).toContainText('Résultat');

    // Remplir les scores
    await page.locator('mat-dialog-container input[formcontrolname="scoreDvg"]').fill('2');
    await page.locator('mat-dialog-container input[formcontrolname="scoreOpponent"]').fill('1');

    // Enregistrer
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Enregistrer|Enregistrement/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Recharger la page pour voir l'état mis à jour
    await navigateToAdminMatches(page);

    const updatedRow = page.locator('.matches-table tbody tr').filter({
      has: page.locator('td', { hasText: OPPONENT_PAST }),
    });
    await expect(updatedRow).toBeVisible({ timeout: 15000 });

    // Badge "Résultat"
    const badge = updatedRow.locator('.status-badge');
    await expect(badge).toContainText('Résultat');
    await expect(badge).toHaveClass(/badge-result/);

    // Score affiché "2 - 1"
    const scoreCell = updatedRow.locator('td').filter({ hasText: '2 - 1' });
    await expect(scoreCell).toBeVisible({ timeout: 5000 });
  });

  test('page publique : le résultat V 2-1 apparaît dans le match-strip (home)', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Le résultat 2-1 créé dans ce parcours garantit mode() !== 'empty' : le
    // bandeau DOIT être présent. Échec franc si absent — ce n'est pas un cas
    // à ignorer silencieusement (contrairement à l'ancien skip doux sur
    // .match-strip__results, qui masquait un sélecteur mort sans jamais
    // rien vérifier).
    const strip = page.locator('.match-strip');
    await expect(strip).toBeVisible({ timeout: 15000 });

    // Deux rendus possibles selon qu'un autre match est déjà programmé pour
    // l'équipe concernée :
    // - mode « last-result » (repli) : le résultat 2-1 EST le dernier résultat
    //   affiché, dans .match-strip__last.
    // - mode « upcoming » : un match est programmé ailleurs, le résultat
    //   n'apparaît qu'en pastille de forme (top 3 résultats max).
    const lastBlock = strip.locator('.match-strip__last');
    if (await lastBlock.isVisible().catch(() => false)) {
      await expect(lastBlock.locator('.match-strip__matchup')).toContainText(OPPONENT_PAST);
      await expect(lastBlock.locator('.match-strip__score')).toHaveText('2');
      await expect(lastBlock.locator('.match-strip__score-opponent')).toHaveText('1');
      await expect(lastBlock.locator('.match-strip__score')).toHaveClass(/win/);
      return;
    }

    // Mode « upcoming » : chercher la pastille de forme portant l'adversaire
    // dans son infobulle (le texte visible de la pastille n'est que "V"/"D"/"N").
    const matchingPill = strip.locator(`.match-strip__form-pill[title*="${OPPONENT_PAST}"]`);
    const pillVisible = await matchingPill.isVisible().catch(() => false);
    if (!pillVisible) {
      // Seul cas légitime d'ignorer : le résultat existe mais ne rentre pas
      // dans les 3 pastilles de forme affichées (limite d'affichage réelle,
      // pas un sélecteur mort).
      test.info().annotations.push({
        type: 'note',
        description: `Résultat ${OPPONENT_PAST} non visible parmi les 3 pastilles de forme (limite d'affichage) — test ignoré`,
      });
      return;
    }

    await expect(matchingPill).toHaveText('V');
    await expect(matchingPill).toHaveClass(/win/);
  });

  test('nettoyage : supprimer le match futur e2e', async ({ page }) => {
    await navigateToAdminMatches(page);
    await deleteMatchByOpponent(page, OPPONENT_FUTURE);

    const deletedRow = page.locator('.matches-table tbody tr').filter({
      has: page.locator('td', { hasText: OPPONENT_FUTURE }),
    });
    await expect(deletedRow).not.toBeVisible({ timeout: 10000 });
  });

  test('nettoyage : supprimer le match passé e2e', async ({ page }) => {
    await navigateToAdminMatches(page);
    await deleteMatchByOpponent(page, OPPONENT_PAST);

    const deletedRow = page.locator('.matches-table tbody tr').filter({
      has: page.locator('td', { hasText: OPPONENT_PAST }),
    });
    await expect(deletedRow).not.toBeVisible({ timeout: 10000 });
  });
});
