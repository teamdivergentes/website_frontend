/**
 * Fixture d'authentification pour les tests E2E
 *
 * Fournit des fixtures Playwright qui gèrent la connexion admin automatiquement.
 * Utiliser `test` de ce module (et non de '@playwright/test') dans les tests
 * qui nécessitent une session authentifiée.
 *
 * Usage :
 *   import { test, expect } from '../../fixtures/auth.fixture';
 *
 *   test('mon test admin', async ({ authenticatedPage }) => {
 *     // authenticatedPage est déjà connecté en tant qu'admin
 *     await authenticatedPage.goto('/admin/games');
 *   });
 *
 *   test('accéder à la page login', async ({ loginPage }) => {
 *     await loginPage.goto();
 *     await loginPage.login('user@example.com', 'password');
 *   });
 */

import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TEST_ADMIN, TIMEOUTS } from './test-data';

/** Types des fixtures personnalisées */
type AuthFixtures = {
  /** Page déjà authentifiée en tant qu'admin */
  authenticatedPage: Page;
  /** Instance de LoginPage prête à l'emploi */
  loginPage: LoginPage;
};

export const test = base.extend<AuthFixtures>({
  /**
   * Fixture `authenticatedPage` :
   * Navigue vers la page de login, se connecte en tant qu'admin
   * et retourne la page après redirection vers /admin.
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_ADMIN.email, TEST_ADMIN.password);
    // Attendre la redirection vers l'admin
    await page.waitForURL(/\/admin/, { timeout: TIMEOUTS.appInit });
    // Passer la page authentifiée au test
    await use(page);
  },

  /**
   * Fixture `loginPage` :
   * Fournit une instance de LoginPage sans effectuer de connexion.
   * Utile pour tester le formulaire de login lui-même.
   */
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

export { expect } from '@playwright/test';
