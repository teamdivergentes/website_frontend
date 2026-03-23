import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('homepage has a title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/./);
  });

  test('no critical console errors on homepage', async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignorer les erreurs réseau attendues (API backend non disponible en CI)
        const isNetworkError =
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch') ||
          text.includes('Http failure response') ||
          text.includes('HttpErrorResponse') ||
          text.includes('ERROR HttpErrorResponse') ||
          text.includes('api/') ||
          text.includes('localhost:3000');
        if (!isNetworkError) {
          criticalErrors.push(text);
        }
      }
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(criticalErrors).toEqual([]);
  });
});
