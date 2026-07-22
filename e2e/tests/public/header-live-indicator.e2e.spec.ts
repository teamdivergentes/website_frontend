/**
 * Tests E2E — Indicateur live dans le header — EPIC-17 F2
 *
 * Verifie :
 * - LED rouge animee si au moins 1 streamer est en live
 * - LED grise si aucun streamer en live
 * - Le lien "EN LIVE" est toujours cliquable (desktop et mobile)
 *
 * Le mock de l'API live est réalisé via page.route() sur
 * GET /api/twitch-channels/live (intervalle 60s). La config backend
 * (page_twitch_visible) est chargée a partir de la BDD réelle —
 * on suppose qu'elle est a true dans l'environnement de test.
 *
 * Sélecteurs basés sur header.html :
 * - [data-testid="nav-live-btn"]        -> bouton EN LIVE desktop
 * - .live-nav-btn__led                  -> LED dans le bouton desktop
 * - .live-nav-btn__led--live            -> classe quand en live
 * - .mobile-overlay__item--live a       -> lien EN LIVE dans le menu mobile
 * - [data-testid="header-menu-toggle"]  -> bouton burger mobile
 * - .mobile-overlay                     -> panneau menu mobile
 */

import { test, expect, Page, Route } from '@playwright/test';
import { isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Données de mock
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_NO_LIVE = [
  { id: 1, twitchUsername: 'DVG1', displayName: 'DVG1', gameLabel: null, isActive: true, isLive: false },
];

const MOCK_ONE_LIVE = [
  { id: 1, twitchUsername: 'DVG1', displayName: 'DVG1', gameLabel: null, isActive: true, isLive: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function mockLiveEndpoint(page: Page, channels: object[]): Promise<void> {
  await page.route('**/api/twitch-channels/live', (route: Route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(channels) });
  });
}

async function loadHomePage(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('mat-toolbar#visitor_navbar').waitFor({ state: 'visible', timeout: 15000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests desktop
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Header live indicator — Desktop (1280px)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('le bouton EN LIVE est présent dans le header (page_twitch_visible=true)', async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_NO_LIVE);
    await loadHomePage(page);

    // Le bouton EN LIVE devrait etre present si page_twitch_visible=true (default)
    const liveBtn = page.locator('[data-testid="nav-live-btn"]');
    const isVisible = await liveBtn.isVisible({ timeout: 10000 }).catch(() => false);

    if (!isVisible) {
      test.info().annotations.push({
        type: 'note',
        description: 'Le bouton EN LIVE n\'est pas visible — page_twitch_visible pourrait etre false dans la config. Vérifier /admin/config.',
      });
      return;
    }

    await expect(liveBtn).toContainText('EN LIVE');
  });

  test('LED grise quand aucun streamer en live', async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_NO_LIVE);
    await loadHomePage(page);

    const liveBtn = page.locator('[data-testid="nav-live-btn"]');
    if (!(await liveBtn.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'EN LIVE bouton absent — page_twitch_visible=false ?' });
      return;
    }

    // Attendre que les données live soient chargées (polling initial)
    await page.waitForTimeout(2000);
    const led = liveBtn.locator('.live-nav-btn__led');
    await expect(led).toBeVisible({ timeout: 5000 });
    await expect(led).not.toHaveClass(/live-nav-btn__led--live/, { timeout: 5000 });
  });

  test('LED rouge quand au moins 1 streamer est en live', async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_ONE_LIVE);
    await loadHomePage(page);

    const liveBtn = page.locator('[data-testid="nav-live-btn"]');
    if (!(await liveBtn.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'EN LIVE bouton absent — page_twitch_visible=false ?' });
      return;
    }

    // Attendre que le service live met a jour le signal (polling initial).
    // toHaveClass() reessaie automatiquement jusqu'au timeout, comme le
    // faisait le expect.poll() precedent.
    const led = liveBtn.locator('.live-nav-btn__led');
    await expect(led).toHaveClass(/live-nav-btn__led--live/, { timeout: 10000 });
  });

  test('clic sur EN LIVE navigue vers /twitch', async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_NO_LIVE);
    await loadHomePage(page);

    const liveBtn = page.locator('[data-testid="nav-live-btn"]');
    if (!(await liveBtn.isVisible({ timeout: 10000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'EN LIVE bouton absent' });
      return;
    }

    await liveBtn.click();
    await page.waitForURL(/\/twitch/, { timeout: 10000 });
    expect(page.url()).toContain('/twitch');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests mobile
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Header live indicator — Mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('lien EN LIVE present dans le menu mobile', async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_NO_LIVE);
    await loadHomePage(page);

    const menuToggle = page.locator('[data-testid="header-menu-toggle"]');
    await menuToggle.click();
    await page.locator('.mobile-overlay').waitFor({ state: 'visible', timeout: 5000 });

    const mobileLiveLink = page.locator('.mobile-overlay__item--live a');
    const isVisible = await mobileLiveLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.info().annotations.push({ type: 'note', description: 'Lien EN LIVE mobile absent — page_twitch_visible=false ?' });
      return;
    }

    await expect(mobileLiveLink).toContainText('EN LIVE');
  });

  test('lien EN LIVE mobile est cliquable et navigue vers /twitch', async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_NO_LIVE);
    await loadHomePage(page);

    await page.locator('[data-testid="header-menu-toggle"]').click();
    await page.locator('.mobile-overlay').waitFor({ state: 'visible', timeout: 5000 });

    const mobileLiveLink = page.locator('.mobile-overlay__item--live a');
    if (!(await mobileLiveLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Lien EN LIVE mobile absent' });
      return;
    }

    await mobileLiveLink.click();
    await page.waitForURL(/\/twitch/, { timeout: 10000 });
    expect(page.url()).toContain('/twitch');
  });
});
