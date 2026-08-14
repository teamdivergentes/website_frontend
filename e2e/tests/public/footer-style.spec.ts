/**
 * Tests E2E — Style et intégrité visuelle du footer
 *
 * Vérifie sur toutes les pages publiques :
 * - Icônes sociales circulaires (pas de texte visible qui déborde)
 * - Texte sr-only masqué visuellement
 * - Espacement égal entre les liens légaux
 * - Structure visuelle cohérente (logos, copyright, navigation)
 */

import { test, expect, type Page } from '@playwright/test';
import { PUBLIC_ROUTES, TIMEOUTS } from '../../fixtures/test-data';

async function waitForAngularInit(page: Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: TIMEOUTS.appInit });
  await page.waitForLoadState('domcontentloaded');
}

async function scrollToFooter(page: Page) {
  const footer = page.locator('footer.footer');
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible({ timeout: TIMEOUTS.normal });
}

/** Toutes les routes publiques à tester */
const ALL_PUBLIC_PAGES = [
  { name: 'Accueil', path: PUBLIC_ROUTES.home },
  { name: 'Contact', path: PUBLIC_ROUTES.contact },
  { name: 'Boutique', path: PUBLIC_ROUTES.boutique },
  { name: 'Structure', path: PUBLIC_ROUTES.structure },
  { name: 'Sponsors', path: PUBLIC_ROUTES.sponsors },
  { name: 'Équipes', path: PUBLIC_ROUTES.equipes },
  { name: 'Recrutement', path: PUBLIC_ROUTES.recrutement },
  { name: '404', path: PUBLIC_ROUTES.notFound },
];

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER STYLE — DESKTOP (1280x720)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Footer Style — Desktop (1280x720)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  for (const route of ALL_PUBLIC_PAGES) {
    test.describe(`Page: ${route.name} (${route.path})`, () => {

      test.beforeEach(async ({ page }) => {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await waitForAngularInit(page);
      });

      test('le footer est visible', async ({ page }) => {
        await scrollToFooter(page);
      });

      test('les icônes sociales ne montrent pas de texte "(nouvel onglet)"', async ({ page }) => {
        await scrollToFooter(page);
        const socialNav = page.locator('nav[aria-label="Réseaux sociaux"]');
        const socialNavCount = await socialNav.count();
        if (socialNavCount === 0) return;

        // Vérifier qu'aucun texte "(nouvel onglet)" n'est visible dans le footer
        const visibleText = await socialNav.textContent();
        expect(visibleText).not.toContain('nouvel onglet');
      });

      test('les spans sr-only sont masqués visuellement', async ({ page }) => {
        await scrollToFooter(page);
        const srOnlySpans = page.locator('footer.footer .sr-only');
        const count = await srOnlySpans.count();

        for (let i = 0; i < count; i++) {
          const span = srOnlySpans.nth(i);
          const box = await span.boundingBox();
          // sr-only = 1x1px, invisible
          if (box) {
            expect(box.width).toBeLessThanOrEqual(1);
            expect(box.height).toBeLessThanOrEqual(1);
          }
        }
      });

      test('les icônes sociales sont approximativement circulaires', async ({ page }) => {
        await scrollToFooter(page);
        const icons = page.locator('nav[aria-label="Réseaux sociaux"] app-icon-link');
        const count = await icons.count();
        if (count === 0) return;

        for (let i = 0; i < count; i++) {
          const box = await icons.nth(i).boundingBox();
          if (box) {
            // Le ratio largeur/hauteur doit être proche de 1 (circulaire)
            const ratio = box.width / box.height;
            expect(ratio).toBeGreaterThan(0.7);
            expect(ratio).toBeLessThan(1.3);
          }
        }
      });

      test('les séparateurs des liens légaux ont un espacement égal', async ({ page }) => {
        await scrollToFooter(page);
        const legalLinks = page.locator('footer.footer .legal-links');
        const legalCount = await legalLinks.count();
        if (legalCount === 0) return;

        // Récupérer les gaps entre chaque enfant direct du conteneur legal-links
        const gaps = await legalLinks.evaluate((el) => {
          const children = Array.from(el.children);
          const computedStyle = window.getComputedStyle(el);
          const gap = computedStyle.gap || computedStyle.columnGap;
          return {
            gap,
            childCount: children.length,
            display: computedStyle.display,
          };
        });

        // Le conteneur doit être en flex avec un gap uniforme
        expect(gaps.display).toBe('flex');
        expect(gaps.gap).toBeTruthy();
        // Tous les enfants sont au même niveau flex = espacement égal
        expect(gaps.childCount).toBeGreaterThanOrEqual(3);
      });

      test('le copyright contient l\'année courante', async ({ page }) => {
        await scrollToFooter(page);
        const currentYear = new Date().getFullYear().toString();
        const copyrightText = page.locator('.copyrights p');
        const count = await copyrightText.count();
        if (count === 0) return;
        await expect(copyrightText).toContainText(currentYear);
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER STYLE — MOBILE (375x667)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Footer Style — Mobile (375x667)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  for (const route of ALL_PUBLIC_PAGES) {
    test.describe(`Page: ${route.name} (${route.path})`, () => {

      test.beforeEach(async ({ page }) => {
        await page.goto(route.path, { waitUntil: 'domcontentloaded' });
        await waitForAngularInit(page);
      });

      test('le footer est visible', async ({ page }) => {
        await scrollToFooter(page);
      });

      test('les icônes sociales ne montrent pas de texte "(nouvel onglet)"', async ({ page }) => {
        await scrollToFooter(page);
        const socialNav = page.locator('nav[aria-label="Réseaux sociaux"]');
        const socialNavCount = await socialNav.count();
        if (socialNavCount === 0) return;

        const visibleText = await socialNav.textContent();
        expect(visibleText).not.toContain('nouvel onglet');
      });

      test('les icônes sociales sont approximativement circulaires', async ({ page }) => {
        await scrollToFooter(page);
        const icons = page.locator('nav[aria-label="Réseaux sociaux"] app-icon-link');
        const count = await icons.count();
        if (count === 0) return;

        for (let i = 0; i < count; i++) {
          const box = await icons.nth(i).boundingBox();
          if (box) {
            const ratio = box.width / box.height;
            expect(ratio).toBeGreaterThan(0.7);
            expect(ratio).toBeLessThan(1.3);
          }
        }
      });

      test('la navigation footer est masquée sur mobile', async ({ page }) => {
        await scrollToFooter(page);
        const footerNav = page.locator('nav[aria-label="La structure"]');
        const count = await footerNav.count();
        if (count > 0) {
          // La nav footer desktop a la classe d-none d-md-flex
          // Sur mobile, elle doit être masquée
          await expect(footerNav).not.toBeVisible();
        }
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER STYLE — TABLET (768x1024)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Footer Style — Tablet (768x1024)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('le footer est visible', async ({ page }) => {
    await scrollToFooter(page);
  });

  test('les icônes sociales ne montrent pas de texte parasite', async ({ page }) => {
    await scrollToFooter(page);
    const socialNav = page.locator('nav[aria-label="Réseaux sociaux"]');
    const visibleText = await socialNav.textContent();
    expect(visibleText).not.toContain('nouvel onglet');
  });

  test('les icônes sociales sont circulaires', async ({ page }) => {
    await scrollToFooter(page);
    const icons = page.locator('nav[aria-label="Réseaux sociaux"] app-icon-link');
    const count = await icons.count();

    for (let i = 0; i < count; i++) {
      const box = await icons.nth(i).boundingBox();
      if (box) {
        const ratio = box.width / box.height;
        expect(ratio).toBeGreaterThan(0.7);
        expect(ratio).toBeLessThan(1.3);
      }
    }
  });
});
