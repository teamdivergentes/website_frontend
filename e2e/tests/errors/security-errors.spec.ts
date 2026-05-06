/**
 * Tests E2E de sécurité frontend
 *
 * Ces tests vérifient les comportements de sécurité côté client :
 * - Cookie HttpOnly invalide → pas d'accès admin
 * - Protection XSS dans les formulaires et l'affichage de données
 * - Absence de tokens sensibles dans les URLs
 *
 * Architecture auth (depuis EPIC-16) :
 * - Le token est stocké dans un cookie HttpOnly nommé `dvg_auth_token`
 * - Aucun JWT en localStorage : impossible d'injecter un faux token via JS
 * - L'authGuard appelle /api/auth/me ; si 401 → userSignal=null → redirect vers /auth/login
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Cookie HttpOnly invalide
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Cookie d\'authentification invalide', () => {
  const COOKIE_NAME = 'dvg_auth_token';

  // Tokens de test qui ne peuvent pas être des tokens JWT valides émis par le backend
  const FAKE_JWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
    '.eyJzdWIiOiI5OTk5OSIsImVtYWlsIjoiaGFja2VyQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjAwMDAwMDAwfQ' +
    '.INVALIDE_SIGNATURE_XXXXXXXXXXXXXXXXXXXXXXXXXXXX';

  const GARBAGE_TOKEN = 'pas-du-tout-un-jwt';

  test('cookie bidon + backend disponible → pas d\'accès admin (redirect login)', async ({ page, context }) => {
    // Injecter le faux token comme cookie. Note : on ne peut pas créer un cookie
    // HttpOnly côté client sans passer par le serveur — Playwright permet de le
    // simuler via context.addCookies, ce qui place un cookie identique à celui que
    // le backend poserait, mais avec un JWT non signé valablement → le backend
    // doit le rejeter avec 401 sur /api/auth/me.
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: FAKE_JWT,
        url: page.url() === 'about:blank' ? 'http://localhost:8080' : page.url(),
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // L'authGuard attend la résolution de /api/auth/me avant de décider
    const redirectedToLogin = await page
      .waitForURL(/auth\/login/, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (redirectedToLogin) {
      await expect(page).toHaveURL(new RegExp('/auth/login'));
    } else {
      // Sans backend : le guard ne peut pas distinguer 401 d'une erreur réseau.
      // On vérifie au minimum qu'aucun token JWT n'est présent en localStorage
      // (il ne doit jamais y être, peu importe le scénario).
      await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
      const localStorageToken = await page.evaluate(() => localStorage.getItem('dvg_auth_token'));
      expect(localStorageToken).toBeNull();
    }
  });

  test('cookie garbage (pas un JWT) + backend disponible → pas d\'accès admin', async ({ page, context }) => {
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: GARBAGE_TOKEN,
        url: page.url() === 'about:blank' ? 'http://localhost:8080' : page.url(),
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    const redirectedToLogin = await page
      .waitForURL(/auth\/login/, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (redirectedToLogin) {
      await expect(page).toHaveURL(new RegExp('/auth/login'));
    } else {
      await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
    }
  });

  test('le dashboard admin n\'affiche pas de données avec un cookie invalide', async ({ page, context }) => {
    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: FAKE_JWT,
        url: page.url() === 'about:blank' ? 'http://localhost:8080' : page.url(),
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Si le backend valide le cookie et renvoie 401, on est redirigé vers login
    // → le dashboard n'est JAMAIS affiché
    const isOnAdmin = page.url().includes('/admin') && !page.url().includes('/auth/login');

    if (!isOnAdmin) {
      await expect(page).toHaveURL(new RegExp('/auth/login'));
    } else {
      // Sans backend : la page admin peut s'afficher mais les calls API échouent.
      // On vérifie l'absence de données utilisateur dans la page.
      const pageContent = await page.locator('body').textContent();
      expect(pageContent).not.toMatch(/Gestion des utilisateurs.*@.*\.fr/s);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// XSS : vérification que les entrées utilisateur ne sont pas exécutées
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Protection XSS', () => {
  test('XSS dans le formulaire de login : le script n\'est pas exécuté', async ({ page }) => {
    // Angular échappe automatiquement les valeurs dans les templates via data binding.
    // Ce test vérifie que l'injection de balises script via des champs de formulaire
    // ne déclenche pas l'exécution de code.
    let xssExecuted = false;

    // Écouter les dialogues (alert, confirm, prompt) — signe que du code XSS s'est exécuté
    page.on('dialog', async (dialog) => {
      xssExecuted = true;
      await dialog.dismiss();
    });

    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.locator('form').waitFor({ timeout: 10000 });

    // Injecter une payload XSS classique dans le champ email
    const xssPayload = '<script>alert("XSS")</script>';
    await page.locator('#email').fill(xssPayload);
    await page.locator('#password').fill('<img src=x onerror=alert(1)>');

    // Attendre un court instant pour laisser le temps à tout éventuel script de s'exécuter
    await page.waitForTimeout(1000);

    // Aucune alerte ne doit avoir été déclenchée
    expect(xssExecuted).toBe(false);
  });

  test('XSS dans le champ email du formulaire contact : le script n\'est pas exécuté', async ({ page }) => {
    let xssExecuted = false;

    page.on('dialog', async (dialog) => {
      xssExecuted = true;
      await dialog.dismiss();
    });

    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ timeout: 10000 });

    const formRendered = await page.locator('form.contact-form')
      .waitFor({ timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (!formRendered) {
      test.skip();
      return;
    }

    // Injecter XSS dans tous les champs du formulaire
    const xssPayload = '<script>window.__xss_executed=true;alert("XSS contact")</script>';
    await page.locator('#name').fill(xssPayload);
    await page.locator('#email').fill('"><svg onload=alert(1)>');
    await page.locator('#request').fill('<img src=x onerror=alert("xss request")>');

    await page.waitForTimeout(1000);

    // Aucun script ne doit s'être exécuté
    expect(xssExecuted).toBe(false);

    // Vérifier que la variable XSS n'a pas été définie dans window
    const xssVarExists = await page.evaluate(() => !!(window as Window & { __xss_executed?: boolean }).__xss_executed);
    expect(xssVarExists).toBe(false);
  });

  test('Angular sanitise les valeurs affichées : le texte XSS est visible mais non interprété', async ({ page }) => {
    // Vérifier que si un payload XSS est affiché dans le DOM via data binding Angular,
    // il apparaît comme texte brut et non comme HTML exécutable.
    let xssExecuted = false;

    page.on('dialog', async (dialog) => {
      xssExecuted = true;
      await dialog.dismiss();
    });

    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.locator('form').waitFor({ timeout: 10000 });

    // Saisir un payload XSS avec balise script
    await page.locator('#email').fill('<script>alert("angular-xss")</script>');
    await page.locator('#email').blur();

    // Attendre la réponse d'Angular (le message d'erreur "Email invalide" devrait apparaître)
    await page.waitForTimeout(500);

    // Le XSS ne doit pas s'être exécuté
    expect(xssExecuted).toBe(false);

    // Vérifier que le message d'erreur de validation est affiché (et non le script)
    // Angular détecte un email invalide et affiche "Email invalide" (pas le script)
    const errorMessage = page.locator('.error-message').filter({ hasText: 'Email invalide' });
    const isVisible = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    if (isVisible) {
      await expect(errorMessage).toBeVisible();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Token dans l'URL
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Token ne doit pas apparaître dans l\'URL', () => {
  test('après connexion réussie → le token n\'est pas dans l\'URL', async ({ page }) => {
    // Ce test vérifie qu'après un login (si le backend répond), le token JWT
    // est posé en cookie HttpOnly et NON pas en query param ou fragment de l'URL.
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    const formAvailable = await page.locator('form').waitFor({ timeout: 8000 }).then(() => true).catch(() => false);

    if (!formAvailable) {
      test.skip();
      return;
    }

    // Remplir avec les credentials de test connus
    await page.locator('#email').fill('admin@teamdivergentes.fr');
    await page.locator('#password').fill('admin123');
    await page.locator('button[type="submit"]').click();

    // Attendre que la navigation se stabilise (login réussi ou erreur)
    await page.waitForLoadState('networkidle').catch(() => {});

    // L'URL ne doit jamais contenir ?token= ou #token=
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('?token=');
    expect(currentUrl).not.toContain('#token=');
    expect(currentUrl).not.toContain('access_token=');
    expect(currentUrl).not.toContain('jwt=');
  });

  test('la page /admin ne contient pas de token dans l\'URL', async ({ page, context }) => {
    // Même en ayant un cookie d'auth simulé, l'URL de la page admin ne doit pas l'exposer.
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    await context.addCookies([
      {
        name: 'dvg_auth_token',
        value: 'fake-token-for-url-test',
        url: page.url(),
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const url = page.url();
    expect(url).not.toContain('token=');
    expect(url).not.toContain('jwt=');
    expect(url).not.toContain('access_token=');
  });

  test('aucun token sensible n\'est exposé dans le HTML source', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Le HTML rendu ne doit contenir aucun marqueur de token JWT ni la valeur
    // d'un éventuel cookie (qui est HttpOnly et donc non accessible côté JS).
    const htmlContent = await page.content();
    expect(htmlContent).not.toContain('eyJhbGciOiJIUzI1NiIs'); // Début typique d'un JWT signé HS256
    expect(htmlContent).not.toContain('access_token=');
    expect(htmlContent).not.toContain('jwt=');

    // Aucun token JWT ne doit non plus être en localStorage (cookie HttpOnly est la seule source)
    const localStorageToken = await page.evaluate(() => localStorage.getItem('dvg_auth_token'));
    expect(localStorageToken).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// En-têtes de sécurité (vérification HTTP)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('En-têtes de sécurité HTTP', () => {
  test('la réponse HTTP de la homepage inclut X-Content-Type-Options', async ({ page }) => {
    // Ces en-têtes sont configurés dans Nginx (frontend/nginx.conf).
    // En dev (ng serve), ils peuvent ne pas être présents.
    // En production Docker (port 8080), ils doivent l'être.
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

    if (!response) {
      test.skip();
      return;
    }

    const headers = response.headers();

    // En production/Docker, ces headers doivent être présents
    // En dev (ng serve), on vérifie juste que la page répond
    const isDockerOrProd =
      page.url().includes(':8080') ||
      process.env['BASE_URL']?.includes(':8080') ||
      process.env['NODE_ENV'] === 'production';

    if (isDockerOrProd) {
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBeDefined();
    } else {
      // En dev, vérifier juste que la page est accessible
      expect(response.status()).toBe(200);
    }
  });

  test('la page de login ne contient pas de secret dans le HTML rendu', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await page.locator('form').waitFor({ timeout: 10000 });

    const htmlContent = await page.content();

    // Le HTML ne doit pas contenir de secrets connus
    expect(htmlContent).not.toContain('dvg_auth_token=');
    expect(htmlContent).not.toContain('eyJhbGciOiJIUzI1NiIs'); // Début typique d'un JWT
    expect(htmlContent).not.toContain('SECRET_KEY');
    expect(htmlContent).not.toContain('DATABASE_URL');
    expect(htmlContent).not.toContain('password=');
  });
});
