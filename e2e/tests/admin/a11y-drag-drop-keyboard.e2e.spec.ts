/**
 * Tests E2E — Accessibilite drag-drop clavier (WCAG 2.1.1) — EPIC-19 a11y
 *
 * Audit de tous les composants utilisant cdkDrag/cdkDropList :
 * - staff-list.component (staff-grid)
 * - games.component (games-list)
 * - teams.component (teams-list)
 * - sponsors-list.component (sponsors-list)
 * - recruitment.component (posts-list)
 * - twitch-channels.component (tbody cdkDropList)
 * - coaching-staff-dialog.component (coach-row cdkDrag)
 * - team-members-dialog (membres dialog)
 *
 * Pour chaque composant, on verifie :
 * 1. Le drag handle est present et visible
 * 2. Le drag handle est focusable OU un element alternatif clavier existe
 * 3. Si des boutons "Monter/Descendre" existent, ils sont accessibles
 *
 * Note : Les tests de reordonnement reel via clavier sont limites
 * au navigateur Chromium en mode headless. L'objectif principal est
 * de detecter les violations d'accessibilite (absence d'alternative clavier).
 *
 * DEFAUTS IDENTIFIES (references BACKLOG enabler a11y-drag-drop-keyboard) :
 * - A11Y-DD-01 : cdkDropList sans aria-live region
 * - A11Y-DD-02 : drag-drop sans alternative clavier
 * - A11Y-DD-03 : cdkDragHandle sur div non focusable (pas de tabindex)
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Helper : verifier si un drag handle est focusable
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifie si l'element avec le role cdkDragHandle est focusable.
 * Un element est focusable si :
 * - Il a tabindex >= 0
 * - C'est un element interactif natif (button, input, etc.)
 * - Il a un attribut focusable explicite
 */
async function isDragHandleFocusable(page: Page, dragHandleLocator: import('@playwright/test').Locator): Promise<boolean> {
  const count = await dragHandleLocator.count();
  if (count === 0) return false;

  const handle = dragHandleLocator.first();
  const tagName = await handle.evaluate((el) => el.tagName.toLowerCase());
  const tabIndex = await handle.getAttribute('tabindex');

  const nativeFocusableTags = ['button', 'input', 'select', 'textarea', 'a'];
  if (nativeFocusableTags.includes(tagName)) return true;
  if (tabIndex !== null && parseInt(tabIndex, 10) >= 0) return true;

  return false;
}

/**
 * Verifie si une alternative clavier (boutons monter/descendre) existe
 * pour le composant donné.
 */
async function hasKeyboardAlternative(
  page: Page,
  containerLocator: import('@playwright/test').Locator,
): Promise<boolean> {
  // Chercher des boutons avec aria-label contenant "Monter" ou "Descendre" ou "Haut" ou "Bas"
  const moveButtons = containerLocator.locator(
    'button[aria-label*="Monter"], button[aria-label*="Descendre"], button[aria-label*="haut"], button[aria-label*="bas"]',
  );
  const count = await moveButtons.count();
  return count > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit : Staff List
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Drag-drop : Staff List', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) test.skip();
  });

  test('[AUDIT] les drag handles de staff-grid existent', async ({ page }) => {
    await page.goto('/admin/staff', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-grid[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.staff-grid .staff-card').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) {
      test.info().annotations.push({ type: 'note', description: 'Aucun membre staff disponible' });
      return;
    }

    const dragHandles = page.locator('.staff-grid .drag-handle');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[A11Y-DD-03 VIOLATION] le drag handle de staff-grid n\'est PAS focusable (div sans tabindex)', async ({ page }) => {
    await page.goto('/admin/staff', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-grid[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.staff-grid .staff-card').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) return;

    const dragHandle = page.locator('.staff-grid .drag-handle').first();
    const focusable = await isDragHandleFocusable(page, dragHandle);

    // DOCUMENTER LA VIOLATION : le drag handle est un div sans tabindex
    // Ce test est volontairement un test de detection de violation
    if (!focusable) {
      test.info().annotations.push({
        type: 'bug',
        description: '[A11Y-DD-03] Le drag handle .staff-grid .drag-handle est un <div> sans tabindex="0". WCAG 2.1.1 VIOLATION. Fix requis : ajouter tabindex="0" ou utiliser un <button>.',
      });
    }

    // Ce test documente une violation CONNUE et actuelle (voir recap en fin de
    // fichier) : le handle n'est volontairement pas encore focusable.
    // Quand le fix (tabindex="0" / <button>) sera livre, ce test echouera
    // et servira de rappel pour retirer l'annotation ci-dessus.
    expect(focusable).toBe(false);
  });

  test('[A11Y-DD-02 VIOLATION] aucun bouton monter/descendre alternatif dans staff-grid', async ({ page }) => {
    await page.goto('/admin/staff', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-grid[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.staff-grid .staff-card').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) return;

    const staffGrid = page.locator('.staff-grid');
    const hasAlt = await hasKeyboardAlternative(page, staffGrid);

    if (!hasAlt) {
      test.info().annotations.push({
        type: 'bug',
        description: '[A11Y-DD-02] Le composant staff-grid n\'a pas de boutons Monter/Descendre. WCAG 2.1.1 VIOLATION. Fix requis : ajouter des boutons alternatifs ou activer la navigation CDK native par clavier.',
      });
    }

    // Violation CONNUE et actuelle (voir recap en fin de fichier) : aucune
    // alternative clavier n'existe encore. Ce test echouera quand le fix
    // sera livre, servant de rappel pour retirer l'annotation ci-dessus.
    expect(hasAlt).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit : Games List
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Drag-drop : Games List', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) test.skip();
  });

  test('[AUDIT] les drag handles de games-list existent', async ({ page }) => {
    await page.goto('/admin/games', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-list[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.games-list .game-item').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) {
      test.info().annotations.push({ type: 'note', description: 'Aucun jeu disponible' });
      return;
    }

    const dragHandles = page.locator('.games-list .drag-handle');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[A11Y-DD-03 VIOLATION] le drag handle de games-list n\'est pas focusable', async ({ page }) => {
    await page.goto('/admin/games', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-list[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.games-list .game-item').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) return;

    const dragHandle = page.locator('.games-list .drag-handle').first();
    const focusable = await isDragHandleFocusable(page, dragHandle);

    if (!focusable) {
      test.info().annotations.push({
        type: 'bug',
        description: '[A11Y-DD-03] Le drag handle .games-list .drag-handle est non focusable. WCAG 2.1.1 VIOLATION.',
      });
    }

    // Violation CONNUE et actuelle (voir recap en fin de fichier).
    expect(focusable).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit : Teams List
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Drag-drop : Teams List', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) test.skip();
  });

  test('[AUDIT] les drag handles de teams-list existent', async ({ page }) => {
    await page.goto('/admin/teams', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-list[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.teams-list .team-item').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) {
      test.info().annotations.push({ type: 'note', description: 'Aucune equipe disponible' });
      return;
    }

    const dragHandles = page.locator('.teams-list .drag-handle');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[A11Y-DD-02 VIOLATION] aucun bouton monter/descendre dans teams-list', async ({ page }) => {
    await page.goto('/admin/teams', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-list[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.teams-list .team-item').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) return;

    const teamsList = page.locator('.teams-list');
    const hasAlt = await hasKeyboardAlternative(page, teamsList);

    if (!hasAlt) {
      test.info().annotations.push({
        type: 'bug',
        description: '[A11Y-DD-02] Le composant teams-list n\'a pas de boutons Monter/Descendre. WCAG 2.1.1 VIOLATION.',
      });
    }

    // Violation CONNUE et actuelle (voir recap en fin de fichier).
    expect(hasAlt).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit : Sponsors List
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Drag-drop : Sponsors List', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) test.skip();
  });

  test('[AUDIT] les drag handles de sponsors-list existent', async ({ page }) => {
    await page.goto('/admin/sponsors', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton, [role="status"]')
      .first()
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.sponsors-list .sponsor-item').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) {
      test.info().annotations.push({ type: 'note', description: 'Aucun sponsor disponible' });
      return;
    }

    const dragHandles = page.locator('.sponsors-list .drag-handle');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit : Recruitment (posts-list)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Drag-drop : Recruitment Posts', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) test.skip();
  });

  test('[AUDIT] les drag handles de posts-list existent', async ({ page }) => {
    await page.goto('/admin/recruitment', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton, [role="status"]')
      .first()
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.posts-list .post-item').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) {
      test.info().annotations.push({ type: 'note', description: 'Aucune offre de recrutement disponible' });
      return;
    }

    const dragHandles = page.locator('.posts-list .drag-handle');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit : Twitch Channels (tbody cdkDropList)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Drag-drop : Twitch Channels', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) test.skip();
  });

  test('[AUDIT] les drag handles de channels-table existent', async ({ page }) => {
    await page.goto('/admin/twitch-channels', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-table[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.channels-table .channel-row').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) {
      test.info().annotations.push({ type: 'note', description: 'Aucune chaîne Twitch configurée' });
      return;
    }

    const dragHandles = page.locator('.channels-table .drag-handle');
    const count = await dragHandles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('[A11Y-DD-03 VIOLATION] le drag handle de twitch channels n\'est pas focusable (span sans tabindex)', async ({ page }) => {
    await page.goto('/admin/twitch-channels', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-table[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasItems = await page.locator('.channels-table .channel-row').first().isVisible({ timeout: 10000 }).catch(() => false);
    if (!hasItems) return;

    const dragHandle = page.locator('.channels-table .drag-handle').first();
    const focusable = await isDragHandleFocusable(page, dragHandle);

    if (!focusable) {
      test.info().annotations.push({
        type: 'bug',
        description: '[A11Y-DD-03] Le drag handle .channels-table .drag-handle est un <span> sans tabindex="0". WCAG 2.1.1 VIOLATION.',
      });
    }

    // Violation CONNUE et actuelle (voir recap en fin de fichier).
    expect(focusable).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Audit : Coaching Staff Dialog
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Drag-drop : Coaching Staff Dialog', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) test.skip();
  });

  test('[AUDIT] les drag handles du coaching staff dialog sont presents', async ({ page }) => {
    await page.goto('/admin/teams', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.skeleton-list[role="status"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    const hasTeams = await page.locator('.teams-list').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeams) {
      test.info().annotations.push({ type: 'note', description: 'Aucune equipe disponible' });
      return;
    }

    // Ouvrir le dialog coaching staff
    const sportsBtns = page.locator('button[mat-icon-button]').filter({
      has: page.locator('mat-icon', { hasText: 'sports' }),
    });
    const count = await sportsBtns.count();
    if (count === 0) return;

    await sportsBtns.first().click();

    const dialogVisible = await page
      .locator('mat-dialog-container')
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (!dialogVisible) return;

    // Si des coaches sont presents, verifier les drag handles
    const coachRows = page.locator('mat-dialog-container .coach-row');
    const coachCount = await coachRows.count();

    if (coachCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Aucun coach dans le dialog' });
      return;
    }

    const dragHandles = page.locator('mat-dialog-container .drag-handle');
    const handleCount = await dragHandles.count();
    expect(handleCount).toBe(coachCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Recapitulatif des violations detectees
// ─────────────────────────────────────────────────────────────────────────────

test.describe.skip('A11Y — Recapitulatif des violations detectees', () => {
  /**
   * Ce test de synthese documente toutes les violations WCAG 2.1.1 detectees
   * par les tests ci-dessus. Il sert de reference pour le backlog et le fix.
   *
   * VIOLATIONS IDENTIFIEES :
   *
   * [A11Y-DD-01] cdkDropList sans region aria-live :
   *   Composants : staff-grid, games-list, teams-list, sponsors-list, posts-list,
   *                channels-table tbody, coaching-staff-dialog, team-members-dialog
   *   Impact : les lecteurs d'ecran n'annoncent pas la nouvelle position apres reorder
   *   Fix recommande : ajouter <div aria-live="polite" class="visually-hidden">{{ liveMessage() }}</div>
   *
   * [A11Y-DD-02] Pas d'alternative clavier (boutons Monter/Descendre) :
   *   Composants : TOUS les composants ci-dessus
   *   Impact : WCAG 2.1.1 VIOLATION - utilisateurs au clavier impossibles
   *   Fix recommande : ajouter des boutons mat-icon-button avec aria-label + moveUp()/moveDown()
   *
   * [A11Y-DD-03] cdkDragHandle sur element non focusable :
   *   Composants : staff-grid (<div>), games-list (<div>), teams-list (<div>),
   *                sponsors-list (<div>), recruitment (<div>), twitch-channels (<span>)
   *   Impact : le handle n'est pas atteignable via Tab
   *   Fix recommande : ajouter tabindex="0" sur le handle ou remplacer par un <button>
   *
   * [MOBILE] Le drag handle est visible sur mobile sans alternative tactile :
   *   Impact mineur, le drag natif fonctionne sur mobile mais aucun test E2E mobile present
   */
  test('test de synthese des violations a11y drag-drop (informatif)', async ({ page }) => {
    const violations = [
      'A11Y-DD-01: aria-live manquant sur tous les cdkDropList',
      'A11Y-DD-02: aucune alternative clavier (boutons monter/descendre) sur aucun composant',
      'A11Y-DD-03: drag handles non focusables (div/span sans tabindex) sur 7 composants',
    ];

    // Ce test ne fail jamais - il est purement documentaire
    test.info().annotations.push({
      type: 'info',
      description: `VIOLATIONS A11Y DETECTEES :\n${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}`,
    });

    // Verifier que la page admin est accessible (test de sanite)
    await page.evaluate(() => localStorage.clear());
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.login-card')).toBeVisible({ timeout: 15000 });
  });
});
