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
    // 2xx uniquement : sans proxy /api (cas du serveur statique en CI),
    // un 404 est < 500 mais ne signifie pas que le backend repond. Les tests
    // qui partaient sur cette base finissaient par timeout sur le form login.
    return response.ok();
  } catch {
    return false;
  }
}
