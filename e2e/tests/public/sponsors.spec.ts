/**
 * Tests E2E fonctionnels — Sponsors
 *
 * Sélecteurs basés sur sponsors.html :
 * - section.sponsors-page              → conteneur principal
 * - .sponsors-header h1                → titre "NOS SPONSORS"
 * - .sponsors-header .eyebrow          → sous-titre "CEUX QUI NOUS FONT CONFIANCE"
 * - .skeleton-sponsors[role="status"]  → skeleton de chargement
 * - .error-state[role="alert"]         → état d'erreur
 * - .empty-state                       → état vide (aucun partenaire)
 * - .empty-state h2                    → "Aucun partenaire pour le moment"
 * - .sponsors-list                     → liste des sponsors chargés
 * - app-sponsor-card                   → composant carte sponsor
 * - section.join-us                    → section CTA "Devenez partenaire"
 * - .join-us a.join-us-btn             → lien "Devenir partenaire"
 */

import { test, expect } from '@playwright/test';

async function waitForAngularInit(page: import('@playwright/test').Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

async function waitForSponsorsLoaded(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const skeleton = document.querySelector('.skeleton-sponsors[role="status"]');
    const content = document.querySelector(
      '.sponsors-list, .empty-state, .error-state'
    );
    return !skeleton || content !== null;
  }, { timeout: 15000 });
}

test.describe('Page Sponsors — Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la page /structure/sponsors charge correctement', async ({ page }) => {
    await expect(page.locator('section.sponsors-page')).toBeVisible({ timeout: 10000 });
  });

  test('le titre "NOS SPONSORS" est visible', async ({ page }) => {
    await expect(page.locator('.sponsors-header h1')).toContainText('NOS SPONSORS', { timeout: 10000 });
  });

  test('le sous-titre "CEUX QUI NOUS FONT CONFIANCE" est visible', async ({ page }) => {
    await expect(page.locator('.sponsors-header .eyebrow'))
      .toContainText('CEUX QUI NOUS FONT CONFIANCE', { timeout: 10000 });
  });

  test('un état est visible : skeleton, sponsors, état vide ou erreur', async ({ page }) => {
    const anyState = page.locator([
      '.skeleton-sponsors',
      '.sponsors-list',
      '.empty-state',
      '.error-state'
    ].join(', '));
    await expect(anyState.first()).toBeAttached({ timeout: 15000 });
  });
});

test.describe('Page Sponsors — Contenu dynamique', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForSponsorsLoaded(page);
  });

  test('si des sponsors sont chargés : la liste est visible', async ({ page }) => {
    const sponsorsListCount = await page.locator('.sponsors-list').count();
    const emptyStateCount = await page.locator('.empty-state').count();
    const errorStateCount = await page.locator('.error-state').count();

    if (sponsorsListCount > 0) {
      await expect(page.locator('.sponsors-list')).toBeVisible({ timeout: 5000 });
      // Des cartes sponsors doivent être présentes
      const cards = page.locator('app-sponsor-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    } else if (emptyStateCount > 0) {
      await expect(page.locator('.empty-state h2')).toContainText(/[Aa]ucun partenaire/, { timeout: 5000 });
    } else if (errorStateCount > 0) {
      await expect(page.locator('.error-state')).toBeVisible({ timeout: 5000 });
    }
  });

  test('l\'état vide affiche le message et les CTAs appropriés', async ({ page }) => {
    const emptyState = page.locator('.empty-state');
    const count = await emptyState.count();
    if (count > 0) {
      await expect(page.locator('.empty-state h2')).toBeVisible({ timeout: 5000 });

      // CTA "Devenir partenaire" doit mener vers /contact
      const partnerBtn = page.locator('.btn-empty-primary');
      await expect(partnerBtn).toBeVisible({ timeout: 5000 });
      await expect(partnerBtn).toContainText(/[Dd]evenir partenaire/);
    }
  });
});

test.describe('Page Sponsors — Section CTA "Devenez partenaire"', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la section CTA est présente', async ({ page }) => {
    const joinUs = page.locator('section.join-us');
    await joinUs.scrollIntoViewIfNeeded();
    await expect(joinUs).toBeVisible({ timeout: 10000 });
  });

  test('le titre "DEVENEZ PARTENAIRE" est visible dans la section CTA', async ({ page }) => {
    const joinUs = page.locator('section.join-us');
    await joinUs.scrollIntoViewIfNeeded();
    await expect(page.locator('#cta-heading')).toContainText('DEVENEZ PARTENAIRE', { timeout: 5000 });
  });

  test('le bouton "DEVENIR PARTENAIRE" navigue vers /contact', async ({ page }) => {
    const joinUs = page.locator('section.join-us');
    await joinUs.scrollIntoViewIfNeeded();

    const partnerBtn = page.locator('.join-us a.join-us-btn');
    await expect(partnerBtn).toBeVisible({ timeout: 10000 });
    await expect(partnerBtn).toContainText('DEVENIR PARTENAIRE');
    await expect(partnerBtn).toHaveAttribute('aria-label', /[Dd]evenir partenaire/);

    await partnerBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/contact/);
  });

  test('le logo DVG est visible dans la section CTA', async ({ page }) => {
    const joinUs = page.locator('section.join-us');
    await joinUs.scrollIntoViewIfNeeded();

    const logoDvg = page.locator('section.join-us .logo-dvg');
    await expect(logoDvg).toBeVisible({ timeout: 5000 });
    await expect(logoDvg).toHaveAttribute('alt', /Logo Team Divergentes/i);
  });
});

test.describe('Page Sponsors — Navigation depuis l\'état vide', () => {
  test('le CTA "Découvrir la structure" de l\'état vide navigue vers /structure', async ({ page }) => {
    await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForSponsorsLoaded(page);

    const emptyState = page.locator('.empty-state');
    const count = await emptyState.count();
    if (count > 0) {
      const structureBtn = page.locator('.btn-empty-secondary');
      await expect(structureBtn).toBeVisible({ timeout: 5000 });
      await structureBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/structure$/);
    }
  });
});
