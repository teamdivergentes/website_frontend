/**
 * Tests E2E — Page admin Membres d'équipe (`/admin/teams/:id/members`)
 *
 * Non-régression de la migration dialogue -> page routée (EPIC-41, feature 3).
 * L'écran était un dialogue `xl` de 1200px ouvert depuis la liste des équipes ;
 * c'est désormais une page adressable. Les tests couvrent donc en priorité ce
 * que le dialogue ne savait pas faire : URL partageable, retour arrière,
 * identifiant inconnu, et persistance de l'ordre après rechargement.
 *
 * Sélecteurs basés sur teams.component.ts, team-members-page.component.ts et
 * ses trois sous-composants :
 *
 * Liste des équipes (teams.component.ts) :
 * - .team-item                               → carte d'une équipe
 * - .team-info h3                            → nom de l'équipe
 * - button[aria-label^="Gérer les membres"]  → accès à la page membres
 *
 * Page membres (team-members-page.component.ts) :
 * - .page-header h1                          → « Membres de <équipe> »
 * - button.back-button                       → retour à la liste des équipes
 * - .error-state / [data-testid="error-retry"] → identifiant inconnu + réessai
 * - .members-layout                          → grille formulaire + liste
 *
 * Formulaire (team-member-form.component.html) :
 * - app-team-member-form                     → conteneur du formulaire
 * - input[formcontrolname="name"]            → pseudo (requis)
 * - input[formcontrolname="role"]            → rôle (requis)
 * - button[type="submit"]                    → « Ajouter » / « Mettre à jour »
 *
 * Liste des membres (team-member-list.component.html) :
 * - app-team-member-row                      → ligne d'un membre
 * - app-team-member-row strong               → pseudo affiché
 * - button.drag-handle                       → poignée (souris + clavier)
 * - button[aria-label^="Deplacer"]           → flèches Monter / Descendre
 * - button[aria-label^="Supprimer "]         → suppression d'un membre
 * - .empty-state                             → aucune ligne
 *
 * Dialog de confirmation (confirm-dialog.component.ts) :
 * - mat-dialog-container button « Supprimer » → confirmer
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

// Les deux pseudos ne doivent pas se prefixer l'un l'autre : les locators
// filtrent par texte contenu, et « JoueurE2E » selectionnerait « JoueurE2E2 ».
const TEST_MEMBER_NAME = 'JoueurE2E';
const TEST_MEMBER_ROLE = 'Top Lane';
const SECOND_MEMBER_NAME = 'MilieuE2E';
const SECOND_MEMBER_ROLE = 'Jungle';

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
 * Ouvre la page membres de la première équipe et retourne son nom.
 * `null` si aucune équipe n'existe en base.
 */
async function openFirstTeamMembers(page: Page): Promise<string | null> {
  await navigateToTeams(page);

  const firstItem = page.locator('.team-item').first();
  if (!(await firstItem.isVisible().catch(() => false))) return null;

  const teamName = (await firstItem.locator('.team-info h3').textContent())?.trim() ?? '';
  await firstItem.locator('button[aria-label^="Gérer les membres"]').click();

  await expect(page).toHaveURL(/\/admin\/teams\/\d+\/members$/, { timeout: 10000 });
  await page
    .locator('.skeleton-list[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});

  return teamName;
}

/** Ligne d'un membre repérée par son pseudo. */
function memberRow(page: Page, name: string) {
  return page.locator('app-team-member-row').filter({ has: page.locator('strong', { hasText: name }) });
}

async function addMember(page: Page, name: string, role: string): Promise<void> {
  const form = page.locator('app-team-member-form');
  await form.locator('input[formcontrolname="name"]').fill(name);
  await form.locator('input[formcontrolname="role"]').fill(role);

  const submit = form.locator('button[type="submit"]');
  await expect(submit).toBeEnabled({ timeout: 5000 });
  await submit.click();

  await expect(memberRow(page, name)).toBeVisible({ timeout: 10000 });
}

/** Supprime un membre s'il existe. Sans effet sinon. */
async function removeMemberIfPresent(page: Page, name: string): Promise<void> {
  const row = memberRow(page, name);
  if (!(await row.isVisible().catch(() => false))) return;

  await row.locator(`button[aria-label="Supprimer ${name}"]`).click();
  await page
    .locator('mat-dialog-container button')
    .filter({ hasText: /Supprimer|Confirmer/ })
    .last()
    .click();
  await expect(row).toBeHidden({ timeout: 10000 });
}

/** Pseudos des membres, dans l'ordre affiché. */
async function memberOrder(page: Page): Promise<string[]> {
  const names = await page.locator('app-team-member-row strong').allTextContents();
  return names.map((name) => name.trim());
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : la page comme page — ce que le dialogue ne savait pas faire
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Page admin Membres d'équipe — adressabilité", () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) {
      test.skip();
    }
  });

  test('le bouton « Gérer les membres » navigue vers une URL dédiée', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    // Aucun overlay : le dialogue de 1200px a disparu.
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    await expect(page.locator('.page-header h1')).toContainText(`Membres de ${teamName}`);
  });

  test("l'URL partagée dit de quelle équipe il s'agit", async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    const url = page.url();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.page-header h1')).toContainText(`Membres de ${teamName}`, {
      timeout: 15000,
    });
  });

  test('le retour arrière du navigateur ramène à la liste des équipes', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.goBack();

    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
    await expect(page.locator('.team-item').first()).toBeVisible({ timeout: 10000 });
  });

  test('le bouton de retour ramène à la liste des équipes', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('button.back-button').click();

    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
  });

  test("un identifiant d'équipe inconnu affiche une erreur avec réessai", async ({ page }) => {
    await page.goto('/admin/teams/999999/members', { waitUntil: 'domcontentloaded' });

    // Un formulaire vide ferait croire a une equipe sans joueur.
    await expect(page.locator('.error-state')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="error-retry"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('app-team-member-form')).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD membre + réordonnancement (serial, ordre garanti)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial("Page admin Membres d'équipe — CRUD et réordonnancement", () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) {
      test.skip();
    }
  });

  test('ajoute un membre depuis la page', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await removeMemberIfPresent(page, TEST_MEMBER_NAME);
    await addMember(page, TEST_MEMBER_NAME, TEST_MEMBER_ROLE);

    // Le formulaire se vide apres l'ajout : la saisie deja enregistree ne doit
    // pas rester a l'ecran, sinon la garde de sortie la prend pour un brouillon.
    await expect(
      page.locator('app-team-member-form input[formcontrolname="name"]')
    ).toHaveValue('');
  });

  test('déplace le membre ajouté et conserve l’ordre après rechargement', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    // Deux lignes au minimum sont necessaires pour observer un deplacement.
    await removeMemberIfPresent(page, SECOND_MEMBER_NAME);
    await addMember(page, SECOND_MEMBER_NAME, SECOND_MEMBER_ROLE);

    const before = await memberOrder(page);
    if (before.length < 2) {
      test.info().annotations.push({ type: 'note', description: 'Moins de deux membres, test ignoré' });
      return;
    }

    const lastIndex = before.length - 1;
    const movedName = before[lastIndex];

    await page
      .locator(`button[aria-label="Deplacer ${movedName} vers le haut"]`)
      .click();

    const expected = [...before];
    expected[lastIndex] = before[lastIndex - 1];
    expected[lastIndex - 1] = movedName;
    await expect.poll(() => memberOrder(page), { timeout: 10000 }).toEqual(expected);

    // Le point de la migration : l'ordre vient du serveur, pas d'un etat de
    // dialogue perdu a la fermeture.
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-list[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    await expect.poll(() => memberOrder(page), { timeout: 15000 }).toEqual(expected);
  });

  test('déplace un membre au clavier depuis la poignée (grab & move ARIA)', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    const before = await memberOrder(page);
    if (before.length < 2) {
      test.info().annotations.push({ type: 'note', description: 'Moins de deux membres, test ignoré' });
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
    await expect.poll(() => memberOrder(page), { timeout: 10000 }).toEqual(expected);

    // Remet l'ordre d'origine pour ne pas polluer la base.
    const restored = page.locator('button.drag-handle').nth(1);
    await restored.focus();
    await restored.press(' ');
    await restored.press('ArrowUp');
    await restored.press(' ');
    await expect.poll(() => memberOrder(page), { timeout: 10000 }).toEqual(before);
  });

  test('édite un membre existant', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    const row = memberRow(page, TEST_MEMBER_NAME);
    if (!(await row.isVisible().catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Membre de test absent, test ignoré' });
      return;
    }

    await row.locator(`button[aria-label="Modifier ${TEST_MEMBER_NAME}"]`).click();

    const form = page.locator('app-team-member-form');
    await expect(form.locator('input[formcontrolname="name"]')).toHaveValue(TEST_MEMBER_NAME, {
      timeout: 5000,
    });

    await form.locator('input[formcontrolname="role"]').fill('Mid Lane');
    await form.locator('button[type="submit"]').click();

    await expect(memberRow(page, TEST_MEMBER_NAME).locator('.role')).toHaveText('Mid Lane', {
      timeout: 10000,
    });
  });

  test('supprime les membres de test (nettoyage)', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await removeMemberIfPresent(page, TEST_MEMBER_NAME);
    await removeMemberIfPresent(page, SECOND_MEMBER_NAME);

    await expect(memberRow(page, TEST_MEMBER_NAME)).toHaveCount(0);
    await expect(memberRow(page, SECOND_MEMBER_NAME)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : garde de sortie
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Page admin Membres d'équipe — garde de sortie", () => {
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
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('app-team-member-form input[formcontrolname="name"]').fill('Brouillon');
    await page.locator('button.back-button').click();

    // Une page se quitte d'un geste qui ne dit nulle part qu'il abandonne.
    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog).toContainText('Quitter sans enregistrer');

    // Rester : on doit toujours être sur la page membres.
    await dialog.locator('button').filter({ hasText: 'Annuler' }).click();
    await expect(page).toHaveURL(/\/admin\/teams\/\d+\/members$/, { timeout: 10000 });

    // Quitter : la confirmation acceptée ramène à la liste.
    await page.locator('button.back-button').click();
    await page
      .locator('mat-dialog-container button')
      .filter({ hasText: 'Quitter' })
      .click();
    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
  });

  test('une page intacte se quitte sans confirmation', async ({ page }) => {
    const teamName = await openFirstTeamMembers(page);
    if (!teamName) {
      test.info().annotations.push({ type: 'note', description: "Pas d'équipes, test ignoré" });
      return;
    }

    await page.locator('button.back-button').click();

    await expect(page).toHaveURL(/\/admin\/teams$/, { timeout: 10000 });
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });
});
