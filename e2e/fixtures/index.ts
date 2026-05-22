/**
 * Point d'entrée unique des fixtures E2E
 *
 * Combine les fixtures d'authentification (auth.fixture.ts) et de données
 * (data.fixture.ts) en un seul export. Les specs doivent importer `test`
 * et `expect` depuis ce fichier.
 *
 * Usage :
 *   import { test, expect } from '../../fixtures';
 *
 *   test('test avec session admin et données', async ({ authenticatedPage, testData }) => {
 *     const team = await testData.createTeam('mon-equipe');
 *     await authenticatedPage.goto('/admin/teams');
 *   });
 *
 *   test('test avec session CM', async ({ loggedAsCM, testData }) => {
 *     const article = await testData.createArticle('mon-article');
 *     await loggedAsCM.goto('/admin/articles');
 *   });
 *
 *   test('test avec session Gestionnaire', async ({ loggedAsGestionnaire }) => {
 *     await loggedAsGestionnaire.goto('/admin/teams');
 *   });
 *
 *   test('test page de login', async ({ loginPage }) => {
 *     await loginPage.goto();
 *     await loginPage.login('user@example.com', 'password');
 *   });
 */

import { mergeTests, expect as baseExpect } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as dataTest } from './data.fixture';

/**
 * Instance `test` combinée exposant toutes les fixtures :
 * - authenticatedPage  (admin pré-logué)
 * - loggedAsCM         (CM pré-logué)
 * - loggedAsGestionnaire (Gestionnaire pré-logué)
 * - loginPage          (formulaire de login)
 * - testData           (helpers API + cleanup auto)
 */
export const test = mergeTests(authTest, dataTest);

export const expect = baseExpect;
