/**
 * Fixtures d'authentification pour les tests E2E
 *
 * Fournit des fixtures Playwright qui gèrent la connexion automatiquement
 * pour différents rôles utilisateur (admin, CM, gestionnaire).
 *
 * Utiliser `test` de ce module (et non de '@playwright/test') dans les tests
 * qui nécessitent une session authentifiée.
 *
 * Usage :
 *   import { test, expect } from '../../fixtures/auth.fixture';
 *
 *   test('test admin', async ({ authenticatedPage }) => {
 *     await authenticatedPage.goto('/admin/games');
 *   });
 *
 *   test('test CM', async ({ loggedAsCM }) => {
 *     await loggedAsCM.goto('/admin/articles');
 *   });
 *
 *   test('test Gestionnaire', async ({ loggedAsGestionnaire }) => {
 *     await loggedAsGestionnaire.goto('/admin/teams');
 *   });
 *
 *   test('accéder à la page login', async ({ loginPage }) => {
 *     await loginPage.goto();
 *     await loginPage.login('user@example.com', 'password');
 *   });
 *
 * Prérequis :
 *   Les comptes TEST_CM et TEST_GESTIONNAIRE doivent exister en base.
 *   Voir frontend/e2e/fixtures/test-data.ts pour les credentials.
 */

import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { TEST_ADMIN, TEST_CM, TEST_GESTIONNAIRE, TIMEOUTS } from './test-data';

/** Types des fixtures personnalisées */
type AuthFixtures = {
  /** Page déjà authentifiée en tant qu'admin */
  authenticatedPage: Page;
  /**
   * Page déjà authentifiée en tant que Community Manager (CM).
   * Permissions : articles:read, articles:create, articles:update, articles:publish.
   * Prérequis : le compte TEST_CM doit exister en base.
   */
  loggedAsCM: Page;
  /**
   * Page déjà authentifiée en tant que Gestionnaire.
   * Permissions : teams:*, games:*, sponsors:*, staff:*, recrutement:*.
   * Prérequis : le compte TEST_GESTIONNAIRE doit exister en base.
   */
  loggedAsGestionnaire: Page;
  /** Instance de LoginPage prête à l'emploi (sans connexion) */
  loginPage: LoginPage;
};

/**
 * Effectue la connexion UI via le formulaire de login.
 * Attend la redirection vers /admin après succès.
 */
async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await page.waitForURL(/\/admin/, { timeout: TIMEOUTS.appInit });
}

export const test = base.extend<AuthFixtures>({
  /**
   * Fixture `authenticatedPage` :
   * Navigue vers la page de login, se connecte en tant qu'admin
   * et retourne la page après redirection vers /admin.
   */
  authenticatedPage: async ({ page }, use) => {
    await loginViaUI(page, TEST_ADMIN.email, TEST_ADMIN.password);
    await use(page);
  },

  /**
   * Fixture `loggedAsCM` :
   * Navigue vers la page de login, se connecte en tant que Community Manager
   * et retourne la page après redirection vers /admin.
   *
   * Le compte TEST_CM (cm-e2e@teamdivergentes.fr) doit exister en base
   * avec le rôle « CM ». Voir test-data.ts pour les credentials et
   * les instructions de seed.
   */
  loggedAsCM: async ({ page }, use) => {
    await loginViaUI(page, TEST_CM.email, TEST_CM.password);
    await use(page);
  },

  /**
   * Fixture `loggedAsGestionnaire` :
   * Navigue vers la page de login, se connecte en tant que Gestionnaire
   * et retourne la page après redirection vers /admin.
   *
   * Le compte TEST_GESTIONNAIRE (gestionnaire-e2e@teamdivergentes.fr) doit
   * exister en base avec le rôle « Gestionnaire ». Voir test-data.ts pour les
   * credentials et les instructions de seed.
   */
  loggedAsGestionnaire: async ({ page }, use) => {
    await loginViaUI(page, TEST_GESTIONNAIRE.email, TEST_GESTIONNAIRE.password);
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
