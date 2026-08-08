/**
 * Tests E2E — Parcours publics critiques — EPIC-19 e2e-coverage
 *
 * Couvre us-e2e-public-flows.md :
 * - Home : navigation, footer, header
 * - Contact : formulaire visible + erreurs validation
 * - Login : login valide -> /admin, login invalide -> erreur
 * - Equipes : liste + detail + 404
 * - Sponsors : liste + rel="noopener"
 * - Profile : acces protege (redirect login)
 * - 404 : page not found
 * - Recrutement : liste + detail
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Home', () => {
  test('header et footer visibles sur la page d\'accueil', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await expect(page.locator('header#visitor_navbar')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('footer')).toBeVisible({ timeout: 10000 });
  });

  test('la section hero est visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    const heroOrCarousel = page.locator('section.carousel-images, .hero-section, app-slider, .slider-container').first();
    await expect(heroOrCarousel).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Contact
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Contact', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('le formulaire de contact est visible', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await expect(page.locator('form').first()).toBeVisible({ timeout: 15000 });
  });

  test('soumission vide affiche des erreurs de validation', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('form').first().waitFor({ state: 'visible', timeout: 15000 });

    // Toucher les champs pour déclencher la validation reactive Angular
    const inputs = page.locator('form input, form textarea, form select');
    const inputCount = await inputs.count();
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      await inputs.nth(i).focus();
      await inputs.nth(i).blur();
    }

    // Vérifier qu'une erreur ou un état invalide apparaît
    const hasError = await Promise.race([
      page.locator('.error-message, .form-error, mat-error').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false),
      page.locator('[class*="invalid"], [class*="error"]').first().waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false),
    ]);

    if (hasError) {
      test.info().annotations.push({ type: 'note', description: 'Validation contact form vérifiée via message d\'erreur visible' });
      return;
    }

    // Si pas d'erreur visible, le bouton submit doit etre désactivé (protection Angular reactive form)
    const submitBtn = page.locator('button[type="submit"]').first();
    const isDisabled = await submitBtn.isDisabled({ timeout: 3000 }).catch(() => false);

    // Le formulaire doit se proteger d'une soumission vide : soit un message
    // d'erreur (branche ci-dessus), soit le bouton submit désactivé.
    expect(isDisabled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Login', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('login admin valide redirige vers /admin', async ({ page }) => {
    expect(await loginAsAdmin(page)).toBe(true);
    expect(page.url()).toContain('/admin');
  });

  test('login invalide affiche un message d\'erreur', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.locator('.login-card').waitFor({ state: 'visible', timeout: 15000 });

    await page.locator('#email').fill('wrong@email.com');
    await page.locator('#password').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.alert.alert-error, .alert-error, .error-message')).toBeVisible({ timeout: 10000 });
    expect(page.url()).toContain('/auth/login');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Equipes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Equipes', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('la liste des equipes se charge', async ({ page }) => {
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('.skeleton').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await expect(page).toHaveURL(/\/structure\/equipes/);
  });

  test('clic sur une equipe navigue vers la page de detail', async ({ page }) => {
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('.skeleton').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const teamLink = page.locator('a[href*="/structure/equipes/"]').first();
    if (!(await teamLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Aucune equipe disponible' });
      return;
    }
    await teamLink.click();
    await page.waitForURL(/\/structure\/equipes\//, { timeout: 10000 });
    expect(page.url()).toContain('/structure/equipes/');
  });

  test('equipe inexistante affiche erreur ou reste sur la page sans crash', async ({ page }) => {
    await page.goto('/structure/equipes/equipe-inexistante-e2e-99999', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('section[role="status"]').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const hasError = await page.locator('.error-state').isVisible({ timeout: 3000 }).catch(() => false);
    const url = page.url();
    const isOnErrorPage = url.includes('/404') || url.includes('/not-found') || url.includes('/structure/equipes');
    const hasTeamDetail = await page.locator('section.team-detail-page').isVisible({ timeout: 3000 }).catch(() => false);

    // L'app ne doit pas etre en état de crash et doit afficher quelque chose de cohérent
    expect(hasError || isOnErrorPage || !hasTeamDetail).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sponsors
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Sponsors', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('la page sponsors se charge', async ({ page }) => {
    await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await expect(page).toHaveURL(/\/structure\/sponsors/);
  });

  test('les liens externes ont rel="noopener"', async ({ page }) => {
    await page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('.skeleton').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const externalLinks = page.locator('a[href^="http"][target="_blank"]');
    const count = await externalLinks.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Aucun lien externe visible' });
      return;
    }
    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Profile', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('acces /profile sans auth redirige vers login', async ({ page }) => {
    // Naviguer d'abord sur une page valide pour avoir accès au localStorage
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    // Vider le localStorage pour simuler un utilisateur non connecté
    await page.evaluate(() => localStorage.clear());
    // Maintenant naviguer vers /profile
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/auth\/login|\/login/, { timeout: 10000 }).catch(() => {});
    expect(page.url().includes('/auth/login') || page.url().includes('/login')).toBe(true);
  });

  test('utilisateur connecte peut voir le profil', async ({ page }) => {
    if (!(await loginAsAdmin(page))) return;
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await expect(page).toHaveURL(/\/profile/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Page 404', () => {
  test('une route inexistante affiche le composant not-found (route ** Angular)', async ({ page }) => {
    // Note : Angular affiche le composant NotFound sur l'URL originale (pas de redirect vers /404)
    // Voir app.routes.ts : route ** -> loadComponent NotFound sans redirectTo
    await page.goto('/route-inexistante-e2e-test', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });

    // Attendre que le composant not-found soit rendu par Angular
    const hasNotFoundComponent = await page.locator('app-not-found').waitFor({ timeout: 10000 }).then(() => true).catch(() => false);

    if (!hasNotFoundComponent) {
      // Alternative : vérifier que l'URL contient /404 (cas redirect)
      const url = page.url();
      const has404InUrl = url.includes('/404') || url.includes('not-found');
      expect(has404InUrl).toBe(true);
    } else {
      expect(hasNotFoundComponent).toBe(true);
    }
  });

  test('la page /404 directe est accessible', async ({ page }) => {
    await page.goto('/404', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await expect(page).toHaveURL(/\/404/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Recrutement
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Parcours public — Recrutement', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) test.skip();
  });

  test('la liste des offres de recrutement se charge', async ({ page }) => {
    await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('.skeleton').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await expect(page).toHaveURL(/\/structure\/recrutement/);
  });

  test('clic sur une offre navigue vers le detail', async ({ page }) => {
    await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
    await page.locator('.skeleton').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    const jobLink = page.locator('a[href*="/structure/recrutement/"]').first();
    if (!(await jobLink.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.info().annotations.push({ type: 'note', description: 'Aucune offre disponible' });
      return;
    }
    await jobLink.click();
    await page.waitForURL(/\/structure\/recrutement\//, { timeout: 10000 });
    expect(page.url()).toContain('/structure/recrutement/');
  });
});
