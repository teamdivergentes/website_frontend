/**
 * Tests E2E — Page En Live (/twitch) — EPIC-17 F1
 *
 * Couvre les 3 états de la page :
 *   Etat 1 : 0 streamer en live -> liste de chaînes clickables
 *   Etat 2 : 1 streamer en live -> embed unique visible
 *   Etat 3 : >= 2 streamers en live -> grille de cards
 *
 * Le mock de l'API Twitch est réalisé via page.route() sur
 * GET /api/twitch-channels/live (endpoint du LiveStatusService).
 *
 * Sélecteurs basés sur twitch.component.html :
 * - section#twitch                    -> conteneur principal
 * - h1.title                          -> titre "EN LIVE"
 * - .offline-state                    -> état aucun streamer en live
 * - .offline-badge                    -> badge HORS LIGNE
 * - .channels-grid .channel-card      -> cartes des chaînes (état offline)
 * - .solo-live                        -> conteneur 1 seul streamer en live
 * - .embed-container iframe           -> iframe embed Twitch
 * - .solo-info .live-badge            -> badge EN DIRECT (état 1 live)
 * - .multi-live                       -> conteneur >= 2 streamers en live
 * - .live-cards-grid .live-card       -> cards de streamers en live
 * - .loading-area                     -> état chargement (skeleton)
 */

import { test, expect, Page, Route } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Données de mock
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_CHANNELS_ALL_OFFLINE = [
  { id: 1, twitchUsername: 'StreamerDVG1', displayName: 'Streamer DVG 1', gameLabel: 'LoL', isActive: true, isLive: false },
  { id: 2, twitchUsername: 'StreamerDVG2', displayName: 'Streamer DVG 2', gameLabel: 'Valorant', isActive: true, isLive: false },
];

const MOCK_CHANNELS_ONE_LIVE = [
  { id: 1, twitchUsername: 'StreamerDVG1', displayName: 'Streamer DVG 1', gameLabel: 'LoL', isActive: true, isLive: true, viewerCount: 250, streamGameLabel: 'LoL', streamThumbnailUrl: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_StreamerDVG1-{width}x{height}.jpg' },
  { id: 2, twitchUsername: 'StreamerDVG2', displayName: 'Streamer DVG 2', gameLabel: 'Valorant', isActive: true, isLive: false },
];

const MOCK_CHANNELS_MULTI_LIVE = [
  { id: 1, twitchUsername: 'StreamerDVG1', displayName: 'Streamer DVG 1', gameLabel: 'LoL', isActive: true, isLive: true, viewerCount: 250, streamGameLabel: 'LoL', streamThumbnailUrl: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_StreamerDVG1-{width}x{height}.jpg' },
  { id: 2, twitchUsername: 'StreamerDVG2', displayName: 'Streamer DVG 2', gameLabel: 'Valorant', isActive: true, isLive: true, viewerCount: 1200, streamGameLabel: 'Valorant', streamThumbnailUrl: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_StreamerDVG2-{width}x{height}.jpg' },
  { id: 3, twitchUsername: 'StreamerDVG3', displayName: 'Streamer DVG 3', gameLabel: 'Fortnite', isActive: true, isLive: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function mockLiveEndpoint(page: Page, channels: object[]): Promise<void> {
  await page.route('**/api/twitch-channels/live', (route: Route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(channels) });
  });
}

async function navigateToTwitchPage(page: Page): Promise<void> {
  await page.goto('/twitch', { waitUntil: 'domcontentloaded' });
  await page.locator('section#twitch').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('.loading-area').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Etat 0 : 0 streamer en live -> liste de chaînes clickables
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page /twitch — Etat 0 : aucun streamer en live', () => {
  test.beforeEach(async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_CHANNELS_ALL_OFFLINE);
    await navigateToTwitchPage(page);
  });

  test('le titre "EN LIVE" est visible', async ({ page }) => {
    await expect(page.locator('h1.title')).toContainText('EN LIVE');
  });

  test("l'état offline est affiché avec le badge HORS LIGNE", async ({ page }) => {
    await expect(page.locator('.offline-state')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.offline-state .offline-badge')).toContainText('HORS LIGNE');
  });

  test('les chaînes clickables sont listées dans la grille', async ({ page }) => {
    await expect(page.locator('.offline-state .channels-grid .channel-card--offline')).toHaveCount(2, { timeout: 10000 });
  });

  test('les cartes de chaînes ont des liens Twitch valides', async ({ page }) => {
    const firstCard = page.locator('.offline-state .channels-grid .channel-card--offline').first();
    await expect(firstCard).toHaveAttribute('href', /twitch\.tv/);
    await expect(firstCard).toHaveAttribute('target', '_blank');
    await expect(firstCard).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test("l'embed Twitch n'est PAS visible en état offline", async ({ page }) => {
    await expect(page.locator('.solo-live')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.multi-live')).not.toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Etat 1 : 1 seul streamer en live -> embed unique
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page /twitch — Etat 1 : un seul streamer en live', () => {
  test.beforeEach(async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_CHANNELS_ONE_LIVE);
    await navigateToTwitchPage(page);
  });

  test("l'embed solo est affiché avec l'iframe Twitch", async ({ page }) => {
    await expect(page.locator('.solo-live')).toBeVisible({ timeout: 10000 });
    const iframe = page.locator('.solo-live .embed-container iframe');
    await expect(iframe).toBeVisible({ timeout: 10000 });
    const src = await iframe.getAttribute('src');
    expect(src).toContain('StreamerDVG1');
    expect(src).toContain('player.twitch.tv');
  });

  test('le badge EN DIRECT et le nom du streamer sont visibles', async ({ page }) => {
    await expect(page.locator('.solo-info .live-badge')).toContainText('EN DIRECT');
    await expect(page.locator('.solo-info h2.streamer-name')).toContainText('Streamer DVG 1');
    await expect(page.locator('.solo-info .viewer-count')).toContainText('250');
  });

  test("la grille multi-live n'est PAS visible en état 1 live", async ({ page }) => {
    await expect(page.locator('.multi-live')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.offline-state')).not.toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Etat 2 : >= 2 streamers en live -> grille de cards
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page /twitch — Etat 2 : plusieurs streamers en live', () => {
  test.beforeEach(async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_CHANNELS_MULTI_LIVE);
    await navigateToTwitchPage(page);
  });

  test('la grille multi-live est affichée avec 2 cards de streamers', async ({ page }) => {
    await expect(page.locator('.multi-live')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.live-cards-grid .live-card')).toHaveCount(2, { timeout: 10000 });
  });

  test('chaque live card a un lien Twitch et un compteur spectateurs', async ({ page }) => {
    const firstCard = page.locator('.live-cards-grid .live-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await expect(firstCard).toHaveAttribute('href', /twitch\.tv/);
    await expect(firstCard).toHaveAttribute('target', '_blank');
    await expect(firstCard.locator('.live-card__viewers')).toBeVisible({ timeout: 5000 });
  });

  test("l'embed solo n'est PAS visible en état multi-live", async ({ page }) => {
    await expect(page.locator('.solo-live')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('.offline-state')).not.toBeVisible({ timeout: 5000 });
  });

  test('les chaînes offline sont listées sous les live cards', async ({ page }) => {
    const offlineSection = page.locator('.multi-live .other-channels');
    await expect(offlineSection).toBeVisible({ timeout: 10000 });
    await expect(offlineSection.locator('.channel-card--offline')).toHaveCount(1, { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibilite
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page /twitch — Accessibilite', () => {
  test('la page est accessible via la route /twitch (pas de 404)', async ({ page }) => {
    await mockLiveEndpoint(page, MOCK_CHANNELS_ALL_OFFLINE);
    const response = await page.goto('/twitch', { waitUntil: 'domcontentloaded' });
    expect(response?.status()).not.toBe(404);
    expect(page.url()).not.toContain('/404');
  });
});
