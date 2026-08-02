/**
 * Tests E2E — Page admin Staff de coaching (`/admin/teams/:id/coaching`)
 *
 * Non-régression de la migration dialogue -> page routée (EPIC-41, feature 3).
 * L'écran était le dernier dialogue au palier `xl` (1200px) ouvert depuis la
 * liste des équipes ; c'est désormais une page adressable. Les tests couvrent
 * donc en priorité ce que le dialogue ne savait pas faire : URL partageable,
 * retour arrière, identifiant inconnu, garde de sortie — puis le parcours
 * métier de bout en bout, du back-office à la page publique de l'équipe.
 *
 * Sélecteurs (relevés dans les composants, pas devinés) :
 *
 * Liste des équipes (teams.component.ts) :
 * - .team-item                                    → carte d'une équipe
 * - .team-info h3                                 → nom de l'équipe
 * - button[aria-label^="Gérer le coaching staff"] → accès à la page staff
 *
 * Page staff (coaching-staff-page.component.html) :
 * - .page-header h1                               → « Staff de coaching de <équipe> »
 * - button.back-button                            → retour à la liste des équipes
 * - .error-state / [data-testid="error-retry"]    → identifiant inconnu + réessai
 * - button[aria-label="Ajouter un coach"]         → ouverture du formulaire
 * - .coach-row                                    → ligne d'un coach
 * - .coach-info strong                            → pseudo affiché
 * - .coach-info .role-badge                       → rôle affiché
 * - button.drag-handle                            → poignée (souris + clavier)
 * - button[aria-label^="Deplacer"]                → flèches Monter / Descendre
 * - button[aria-label^="Modifier "] / ^="Supprimer " → actions de ligne
 * - .form-section form                            → formulaire create / edit
 * - input[formcontrolname="name"] / ="role"       → champs requis
 * - [data-testid="form-submit"]                   → « Ajouter » / « Mettre à jour »
 * - [data-testid="form-cancel"]                   → « Annuler »
 * - .empty-state                                  → aucun coach
 *
 * Page publique (team-detail.html, equipes.html) :
 * - .team-card / .team-name                       → carte d'équipe du listing
 * - .coach-card .coach-name                       → coach affiché sur la fiche équipe
 *
 * Dialog de confirmation (confirm-dialog.component.ts) :
 * - mat-dialog-container button « Supprimer » / « Quitter »
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

// Les deux pseudos ne doivent pas se prefixer l'un l'autre : les locators
// filtrent par texte contenu.
const TEST_COACH_NAME = 'CoachE2E';
const TEST_COACH_ROLE = 'Head Coach E2E';
const UPDATED_COACH_ROLE = 'Analyste Senior E2E';
const SECOND_COACH_NAME = 'AdjointE2E';
const SECOND_COACH_ROLE = 'Analyste E2E';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToTeams(page: Page): Promise<void> {
  await page.goto('/admin/teams', { waitUntil: 'domcontentloaded' });
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});
}

/**
 * Ouvre la page staff de la première équipe et retourne son nom.
 * `null` si aucune équipe n'existe en base.
 */
async function openFirstTeamCoaching(page: Page): Promise<string | null> {
  await navigateToTeams(page);

  const firstItem = page.locator('.team-item').first();
  if (!(await firstItem.isVisible().catch(() => false))) return null;

  const teamName = (await firstItem.locator('.team-info h3').textContent())?.trim() ?? '';
  await firstItem.locator('button[aria-label^="Gérer le coaching staff"]').click();

  await expect(page).toHaveURL(/\/admin\/teams\/\d+\/coaching$/, { timeout: 10000 });
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});

  return teamName;
}

/** Ligne d'un coach repérée par son pseudo. */
function coachRow(page: Page, name: string) {
  return page.locator('.coach-row').filter({ has: page.locator('strong', { hasText: name }) });
}

async function addCoach(page: Page, name: string, role: string): Promise<void> {
  await page.locator('button[aria-label="Ajouter un coach"]').click();

  const form = page.locator('.form-section form');
  await expect(form).toBeVisible({ timeout: 5000 });

  await form.locator('input[formcontrolname="name"]').fill(name);
  await form.locator('input[formcontrolname="role"]').fill(role);

  const submit = form.locator('[data-testid="form-submit"]');
  await expect(submit).toBeEnabled({ timeout: 5000 });
  await submit.click();

  await expect(coachRow(page, name)).toBeVisible({ timeout: 15000 });
}

/** Supprime un coach s'il existe. Sans effet sinon. */
async function removeCoachIfPresent(page: Page, name: string): Promise<void> {
  const row = coachRow(page, name);
  if (!(await row.isVisible().catch(() => false))) return;

  await row.locator(`button[aria-label="Supprimer ${name}"]`).click();
  await page
    .locator('mat-dialog-container button')
    .filter({ hasText: /Supprimer|Confirmer/ })
    .last()
    .click();
  await expect(row).toBeHidden({ timeout: 10000 });
}

/** Pseudos des coachs, dans l'ordre affiché. */
async function coachOrder(page: Page): Promise<string[]> {
  const names = await page.locator('.coach-info strong').allTextContents();
  return names.map((name) => name.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : la page comme page — ce que le dialogue ne savait pas faire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page admin Staff de coaching — adressabilité', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) {
      test.skip();
    }
  });

  test('le bouton « Gérer le coaching staff » navigue vers une URL dédiée', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    // Aucun overlay : le dialogue de 1200px a disparu, et avec lui le palier `xl`.
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    await expect(page.locator('.page-header h1')).toContainText(
      `Staff de coaching de ${teamName}`,
    );
  });

  test("l'URL partagée dit de quelle équipe il s'agit", async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    const url = page.url();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.page-header h1')).toContainText(
      `Staff de coaching de ${teamName}`,
      { timeout: 15000 },
    );
  });

  test('le retour arrière du navigateur ramène à la liste des équipes', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.goBack();

    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
    await expect(page.locator('.team-item').first()).toBeVisible({ timeout: 10000 });
  });

  test('le bouton de retour ramène à la liste des équipes', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('button.back-button').click();

    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
  });

  test("un identifiant d'équipe inconnu affiche une erreur avec réessai", async ({ page }) => {
    await page.goto('/admin/teams/999999/coaching', { waitUntil: 'domcontentloaded' });

    // Une liste vide ferait croire a une equipe sans coach.
    await expect(page.locator('.error-state')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="error-retry"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.coach-row')).toHaveCount(0);
  });

  test('le fil d’Ariane nomme la sous-page', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    // Sans entree dans SUBPAGE_LABELS, le fil s'arreterait a « Équipes ».
    await expect(page.locator(`nav[aria-label="Fil d'Ariane"]`)).toContainText(
      'Staff de coaching',
      { timeout: 10000 },
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD + réordonnancement (serial, ordre garanti)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page admin Staff de coaching — CRUD et réordonnancement', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) {
      test.skip();
    }
  });

  test('ajoute un coach depuis la page', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await removeCoachIfPresent(page, TEST_COACH_NAME);
    await addCoach(page, TEST_COACH_NAME, TEST_COACH_ROLE);

    // Le formulaire se replie apres l'ajout : la saisie deja enregistree ne
    // doit pas rester a l'ecran, sinon la garde de sortie la prend pour un
    // brouillon.
    await expect(page.locator('.form-section')).toHaveCount(0);
    await expect(coachRow(page, TEST_COACH_NAME).locator('.role-badge')).toContainText(
      TEST_COACH_ROLE,
    );
  });

  test('le coach ajouté apparaît sur la page publique de l’équipe', async ({ page }) => {
    // Le parcours complet de l'US : le back-office alimente bien la vitrine.
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    if (!(await coachRow(page, TEST_COACH_NAME).isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Coach de test absent, ignoré' });
      return;
    }

    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    const card = page
      .locator('.team-card')
      .filter({ has: page.locator('.team-name', { hasText: teamName }) })
      .first();

    if (!(await card.isVisible({ timeout: 15000 }).catch(() => false))) {
      // L'equipe peut etre desactivee : elle n'apparait alors pas publiquement.
      test.info().annotations.push({ type: 'note', description: 'Équipe non publiée, ignoré' });
      return;
    }

    await card.click();
    await expect(page.locator('.coach-card .coach-name', { hasText: TEST_COACH_NAME })).toBeVisible(
      { timeout: 15000 },
    );
  });

  test('édite le rôle du coach ajouté', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    const row = coachRow(page, TEST_COACH_NAME);
    if (!(await row.isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Coach de test absent, ignoré' });
      return;
    }

    await row.locator(`button[aria-label="Modifier ${TEST_COACH_NAME}"]`).click();

    const roleInput = page.locator('.form-section form input[formcontrolname="role"]');
    await expect(roleInput).toHaveValue(TEST_COACH_ROLE, { timeout: 5000 });

    await roleInput.fill(UPDATED_COACH_ROLE);
    await page.locator('.form-section form [data-testid="form-submit"]').click();

    await expect(coachRow(page, TEST_COACH_NAME).locator('.role-badge')).toContainText(
      UPDATED_COACH_ROLE,
      { timeout: 15000 },
    );
  });

  test('déplace un coach et conserve l’ordre après rechargement', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    // Deux lignes au minimum sont necessaires pour observer un deplacement.
    await removeCoachIfPresent(page, SECOND_COACH_NAME);
    await addCoach(page, SECOND_COACH_NAME, SECOND_COACH_ROLE);

    const before = await coachOrder(page);
    if (before.length < 2) {
      test.info().annotations.push({ type: 'note', description: 'Moins de deux coachs, ignoré' });
      return;
    }

    const lastIndex = before.length - 1;
    const movedName = before[lastIndex];

    await page.locator(`button[aria-label="Deplacer ${movedName} vers le haut"]`).click();

    const expected = [...before];
    expected[lastIndex] = before[lastIndex - 1];
    expected[lastIndex - 1] = movedName;
    await expect.poll(() => coachOrder(page), { timeout: 10000 }).toEqual(expected);

    // Le point de la migration : l'ordre vient du serveur, pas d'un etat de
    // dialogue perdu a la fermeture.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-list[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    await expect.poll(() => coachOrder(page), { timeout: 15000 }).toEqual(expected);
  });

  test('déplace un coach au clavier depuis la poignée (grab & move ARIA)', async ({ page }) => {
    // Gain de `createReorder()` : l'écran n'avait que Monter / Descendre.
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    const before = await coachOrder(page);
    if (before.length < 2) {
      test.info().annotations.push({ type: 'note', description: 'Moins de deux coachs, ignoré' });
      return;
    }

    const handle = page.locator('button.drag-handle').first();
    await handle.focus();
    await expect(handle).toHaveAttribute('aria-roledescription', 'element reordonnable');

    await handle.press(' ');
    await handle.press('ArrowDown');
    await handle.press(' ');

    const expected = [...before];
    expected[0] = before[1];
    expected[1] = before[0];
    await expect.poll(() => coachOrder(page), { timeout: 10000 }).toEqual(expected);

    // Remet l'ordre d'origine pour ne pas polluer la base.
    const restored = page.locator('button.drag-handle').nth(1);
    await restored.focus();
    await restored.press(' ');
    await restored.press('ArrowUp');
    await restored.press(' ');
    await expect.poll(() => coachOrder(page), { timeout: 10000 }).toEqual(before);
  });

  test('supprime les coachs de test (nettoyage)', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await removeCoachIfPresent(page, TEST_COACH_NAME);
    await removeCoachIfPresent(page, SECOND_COACH_NAME);

    await expect(coachRow(page, TEST_COACH_NAME)).toHaveCount(0);
    await expect(coachRow(page, SECOND_COACH_NAME)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : validation du formulaire
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page admin Staff de coaching — validation du formulaire', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) {
      test.skip();
    }
  });

  test('le bouton Ajouter reste désactivé tant que les champs requis sont vides', async ({
    page,
  }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('button[aria-label="Ajouter un coach"]').click();
    await expect(page.locator('.form-section form')).toBeVisible({ timeout: 5000 });

    await expect(page.locator('.form-section form [data-testid="form-submit"]')).toBeDisabled({
      timeout: 5000,
    });
  });

  test('Annuler replie le formulaire sans quitter la page', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('button[aria-label="Ajouter un coach"]').click();
    await expect(page.locator('.form-section form')).toBeVisible({ timeout: 5000 });

    await page.locator('.form-section [data-testid="form-cancel"]').click();

    await expect(page.locator('.form-section')).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/teams\/\d+\/coaching$/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : garde de sortie
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page admin Staff de coaching — garde de sortie', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) {
      test.skip();
    }
  });

  test('une saisie non enregistrée demande confirmation avant de quitter', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('button[aria-label="Ajouter un coach"]').click();
    await page.locator('.form-section form input[formcontrolname="name"]').fill('Brouillon');
    await page.locator('button.back-button').click();

    // Une page se quitte d'un geste qui ne dit nulle part qu'il abandonne.
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog).toContainText('Quitter sans enregistrer');

    // Rester : on doit toujours être sur la page staff.
    await dialog.locator('button').filter({ hasText: 'Annuler' }).click();
    await expect(page).toHaveURL(/\/admin\/teams\/\d+\/coaching$/, { timeout: 10000 });

    // Quitter : la confirmation acceptée ramène à la liste.
    await page.locator('button.back-button').click();
    await page.locator('mat-dialog-container button').filter({ hasText: 'Quitter' }).click();
    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
  });

  test('une page intacte se quitte sans confirmation', async ({ page }) => {
    const teamName = await openFirstTeamCoaching(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('button.back-button').click();

    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });
});
