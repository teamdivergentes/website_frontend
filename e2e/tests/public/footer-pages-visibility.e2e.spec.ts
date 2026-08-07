/**
 * Tests E2E — Alignement de la visibilité des pages footer/header
 *
 * Vérifie que les pages masquées via la configuration admin disparaissent
 * à la fois du footer ET du header, en utilisant l'intercepteur de requête
 * pour simuler différents états de configuration.
 *
 * Depuis la refonte du bloc de navigation du footer, celui-ci ne liste QUE les
 * sous-pages de Structure : accueil, articles, boutique, contact et EN LIVE
 * sont portés en permanence par le header. Les cas /articles, /boutique et
 * /twitch ne valent donc plus que côté header, plus un garde-fou vérifiant
 * qu'ils ne réapparaissent pas dans le footer.
 *
 * Sélecteurs utilisés :
 * - nav[aria-label="La structure"]  → navigation footer desktop
 * - nav.navbar-pages a              → liens navigation header desktop
 * - #mobile-menu                    → menu mobile
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
    'tiktok_url',
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
      const footerNav = page.locator('nav[aria-label="La structure"]');
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

    test('le footer ne liste pas /articles, porté par le header', async ({ page }) => {
      await scrollToFooter(page);
      const footerNav = page.locator('nav[aria-label="La structure"]');
      await expect(footerNav.locator('a[href="/articles"]')).toHaveCount(0);
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

    const footerNav = page.locator('nav[aria-label="La structure"]');
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

    const footerNav = page.locator('nav[aria-label="La structure"]');
    const structureLink = footerNav.locator('a[href="/structure"]');
    await expect(structureLink).toBeVisible({ timeout: TIMEOUTS.normal });
  });

  test('les sous-pages visibles de structure sont listées dans le footer', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockConfig(page, []);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await scrollToFooter(page);

    const footerNav = page.locator('nav[aria-label="La structure"]');
    await expect(footerNav.locator('a[href="/structure/equipes"]')).toBeVisible({
      timeout: TIMEOUTS.normal,
    });
    await expect(footerNav.locator('a[href="/structure/sponsors"]')).toBeVisible({
      timeout: TIMEOUTS.normal,
    });
    await expect(footerNav.locator('a[href="/structure/recrutement"]')).toBeVisible({
      timeout: TIMEOUTS.normal,
    });
  });

  test('le bloc de navigation disparaît quand toute la structure est masquée', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockConfig(page, [
      'page_equipes_visible',
      'page_sponsors_visible',
      'page_recrutement_visible',
    ]);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await scrollToFooter(page);

    await expect(page.locator('nav[aria-label="La structure"]')).toHaveCount(0);
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

    const footerNav = page.locator('nav[aria-label="La structure"]');
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

    const footerNav = page.locator('nav[aria-label="La structure"]');
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
