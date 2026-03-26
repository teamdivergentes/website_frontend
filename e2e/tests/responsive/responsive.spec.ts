/**
 * Tests E2E — Responsive multi-viewport
 *
 * Teste les pages principales dans 3 viewports :
 * - Desktop  : 1280 x 720
 * - Tablette : 768 x 1024
 * - Mobile   : 375 x 667
 *
 * Pour chaque viewport, on vérifie :
 * - Pas de scroll horizontal (overflow)
 * - Contenu principal visible
 * - Header adapté au viewport (desktop nav ou hamburger mobile)
 * - Footer visible et correctement positionné
 * - Les images ne débordent pas
 *
 * Pages testées :
 * - / (accueil)
 * - /structure/equipes
 * - /structure/recrutement
 * - /contact
 * - /structure/sponsors
 * - /articles
 */

import { test, expect } from '@playwright/test';

async function waitForAngularInit(page: import('@playwright/test').Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

// Vérifie l'absence de scroll horizontal
async function expectNoHorizontalScroll(page: import('@playwright/test').Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
}

// Vérifie que les images visibles ne débordent pas de leur conteneur
// Exclut les images masquées, de taille nulle, ou à l'intérieur de conteneurs
// avec overflow:hidden (carrousels, sliders, etc.)
async function expectNoOverflowingImages(page: import('@playwright/test').Page) {
  const overflowingImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const containerWidth = document.documentElement.clientWidth;
    return images.filter(img => {
      const rect = img.getBoundingClientRect();
      // Ignorer les images non visibles (display:none, visibility:hidden, taille nulle)
      const style = window.getComputedStyle(img);
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) {
        return false;
      }
      // Ignorer les images à l'intérieur d'éléments avec overflow:hidden
      // (carrousels, sliders, galeries)
      let parent = img.parentElement;
      while (parent && parent !== document.body) {
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.overflow === 'hidden' || parentStyle.overflowX === 'hidden') {
          return false;
        }
        parent = parent.parentElement;
      }
      return rect.right > containerWidth + 5;
    }).length;
  });
  expect(overflowingImages).toBe(0);
}

const viewports = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablette', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE D'ACCUEIL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Page d\'accueil', () => {
  for (const viewport of viewports) {
    test(`[${viewport.name} ${viewport.width}x${viewport.height}] pas de scroll horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expectNoHorizontalScroll(page);
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] contenu principal visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);

      // La section hero doit être visible
      await expect(page.locator('section.carousel-images')).toBeVisible({ timeout: 10000 });
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] header visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expect(page.locator('mat-toolbar#visitor_navbar')).toBeVisible({ timeout: 10000 });
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] footer visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await page.locator('footer.footer').scrollIntoViewIfNeeded();
      await expect(page.locator('footer.footer')).toBeVisible({ timeout: 10000 });
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] images ne débordent pas`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expectNoOverflowingImages(page);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADAPTATION DU HEADER PAR VIEWPORT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Adaptation du header', () => {
  test('[Desktop 1280x720] la navigation desktop est visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await expect(page.locator('nav.navbar-pages')).toBeVisible({ timeout: 10000 });
  });

  test('[Mobile 375x667] le bouton hamburger est visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await expect(page.locator('.mobile-menu-toggle')).toBeVisible({ timeout: 10000 });
  });

  test('[Mobile 375x667] le menu mobile s\'ouvre et ferme correctement', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);

    // Ouvrir le menu
    await page.locator('.mobile-menu-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.mobile-overlay')).toBeVisible({ timeout: 5000 });

    // Fermer le menu
    await page.locator('.mobile-overlay__close').click();
    await page.waitForTimeout(300);
    const overlayCount = await page.locator('.mobile-overlay').count();
    expect(overlayCount).toBe(0);
  });

  test('[Tablette 768x1024] le header est visible', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await expect(page.locator('mat-toolbar#visitor_navbar')).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ÉQUIPES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Page équipes', () => {
  for (const viewport of viewports) {
    test(`[${viewport.name} ${viewport.width}x${viewport.height}] pas de scroll horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expectNoHorizontalScroll(page);
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] section principale visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expect(page.locator('section.equipes-ambassadeurs')).toBeVisible({ timeout: 10000 });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE RECRUTEMENT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Page recrutement', () => {
  for (const viewport of viewports) {
    test(`[${viewport.name} ${viewport.width}x${viewport.height}] pas de scroll horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expectNoHorizontalScroll(page);
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] titre visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expect(page.locator('.section-header h1')).toBeVisible({ timeout: 10000 });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE CONTACT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Page contact', () => {
  for (const viewport of viewports) {
    test(`[${viewport.name} ${viewport.width}x${viewport.height}] pas de scroll horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/contact', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expectNoHorizontalScroll(page);
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] section contact visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/contact', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expect(page.locator('section#contact')).toBeVisible({ timeout: 10000 });
    });
  }

  test('[Mobile 375x667] images ne débordent pas', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await expectNoOverflowingImages(page);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE SPONSORS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Page sponsors', () => {
  for (const viewport of viewports) {
    test(`[${viewport.name} ${viewport.width}x${viewport.height}] pas de scroll horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expectNoHorizontalScroll(page);
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] titre visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expect(page.locator('.sponsors-header h1')).toBeVisible({ timeout: 10000 });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ARTICLES
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Page articles', () => {
  for (const viewport of viewports) {
    test(`[${viewport.name} ${viewport.width}x${viewport.height}] pas de scroll horizontal`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/articles', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expectNoHorizontalScroll(page);
    });

    test(`[${viewport.name} ${viewport.width}x${viewport.height}] titre ACTUALITÉS visible`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/articles', { waitUntil: 'domcontentloaded' });
      await waitForAngularInit(page);
      await expect(page.locator('.articles-page__title')).toBeVisible({ timeout: 10000 });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER PAR VIEWPORT
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Responsive — Footer', () => {
  const footerPages = ['/', '/contact', '/structure/equipes'];

  for (const viewport of viewports) {
    for (const path of footerPages) {
      test(`[${viewport.name} ${viewport.width}x${viewport.height}] footer visible sur ${path}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        await waitForAngularInit(page);
        await page.locator('footer.footer').scrollIntoViewIfNeeded();
        await expect(page.locator('footer.footer')).toBeVisible({ timeout: 10000 });
      });
    }
  }

  test('[Mobile 375x667] footer ne provoque pas de scroll horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await page.locator('footer.footer').scrollIntoViewIfNeeded();
    await expectNoHorizontalScroll(page);
  });
});
