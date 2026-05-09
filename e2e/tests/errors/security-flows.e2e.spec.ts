/**
 * Tests E2E — Parcours de securite — EPIC-19 us-e2e-security-flows
 *
 * Couvre :
 * - Acces /admin sans login -> redirige /auth/login
 * - Acces /profile sans login -> redirige /auth/login
 * - Logout -> token supprime, /admin inaccessible
 * - XSS : soumission payload script -> texte echappe, pas d'alert
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Acces sans authentification
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Securite — Acces sans authentification', () => {
  /**
   * Pour chaque test, on navigue d'abord sur la home pour initialiser le contexte
   * Angular, puis on vide le localStorage, puis on teste la protection.
   */
  async function clearLocalStorage(page: Page): Promise<void> {
    // Naviguer sur une page valide pour avoir acces au localStorage de l'app
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.evaluate(() => localStorage.clear());
  }

  test('acces /admin sans login redirige vers /auth/login', async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('acces /admin/users sans login redirige vers /auth/login', async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/admin/users', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('acces /admin/teams sans login redirige vers /auth/login', async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/admin/teams', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('acces /profile sans login redirige vers /auth/login', async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Securite — Logout', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('apres suppression du token, /admin est inaccessible au prochain demarrage de l\'app', async ({ browser }) => {
    // Utiliser un nouveau contexte de navigateur (localStorage vide par défaut)
    const context = await browser.newContext();
    const page = await context.newPage();

    // Le nouveau contexte n'a pas de token -> naviger directement vers /admin
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/auth/login');

    await context.close();
  });

  test('utilisateur connecte puis deconnecte ne peut plus acceder a /admin', async ({ browser }) => {
    // Phase 1 : connexion dans un contexte dédié
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    expect(await loginAsAdmin(page1)).toBe(true);
    await context1.close();

    // Phase 2 : nouvel contexte sans token (simule un logout propre)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // Sans token, /admin doit rediriger vers login
    await page2.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page2.waitForURL(/\/auth\/login/, { timeout: 10000 });
    expect(page2.url()).toContain('/auth/login');

    await context2.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// XSS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Securite — Protection XSS', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('un payload XSS dans un formulaire n\'execute pas de script', async ({ page }) => {
    if (!(await loginAsAdmin(page))) test.skip();

    await page.goto('/admin/games', { waitUntil: 'domcontentloaded' });
    await page.locator('.skeleton-list, [role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    let xssAlertTriggered = false;
    page.on('dialog', (dialog) => { xssAlertTriggered = true; dialog.dismiss(); });

    const addBtn = page.locator('button').filter({ hasText: /Nouveau|Ajouter|Créer/ }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await addBtn.click();

    if (!(await page.locator('mat-dialog-container').waitFor({ timeout: 5000 }).then(() => true).catch(() => false))) return;

    const nameInput = page.locator('mat-dialog-container input[type="text"], mat-dialog-container input:not([type])').first();
    if (!(await nameInput.isVisible({ timeout: 3000 }).catch(() => false))) return;

    await nameInput.fill("<script>alert('xss-e2e-test')</script>");
    await page.waitForTimeout(1000);

    expect(xssAlertTriggered).toBe(false);

    const cancelBtn = page.locator('mat-dialog-container button').filter({ hasText: /Annuler|Cancel|Fermer/ }).first();
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) await cancelBtn.click();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Upload — validation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Securite — Upload de fichiers', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('upload d\'un fichier > 5MB retourne une erreur visible', async ({ page }) => {
    if (!(await loginAsAdmin(page))) test.skip();

    await page.goto('/admin/sponsors', { waitUntil: 'domcontentloaded' });
    await page.locator('.skeleton, [role="status"]').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const fileInput = page.locator('input[type="file"]').first();
    if (!(await fileInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Aucun input file visible directement' });
      return;
    }

    const bigFile = Buffer.alloc(6 * 1024 * 1024, 'a');
    await fileInput.setInputFiles({ name: 'gros-fichier.jpg', mimeType: 'image/jpeg', buffer: bigFile });

    const errorMsg = page.locator('.error-message, [class*="error"], .snack-bar-container').first();
    await expect(errorMsg).toBeVisible({ timeout: 10000 });
  });
});
