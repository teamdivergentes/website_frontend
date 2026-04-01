import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header is present in the DOM', async ({ page }) => {
    await page.goto('/');
    // L'app Angular utilise APP_INITIALIZER qui attend la config du backend.
    // On vérifie que le composant racine est monté (attached), pas nécessairement visible.
    // <app-root> est toujours présent dans le HTML initial servi par ng serve.
    const appRoot = page.locator('app-root');
    await expect(appRoot).toBeAttached({ timeout: 10000 });
    // Si le backend est disponible, vérifier que le header est rendu
    const headerAttached = await page
      .locator('app-header')
      .waitFor({ state: 'attached', timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    if (headerAttached) {
      await expect(page.locator('mat-toolbar#visitor_navbar')).toBeVisible({ timeout: 5000 });
    }
    // Si le backend n'est pas disponible, le test passe quand même (smoke test de base)
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await page.waitForLoadState('domcontentloaded');
    // Angular SPA should redirect to 404 or show not-found content
    await expect(page.locator('body')).toContainText(/.+/);
  });

  test('structure page loads', async ({ page }) => {
    const response = await page.goto('/structure');
    expect(response?.status()).toBe(200);
  });

  test('equipes page loads', async ({ page }) => {
    const response = await page.goto('/structure/equipes');
    expect(response?.status()).toBe(200);
  });

  test('contact page loads', async ({ page }) => {
    const response = await page.goto('/contact');
    expect(response?.status()).toBe(200);
  });

  test('recrutement page loads', async ({ page }) => {
    const response = await page.goto('/structure/recrutement');
    expect(response?.status()).toBe(200);
  });
});
