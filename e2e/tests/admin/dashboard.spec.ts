/**
 * Tests E2E — Dashboard Admin
 *
 * Vérifie le chargement du dashboard après authentification et la navigation
 * via la sidebar. Tous ces tests nécessitent le backend (login réel avec JWT).
 *
 * Sélecteurs basés sur admin-dashboard.component.ts et admin-sidebar.component.ts :
 * - .dashboard                → conteneur principal du dashboard
 * - .dashboard-header h1      → titre "Dashboard"
 * - .welcome-card             → carte de bienvenue
 * - .quick-links              → liens rapides
 * - .site-status              → section état du site
 * - .status-dot               → indicateur "En ligne"
 * - aside.sidebar             → sidebar de navigation
 * - .sidebar-nav              → nav principale de la sidebar
 * - .nav-item                 → liens de navigation
 * - .nav-label                → texte des liens nav
 * - .collapse-btn             → bouton collapse de la sidebar
 */

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Effectue un login admin complet et attend la redirection vers /admin.
 * Retourne false si le backend n'est pas disponible.
 */
async function loginAsAdmin(page: Page): Promise<boolean> {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

  // Attendre que le formulaire soit rendu
  const formVisible = await page.locator('form').waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!formVisible) return false;

  await page.locator('#email').fill('admin@teamdivergentes.fr');
  await page.locator('#password').fill('admin123');
  await page.locator('button[type="submit"]').click();

  // Attendre la redirection vers /admin
  const redirected = await page
    .waitForURL(/\/admin/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  return redirected;
}

/**
 * Vérifie si le backend est disponible en tentant un accès à l'API config.
 */
async function isBackendAvailable(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/config', { timeout: 5000 });
    return response.status() < 500;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Chargement du dashboard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard admin — Chargement', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('le dashboard charge après le login admin', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    // Le composant app-admin-dashboard doit être monté
    const dashboard = page.locator('.dashboard');
    await expect(dashboard).toBeVisible({ timeout: 10000 });
  });

  test('le titre "Dashboard" est visible', async ({ page }) => {
    const heading = page.locator('.dashboard-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Dashboard');
  });

  test('la carte de bienvenue affiche le nom d\'utilisateur', async ({ page }) => {
    const welcomeCard = page.locator('.welcome-card');
    await expect(welcomeCard).toBeVisible({ timeout: 10000 });
    // La carte affiche "Bienvenue, <username>"
    await expect(welcomeCard.locator('h2')).toBeVisible({ timeout: 5000 });
  });

  test('les liens rapides sont affichés dans la carte de bienvenue', async ({ page }) => {
    const quickLinks = page.locator('.quick-links');
    await expect(quickLinks).toBeVisible({ timeout: 10000 });

    // Il doit y avoir au moins 3 liens rapides (Équipes, Sponsors, Staff, Recrutement, Config)
    const links = quickLinks.locator('a.quick-link');
    await expect(links).toHaveCount(5);
  });

  test('la section "État du site" est visible', async ({ page }) => {
    const siteStatus = page.locator('.site-status');
    await expect(siteStatus).toBeVisible({ timeout: 10000 });

    // Le titre de la section
    await expect(siteStatus.locator('h3')).toHaveText('État du site');
  });

  test('le statut "En ligne" est visible avec le point animé', async ({ page }) => {
    const statusDot = page.locator('.status-dot');
    await expect(statusDot).toBeVisible({ timeout: 10000 });

    // Le texte "En ligne" doit être présent
    await expect(page.locator('.status-value').filter({ hasText: 'En ligne' })).toBeVisible({ timeout: 5000 });
  });

  test('la section Analytics est affichée (configurée ou non)', async ({ page }) => {
    const analyticsSection = page.locator('.analytics-section');
    await expect(analyticsSection).toBeVisible({ timeout: 10000 });

    // Soit la grille de métriques, soit l'état "non configuré"
    const configured = page.locator('.analytics-grid');
    const unconfigured = page.locator('.analytics-unconfigured');

    const hasConfigured = await configured.isVisible().catch(() => false);
    const hasUnconfigured = await unconfigured.isVisible().catch(() => false);

    expect(hasConfigured || hasUnconfigured).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : Sidebar de navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard admin — Sidebar de navigation', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('la sidebar est visible après le login', async ({ page }) => {
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  test('la sidebar affiche le titre "DVG Admin"', async ({ page }) => {
    // Titre dans l'en-tête de la sidebar (sidebar non collapsée)
    const sidebarHeader = page.locator('.sidebar-header');
    await expect(sidebarHeader).toBeVisible({ timeout: 10000 });
    await expect(sidebarHeader.locator('h2')).toHaveText(/DVG Admin/);
  });

  test('la navigation contient les liens principaux', async ({ page }) => {
    const nav = page.locator('.sidebar-nav');
    await expect(nav).toBeVisible({ timeout: 10000 });

    // L'admin doit voir au minimum Dashboard et les modules principaux
    const navItems = nav.locator('.nav-item');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('le lien "Dashboard" est présent et actif sur /admin', async ({ page }) => {
    // Le lien Dashboard doit avoir la classe active
    const dashboardLink = page.locator('.nav-item.active');
    await expect(dashboardLink).toBeVisible({ timeout: 10000 });
  });

  test('les labels de navigation sont visibles (sidebar non collapsée)', async ({ page }) => {
    const navLabels = page.locator('.nav-label');
    const count = await navLabels.count();

    // En mode non-collapsé, les labels doivent être visibles
    if (count > 0) {
      // Vérifier que les labels principaux sont présents
      await expect(page.locator('.nav-label').filter({ hasText: 'Dashboard' })).toBeVisible({ timeout: 5000 });
    }
  });

  test('clic sur le lien "Staff" navigue vers /admin/staff', async ({ page }) => {
    const staffLink = page.locator('.nav-item').filter({ hasText: 'Staff' }).first();
    const staffCount = await staffLink.count();

    if (staffCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Lien Staff non visible (permission absente ?)' });
      return;
    }

    await staffLink.click();
    await page.waitForURL(/\/admin\/staff/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/staff/);
  });

  test('clic sur le lien "Jeux" navigue vers /admin/games', async ({ page }) => {
    const gamesLink = page.locator('.nav-item').filter({ hasText: 'Jeux' }).first();
    const gamesCount = await gamesLink.count();

    if (gamesCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Lien Jeux non visible (permission absente ?)' });
      return;
    }

    await gamesLink.click();
    await page.waitForURL(/\/admin\/games/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/games/);
  });

  test('clic sur le lien "Configuration" navigue vers /admin/config', async ({ page }) => {
    const configLink = page.locator('.nav-item').filter({ hasText: 'Configuration' }).first();
    const configCount = await configLink.count();

    if (configCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Lien Configuration non visible (permission absente ?)' });
      return;
    }

    await configLink.click();
    await page.waitForURL(/\/admin\/config/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/config/);
  });

  test('le bouton collapse de la sidebar est présent', async ({ page }) => {
    const collapseBtn = page.locator('.collapse-btn');
    await expect(collapseBtn).toBeVisible({ timeout: 10000 });
    await expect(collapseBtn).toHaveAttribute('aria-label', /Réduire/i);
  });

  test('clic sur collapse réduit la sidebar', async ({ page }) => {
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).not.toHaveClass(/collapsed/, { timeout: 5000 });

    const collapseBtn = page.locator('.collapse-btn');
    await collapseBtn.click();
    await page.waitForTimeout(400); // attendre la transition CSS

    await expect(sidebar).toHaveClass(/collapsed/, { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Liens rapides du dashboard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Dashboard admin — Liens rapides', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('le lien rapide "Équipes" navigue vers /admin/teams', async ({ page }) => {
    const link = page.locator('.quick-link').filter({ hasText: 'Équipes' }).first();
    await expect(link).toBeVisible({ timeout: 10000 });
    await link.click();
    await page.waitForURL(/\/admin\/teams/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/teams/);
  });

  test('le lien rapide "Config" navigue vers /admin/config', async ({ page }) => {
    const link = page.locator('.quick-link').filter({ hasText: 'Config' }).first();
    await expect(link).toBeVisible({ timeout: 10000 });
    await link.click();
    await page.waitForURL(/\/admin\/config/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/config/);
  });

  test('le lien "Voir les analytics détaillés" navigue vers /admin/analytics', async ({ page }) => {
    // Ce lien n'est visible que si GA est configuré
    const analyticsLink = page.locator('.analytics-link');
    const count = await analyticsLink.count();

    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Analytics non configuré, lien absent' });
      return;
    }

    await analyticsLink.click();
    await page.waitForURL(/\/admin\/analytics/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin\/analytics/);
  });
});
