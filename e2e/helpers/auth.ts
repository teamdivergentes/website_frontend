import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page): Promise<boolean> {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  const formVisible = await page.locator('form').waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!formVisible) return false;

  await page.locator('#email').fill('admin@teamdivergentes.fr');
  await page.locator('#password').fill('admin123');
  await page.locator('button[type="submit"]').click();

  return page
    .waitForURL(/\/admin/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
}

export async function isBackendAvailable(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/config', { timeout: 5000 });
    if (!response.ok()) return false;
    // Avec un serveur statique + fallback SPA (cas CI sans proxy /api),
    // toute URL inconnue renvoie 200 + index.html (text/html). On verifie
    // donc que le content-type est bien JSON pour distinguer un vrai
    // backend d'un fallback SPA.
    const contentType = response.headers()['content-type'] ?? '';
    return contentType.includes('application/json');
  } catch {
    return false;
  }
}
