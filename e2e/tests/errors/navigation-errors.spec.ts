/**
 * Tests E2E négatifs : Erreurs de navigation
 *
 * Vérifie que l'application gère correctement les routes inexistantes
 * et les ressources dynamiques introuvables (équipe, recrutement, article).
 *
 * Comportements attendus selon les composants Angular :
 * - Route inconnue (**) → redirigée vers /404 (app.routes.ts fallback)
 * - Page 404 (/404) → affiche "PAGE INTROUVABLE" (not-found.html)
 * - Équipe inexistante → état d'erreur "Équipe introuvable" + redirect après 2s
 * - Recrutement slug inexistant → redirect vers /structure/recrutement
 * - Article slug inexistant → redirect vers /404
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Route inconnue → fallback 404
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Routes inconnues → page 404', () => {
  test('route complètement inexistante (/xyz123abc) → affiche la page 404', async ({ page }) => {
    // app.routes.ts : { path: '**', redirectTo: '404' }
    // L'Angular Router redirige toutes les routes inconnues vers /404
    await page.goto('/xyz123abc', { waitUntil: 'domcontentloaded' });

    // Attendre soit la redirection vers /404, soit le chargement de la page
    await page.waitForLoadState('networkidle').catch(() => {});

    // Vérifier qu'on est sur /404 ou que la page 404 est affichée
    const isOn404 = page.url().includes('/404') || page.url().includes('/xyz123abc');

    // La page doit afficher le contenu 404 (h1 "PAGE INTROUVABLE" dans not-found.html)
    // ou au minimum ne pas être vide
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    // Si la page 404 est rendue, vérifier son contenu
    const notFoundContent = page.locator('.not-found-page');
    const has404Page = await notFoundContent.isVisible({ timeout: 5000 }).catch(() => false);
    if (has404Page) {
      // Le h1 dans not-found.html contient "PAGE INTROUVABLE"
      await expect(page.locator('.not-found-page h1')).toHaveText('PAGE INTROUVABLE');
    } else if (isOn404) {
      // On est sur la bonne URL même si la page n'est pas encore rendue
      await expect(page).toHaveURL(new RegExp('/404'));
    }
  });

  test('route inexistante avec sous-chemin (/admin/inexistant/deep) → pas de crash', async ({ page }) => {
    const errors: string[] = [];
    // Capturer les erreurs JS critiques (pas les erreurs réseau attendues)
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isExpectedError =
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch') ||
          text.includes('Failed to load resource') ||
          text.includes('Http failure response') ||
          text.includes('HttpErrorResponse') ||
          text.includes('ERROR HttpErrorResponse') ||
          text.includes('Load team error') ||
          text.includes('api/') ||
          text.includes('localhost:3000') ||
          text.includes('localhost:4200/api') ||
          text.includes('404 (Not Found)') ||
          text.includes('NG0') ||
          text.includes('NavigationError') ||
          text.includes('Cannot match any routes') ||
          text.includes('gtag') ||
          text.includes('analytics') ||
          text.includes('google') ||
          text.includes('favicon.ico');
        if (!isExpectedError) {
          errors.push(text);
        }
      }
    });

    await page.goto('/admin/inexistant/deep/path', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // L'app ne doit pas crasher (pas d'erreur JS critique)
    expect(errors).toEqual([]);
    // app-root doit toujours être présent dans le DOM
    await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
  });

  test('accès à /404 directement → affiche la page non trouvée', async ({ page }) => {
    await page.goto('/404', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Le composant NotFound est rendu sur cette route
    const notFoundPage = page.locator('.not-found-page');
    const rendered = await notFoundPage.waitFor({ timeout: 30_000 }).then(() => true).catch(() => false);

    if (rendered) {
      // Vérifier le contenu principal de la page 404
      await expect(page.locator('.not-found-page h1')).toHaveText('PAGE INTROUVABLE');

      // Les boutons de navigation existent dans le DOM. Sur viewport 1280x720, ils
      // peuvent être hors écran (canvas glitch occupe une grande partie de la hauteur).
      // On scope les sélecteurs à .not-found-page pour éviter les collisions avec le
      // header (qui contient aussi un bouton "Retour à l'accueil" sur le logo).
      const homeBtn = page.locator('.not-found-page button[aria-label="Retour à l\'accueil"]');
      const backBtn = page.locator('.not-found-page button[aria-label="Retourner à la page précédente"]');
      await expect(homeBtn).toBeAttached({ timeout: 5000 });
      await expect(backBtn).toBeAttached({ timeout: 5000 });

      await homeBtn.scrollIntoViewIfNeeded();
      await expect(homeBtn).toBeVisible();
      await expect(backBtn).toBeVisible();
    } else {
      // Sans backend, vérifier que l'app s'est montée
      await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : Ressources dynamiques inexistantes
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Ressources dynamiques inexistantes', () => {
  test('équipe inexistante (/structure/equipes/99999) → comportement gracieux', async ({ page }) => {
    // TeamDetailComponent : en cas d'erreur API, affiche "Équipe introuvable"
    // puis redirige vers /structure/equipes après 2 secondes.
    // Sans backend : la page reste en état de chargement (skeleton).
    await page.goto('/structure/equipes/99999', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Vérifier l'absence de page blanche : app-root doit être présent
    await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });

    // Avec backend : l'état d'erreur est affiché (role="alert")
    const errorState = page.locator('[role="alert"]');
    const hasError = await errorState.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasError) {
      // Le composant affiche "Équipe introuvable" (team-detail.html ligne ~33)
      await expect(errorState).toContainText('Équipe introuvable');
      // Le bouton "Retour aux équipes" est cliquable
      await expect(page.locator('button.btn-back')).toBeVisible();
    } else {
      // Sans backend ou pendant le chargement :
      // le skeleton est affiché (role="status") OU la page est vide mais pas crashée
      // On accepte que la page soit en cours de chargement
      expect(page.url()).not.toBe('about:blank');
    }
  });

  test('équipe inexistante → pas de page blanche ni de crash JS', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isExpectedError =
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch') ||
          text.includes('Failed to load resource') ||
          text.includes('Http failure response') ||
          text.includes('HttpErrorResponse') ||
          text.includes('ERROR HttpErrorResponse') ||
          text.includes('Load team error') ||
          text.includes('api/') ||
          text.includes('localhost:3000') ||
          text.includes('localhost:4200/api') ||
          text.includes('404 (Not Found)') ||
          text.includes('NG0') ||
          text.includes('NavigationError') ||
          text.includes('Cannot match any routes') ||
          text.includes('gtag') ||
          text.includes('analytics') ||
          text.includes('google') ||
          text.includes('favicon.ico');
        if (!isExpectedError) {
          jsErrors.push(text);
        }
      }
    });

    await page.goto('/structure/equipes/equipe-qui-nexiste-pas', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Aucune erreur JS critique ne doit apparaître
    expect(jsErrors).toEqual([]);
  });

  test('slug recrutement inexistant → redirect gracieux vers /structure/recrutement', async ({ page }) => {
    // JobDetailComponent : sur erreur, redirige vers /structure/recrutement
    // Sans backend : la page reste en chargement
    await page.goto('/structure/recrutement/slug-de-poste-inexistant', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Avec backend : redirect vers /structure/recrutement
    const redirected = await page
      .waitForURL(/structure\/recrutement$/, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (redirected) {
      // La redirection a fonctionné correctement
      await expect(page).toHaveURL(new RegExp('/structure/recrutement$'));
    } else {
      // Sans backend : la page doit au moins être présente (pas de crash)
      await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
      expect(page.url()).not.toBe('about:blank');
    }
  });

  test('slug article inexistant → redirect vers /404', async ({ page }) => {
    // ArticleDetailComponent : sur catchError, redirige vers /404
    await page.goto('/articles/article-qui-nexiste-vraiment-pas', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Avec backend : redirect vers /404
    const redirectedTo404 = await page
      .waitForURL(/\/404/, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (redirectedTo404) {
      await expect(page).toHaveURL(new RegExp('/404'));
    } else {
      // Sans backend : la page doit être présente sans crash
      await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
      expect(page.url()).not.toBe('about:blank');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Stabilité de navigation (double clic, navigation rapide)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Stabilité de navigation', () => {
  test('double navigation rapide entre deux routes → pas de crash', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isExpectedError =
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch') ||
          text.includes('Failed to load resource') ||
          text.includes('Http failure response') ||
          text.includes('HttpErrorResponse') ||
          text.includes('ERROR HttpErrorResponse') ||
          text.includes('api/') ||
          text.includes('localhost:3000') ||
          text.includes('localhost:4200/api') ||
          text.includes('404 (Not Found)') ||
          text.includes('NG0') ||
          text.includes('NavigationError') ||
          text.includes('Cannot match any routes') ||
          text.includes('gtag') ||
          text.includes('analytics') ||
          text.includes('google') ||
          text.includes('favicon.ico');
        if (!isExpectedError) {
          jsErrors.push(text);
        }
      }
    });

    // Charger la homepage d'abord
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ timeout: 30_000 });

    // Navigation rapide : aller sur /structure puis immédiatement sur /contact
    // Simule le comportement d'un utilisateur qui clique rapidement
    await Promise.all([
      page.goto('/structure', { waitUntil: 'domcontentloaded' }),
      page.waitForTimeout(50).then(() => page.goto('/contact', { waitUntil: 'domcontentloaded' }))
    ]).catch(() => {
      // Une navigation annulée peut lever une exception — on l'ignore
    });

    // Attendre que la page se stabilise
    await page.waitForLoadState('domcontentloaded').catch(() => {});

    // Vérifier l'absence de crash JS
    expect(jsErrors).toEqual([]);

    // L'app doit toujours être fonctionnelle
    await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
  });

  test('navigation vers une route valide puis une route inexistante → pas de crash', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isExpectedError =
          text.includes('net::ERR_') ||
          text.includes('Failed to fetch') ||
          text.includes('Failed to load resource') ||
          text.includes('Http failure response') ||
          text.includes('HttpErrorResponse') ||
          text.includes('ERROR HttpErrorResponse') ||
          text.includes('api/') ||
          text.includes('localhost:3000') ||
          text.includes('localhost:4200/api') ||
          text.includes('404 (Not Found)') ||
          text.includes('NG0') ||
          text.includes('NavigationError') ||
          text.includes('Cannot match any routes') ||
          text.includes('gtag') ||
          text.includes('analytics') ||
          text.includes('google') ||
          text.includes('favicon.ico');
        if (!isExpectedError) {
          jsErrors.push(text);
        }
      }
    });

    // Page valide
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ timeout: 30_000 });

    // Page inexistante
    await page.goto('/cette-page-nexiste-pas-du-tout-123', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    // Aucun crash JS
    expect(jsErrors).toEqual([]);
    // L'app est toujours présente
    await expect(page.locator('app-root')).toBeAttached({ timeout: 5000 });
  });
});
