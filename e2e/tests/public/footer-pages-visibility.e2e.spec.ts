/**
 * Tests E2E — Alignement de la visibilité des pages footer/header
 *
 * Vérifie que les pages masquées via la configuration admin disparaissent
 * à la fois du footer ET du header, en utilisant l'intercepteur de requête
 * pour simuler différents états de configuration.
 *
 * Sélecteurs utilisés :
 * - nav[aria-label="Navigation du site"]  → navigation footer desktop
 * - nav.navbar-pages a                    → liens navigation header desktop
 * - #mobile-menu                          → menu mobile
 */

import { test, expect, type Page, type Route } from '@playwright/test';
import { TIMEOUTS } from '../../fixtures/test-data';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function waitForAngularInit(page: Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: TIMEOUTS.appInit });
  await page.waitForLoadState('domcontentloaded');
  // Attendre que la config soit chargée (APP_INITIALIZER)
  await page.waitForTimeout(500);
}

/**
 * Intercepts /api/config and returns a mocked configuration.
 * pagesToHide: list of config keys to set to 'false'
 */
async function mockConfig(
  page: Page,
  pagesToHide: string[] = []
): Promise<void> {
  const allConfigKeys = [
    'page_shop_visible',
    'page_contact_visible',
    'page_equipes_visible',
    'page_sponsors_visible',
    'page_recrutement_visible',
    'page_articles_visible',
    'page_twitch_visible',
    'site_name',
    'youtube_link',
    'twitter_url',
    'instagram_url',
    'discord_url',
    'twitch_url',
    'mail_url',
    'youtube_url',
  ];

  const configs = allConfigKeys.map(key => ({
    key,
    value: pagesToHide.includes(key) ? 'false' : 'true',
    id: key,
  }));

  await page.route('**/api/config', (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(configs),
    });
  });
}

async function scrollToFooter(page: Page) {
  const footer = page.locator('footer.footer');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible({ timeout: TIMEOUTS.normal });
}

// ─────────────────────────────────────────────────────────────────────────────
// /articles — Alignement footer / header
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Visibilité /articles — alignement footer et header', () => {
  test.describe('config : pageArticlesVisible = false', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await mockConfig(page, ['page_articles_visible']);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
    });

    test('le lien /articles est absent du footer quand masqué', async ({ page }) => {
      await scrollToFooter(page);
      const footerNav = page.locator('nav[aria-label="Navigation du site"]');
      const footerLinks = footerNav.locator('a');
      const count = await footerLinks.count();

      for (let i = 0; i < count; i++) {
        const href = await footerLinks.nth(i).getAttribute('href');
        expect(href).not.toBe('/articles');
      }
    });

    test('le lien /articles est absent du header desktop quand masqué', async ({ page }) => {
      await page.locator('mat-toolbar#visitor_navbar').waitFor({ state: 'visible', timeout: TIMEOUTS.normal });
      const navLinks = page.locator('nav.navbar-pages a');
      const count = await navLinks.count();

      for (let i = 0; i < count; i++) {
        const href = await navLinks.nth(i).getAttribute('href');
        expect(href).not.toBe('/articles');
      }
    });
  });

  test.describe('config : pageArticlesVisible = true', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await mockConfig(page, []); // Tout visible
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
    });

    test('le lien /articles est présent dans le footer quand visible', async ({ page }) => {
      await scrollToFooter(page);
      const footerNav = page.locator('nav[aria-label="Navigation du site"]');
      const articlesLink = footerNav.locator('a[href="/articles"]');
      await expect(articlesLink).toBeVisible({ timeout: TIMEOUTS.normal });
    });

    test('le lien /articles est présent dans le header desktop quand visible', async ({ page }) => {
      await page.locator('mat-toolbar#visitor_navbar').waitFor({ state: 'visible', timeout: TIMEOUTS.normal });
      const articlesLink = page.locator('nav.navbar-pages a[href="/articles"]');
      await expect(articlesLink).toBeVisible({ timeout: TIMEOUTS.normal });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /structure — masquage du lien parent si toutes les sous-pages sont masquées
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Visibilité /structure — lien orphelin', () => {
  test('le lien /structure est absent du footer quand toutes ses sous-pages sont masquées', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockConfig(page, [
      'page_equipes_visible',
      'page_sponsors_visible',
      'page_recrutement_visible',
    ]);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await scrollToFooter(page);

    const footerNav = page.locator('nav[aria-label="Navigation du site"]');
    const footerLinks = footerNav.locator('a');
    const count = await footerLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      expect(href).not.toBe('/structure');
    }
  });

  test('le lien /structure reste dans le footer si au moins une sous-page est visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockConfig(page, ['page_sponsors_visible', 'page_recrutement_visible']); // equipes visible
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await scrollToFooter(page);

    const footerNav = page.locator('nav[aria-label="Navigation du site"]');
    const structureLink = footerNav.locator('a[href="/structure"]');
    await expect(structureLink).toBeVisible({ timeout: TIMEOUTS.normal });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// /twitch — anticipation EPIC-17
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Visibilité /twitch — anticipation EPIC-17', () => {
  test('le lien /twitch est absent quand pageTwitchVisible = false', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockConfig(page, ['page_twitch_visible']);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await scrollToFooter(page);

    const footerNav = page.locator('nav[aria-label="Navigation du site"]');
    const footerLinks = footerNav.locator('a');
    const count = await footerLinks.count();

    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      expect(href).not.toBe('/twitch');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Plusieurs pages masquées simultanément
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Masquage simultané de plusieurs pages', () => {
  test('articles ET boutique masqués — les deux absents du footer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockConfig(page, ['page_articles_visible', 'page_shop_visible']);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await scrollToFooter(page);

    const footerNav = page.locator('nav[aria-label="Navigation du site"]');
    const footerLinks = footerNav.locator('a');
    const count = await footerLinks.count();

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    expect(hrefs).not.toContain('/articles');
    expect(hrefs).not.toContain('/boutique');
  });

  test('articles ET boutique masqués — les deux absents du header', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockConfig(page, ['page_articles_visible', 'page_shop_visible']);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);

    await page.locator('mat-toolbar#visitor_navbar').waitFor({ state: 'visible', timeout: TIMEOUTS.normal });
    const navLinks = page.locator('nav.navbar-pages a');
    const count = await navLinks.count();

    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }

    expect(hrefs).not.toContain('/articles');
    expect(hrefs).not.toContain('/boutique');
  });
});
