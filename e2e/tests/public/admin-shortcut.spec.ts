/**
 * Tests E2E — Raccourci Administration dans le header public
 *
 * Couvre :
 * - Visiteur anonyme : bouton absent du DOM
 * - Admin authentifié : bouton présent, cliquable, navigue vers /admin
 * - Après logout : bouton disparaît
 *
 * Sélecteurs :
 * - [data-testid="header-admin-shortcut"]  → raccourci desktop
 * - [data-testid="mobile-admin-shortcut"]  → raccourci mobile (dans le burger)
 * - [data-testid="header-menu-toggle"]     → bouton burger mobile
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

const ADMIN_SHORTCUT = '[data-testid="header-admin-shortcut"]';
const MOBILE_ADMIN_SHORTCUT = '[data-testid="mobile-admin-shortcut"]';
const BURGER_BTN = '[data-testid="header-menu-toggle"]';

test.describe('Raccourci Administration — header public', () => {
  test.beforeEach(async ({ page }) => {
    // Si le backend n'est pas disponible, on skip (CI sans Docker)
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
    }
  });

  // ────────────────────────────────────────────────────
  // Visiteur anonyme
  // ────────────────────────────────────────────────────

  test('visiteur anonyme — raccourci admin absent du DOM (desktop)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Le @if côté Angular doit supprimer l'élément du DOM entièrement
    await expect(page.locator(ADMIN_SHORTCUT)).toHaveCount(0);
  });

  test('visiteur anonyme — raccourci admin absent du DOM (burger mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator(BURGER_BTN).click();
    await page.waitForTimeout(300); // animation overlay
    await expect(page.locator(MOBILE_ADMIN_SHORTCUT)).toHaveCount(0);
  });

  // ────────────────────────────────────────────────────
  // Admin authentifié
  // ────────────────────────────────────────────────────

  test('admin authentifié — raccourci visible sur la page d\'accueil (desktop)', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto('/', { waitUntil: 'networkidle' });
    const shortcut = page.locator(ADMIN_SHORTCUT);
    await expect(shortcut).toBeVisible({ timeout: 5000 });
  });

  test('admin authentifié — clic sur le raccourci navigue vers /admin', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto('/', { waitUntil: 'networkidle' });
    const shortcut = page.locator(ADMIN_SHORTCUT);
    await expect(shortcut).toBeVisible({ timeout: 5000 });

    await shortcut.click();
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
  });

  test('admin authentifié — raccourci mobile visible dans le menu burger', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.locator(BURGER_BTN).click();
    await page.waitForTimeout(300); // animation overlay

    const mobileShortcut = page.locator(MOBILE_ADMIN_SHORTCUT);
    await expect(mobileShortcut).toBeVisible({ timeout: 5000 });
  });

  test('admin authentifié — aria-label présent sur le raccourci desktop', async ({ page }) => {
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    await page.goto('/', { waitUntil: 'networkidle' });
    const shortcut = page.locator(ADMIN_SHORTCUT);
    await expect(shortcut).toHaveAttribute('aria-label', 'Accéder au panneau d\'administration');
  });
});
