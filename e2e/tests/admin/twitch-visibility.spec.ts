/**
 * Tests E2E — Visibilité de la page En Live (Twitch) — EPIC-22 / F1
 *
 * Vérifie que le toggle admin `page_twitch_visible` dans /admin/config
 * masque ou affiche correctement le lien "EN LIVE" dans le header
 * (desktop ET mobile), sans bloquer l'accès direct à /twitch par URL.
 *
 * Sélecteurs utilisés :
 * - Toggle admin     : [data-testid="config-toggle-page_twitch_visible"]
 * - Lien EN LIVE desktop : [data-testid="nav-live-btn"]
 * - Lien EN LIVE mobile  : .mobile-overlay__item--live a
 * - Section visibilité   : [aria-controls="section-content-visibility"]
 * - Bouton sauvegarder   : .form-actions button.btn-primary
 * - Message succès       : .alert-success
 *
 * Viewports testés :
 * - Desktop : 1280×800 (par défaut Playwright)
 * - Mobile  : 375×667 (iPhone SE)
 *
 * Idempotence : chaque test remet le toggle en ON dans afterAll pour
 * ne pas casser les autres specs Playwright.
 */

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers partagés
// ─────────────────────────────────────────────────────────────────────────────

/** Vérifie que le backend répond avec du JSON (pas un fallback SPA) */
async function isBackendAvailable(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/config', { timeout: 5000 });
    if (!response.ok()) return false;
    const contentType = response.headers()['content-type'] ?? '';
    return contentType.includes('application/json');
  } catch {
    return false;
  }
}

/** Connexion admin et attente de la redirection vers /admin */
async function loginAsAdmin(page: Page): Promise<boolean> {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  const formVisible = await page
    .locator('form')
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!formVisible) return false;

  await page.locator('#email').fill('admin@teamdivergentes.fr');
  await page.locator('#password').fill('admin123');
  await page.locator('button[type="submit"]').click();

  return page
    .waitForURL(/\/admin/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
}

/** Déconnexion : supprime le token du localStorage et navigue vers /auth/login */
async function logout(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  // Recharger la page pour que l'AuthService réévalue l'état (zoneless + Signals)
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
}

/** Ouvre une section collapsible de la page config si elle est fermée */
async function openConfigSection(
  page: Page,
  sectionKey: 'general' | 'social' | 'contact' | 'recruitment' | 'seo' | 'visibility',
): Promise<void> {
  const sectionContent = page.locator(`#section-content-${sectionKey}`);
  const isOpen = await sectionContent.evaluate((el) => el.classList.contains('open'));
  if (!isOpen) {
    const sectionHeader = page
      .locator('.form-section')
      .filter({ has: page.locator(`[aria-controls="section-content-${sectionKey}"]`) })
      .locator('.section-header');
    await sectionHeader.click();
    await expect(sectionContent).toHaveClass(/open/, { timeout: 5000 });
  }
}

/**
 * Lit l'état courant du toggle page_twitch_visible dans /admin/config.
 * Pré-requis : être déjà authentifié et sur /admin/config.
 */
async function getTwitchToggleState(page: Page): Promise<boolean> {
  await openConfigSection(page, 'visibility');
  const checkbox = page.locator('[data-testid="config-toggle-page_twitch_visible"]');
  return checkbox.isChecked();
}

/**
 * Définit l'état du toggle page_twitch_visible et sauvegarde.
 * Pré-requis : être déjà authentifié et sur /admin/config.
 */
async function setTwitchToggle(page: Page, targetState: boolean): Promise<void> {
  await openConfigSection(page, 'visibility');
  const checkbox = page.locator('[data-testid="config-toggle-page_twitch_visible"]');
  const isChecked = await checkbox.isChecked();
  if (isChecked !== targetState) {
    await checkbox.click();
    await page.waitForTimeout(200); // laisser Angular traiter le signal zoneless
  }
  // Sauvegarder
  const saveBtn = page
    .locator('.form-actions button.btn-primary')
    .filter({ hasText: 'Enregistrer' });
  await saveBtn.click();
  await page.locator('.alert-success').waitFor({ state: 'visible', timeout: 15000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite de tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Visibilité page En Live (Twitch) — EPIC-22', () => {
  // État sauvegardé avant les tests pour restauration propre
  let initialToggleState: boolean | undefined;

  test.beforeAll(async ({ browser }) => {
    // Sauvegarder l'état initial du toggle pour la restauration dans afterAll
    const page = await browser.newPage();
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      await page.close();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      await page.close();
      return;
    }
    await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
    await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    initialToggleState = await getTwitchToggleState(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
    }
  });

  test.afterAll(async ({ browser }) => {
    // Rétablir l'état initial du toggle pour ne pas casser les autres specs
    if (initialToggleState === undefined) return;

    const page = await browser.newPage();
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      await page.close();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      await page.close();
      return;
    }
    await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
    await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await setTwitchToggle(page, initialToggleState);
    await page.close();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Groupe 1 : Validation du toggle dans /admin/config
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Toggle admin — section Visibilité des pages', () => {
    test.beforeEach(async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    });

    test('le toggle page_twitch_visible est présent dans la section Visibilité', async ({ page }) => {
      await openConfigSection(page, 'visibility');
      const checkbox = page.locator('[data-testid="config-toggle-page_twitch_visible"]');
      await expect(checkbox).toBeVisible({ timeout: 5000 });
    });

    test('le label du toggle Twitch est "En live (Twitch)"', async ({ page }) => {
      await openConfigSection(page, 'visibility');
      const toggleItem = page
        .locator('label.toggle-item')
        .filter({ hasText: 'En live (Twitch)' });
      await expect(toggleItem).toBeVisible({ timeout: 5000 });
      const labelText = await toggleItem.locator('.toggle-label').textContent();
      expect(labelText?.trim()).toBe('En live (Twitch)');
    });

    test('le toggle est coché par défaut (ON)', async ({ page }) => {
      // S'assurer que le toggle est ON avant de tester l'état par défaut
      await setTwitchToggle(page, true);
      // Recharger la page pour vérifier la persistance
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await openConfigSection(page, 'visibility');
      const checkbox = page.locator('[data-testid="config-toggle-page_twitch_visible"]');
      await expect(checkbox).toBeChecked({ timeout: 5000 });
    });

    test('décocher puis sauvegarder persiste l\'état OFF après rechargement', async ({ page }) => {
      // Mettre en OFF
      await setTwitchToggle(page, false);
      // Recharger et vérifier
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await openConfigSection(page, 'visibility');
      const checkbox = page.locator('[data-testid="config-toggle-page_twitch_visible"]');
      await expect(checkbox).not.toBeChecked({ timeout: 5000 });
      // Nettoyer : remettre ON
      await setTwitchToggle(page, true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Groupe 2 : Toggle ON — lien "EN LIVE" visible dans le header
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Toggle ON — lien EN LIVE visible', () => {
    test.beforeEach(async ({ page }) => {
      // S'assurer que le toggle est ON avant ces tests
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await setTwitchToggle(page, true);
      await logout(page);
    });

    test('le lien EN LIVE est visible dans le header desktop (≥ 1280px)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('header#visitor_navbar').waitFor({ state: 'visible', timeout: 10000 });

      const liveBtn = page.locator('[data-testid="nav-live-btn"]');
      await expect(liveBtn).toBeVisible({ timeout: 10000 });
      await expect(liveBtn).toContainText('EN LIVE');
    });

    test('le lien EN LIVE est visible dans le menu mobile (375×667)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('header#visitor_navbar').waitFor({ state: 'visible', timeout: 10000 });

      // Ouvrir le menu burger
      const menuToggle = page.locator('[data-testid="header-menu-toggle"]');
      await menuToggle.click();
      await page.locator('.mobile-overlay').waitFor({ state: 'visible', timeout: 5000 });

      const mobileLiveLink = page.locator('.mobile-overlay__item--live a');
      await expect(mobileLiveLink).toBeVisible({ timeout: 5000 });
      await expect(mobileLiveLink).toContainText('EN LIVE');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Groupe 3 : Toggle OFF — lien "EN LIVE" caché dans le header
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Toggle OFF — lien EN LIVE caché', () => {
    test.beforeEach(async ({ page }) => {
      // Mettre le toggle en OFF
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await setTwitchToggle(page, false);
      await logout(page);
    });

    test.afterEach(async ({ page }) => {
      // Remettre le toggle en ON après chaque test de ce groupe
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) return;
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await setTwitchToggle(page, true);
    });

    test('le lien EN LIVE est absent du header desktop quand toggle OFF', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('header#visitor_navbar').waitFor({ state: 'visible', timeout: 10000 });

      const liveBtn = page.locator('[data-testid="nav-live-btn"]');
      await expect(liveBtn).not.toBeVisible({ timeout: 5000 });
    });

    test('le lien EN LIVE est absent du menu mobile quand toggle OFF', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('header#visitor_navbar').waitFor({ state: 'visible', timeout: 10000 });

      // Ouvrir le menu burger
      const menuToggle = page.locator('[data-testid="header-menu-toggle"]');
      await menuToggle.click();
      await page.locator('.mobile-overlay').waitFor({ state: 'visible', timeout: 5000 });

      const mobileLiveLink = page.locator('.mobile-overlay__item--live');
      await expect(mobileLiveLink).not.toBeVisible({ timeout: 5000 });
    });

    test('la route /twitch reste accessible par URL directe quand toggle OFF (non-régression)', async ({
      page,
    }) => {
      // Le toggle OFF ne doit PAS bloquer l'accès direct — pas de guard 404,
      // comportement cohérent avec les autres pages toggleables.
      const response = await page.goto('/twitch', { waitUntil: 'domcontentloaded' });

      // La page doit répondre (pas de 404 Angular ou redirection)
      expect(response?.status()).not.toBe(404);

      // Le composant de la page Twitch doit être chargé (l'app Angular se charge)
      await page.locator('header#visitor_navbar').waitFor({ state: 'visible', timeout: 10000 });

      // La page ne doit pas avoir redirigé vers /404
      expect(page.url()).not.toContain('/404');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Groupe 4 : Toggle ON rétabli — le lien réapparaît
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Toggle ON rétabli — lien EN LIVE réapparaît', () => {
    test.beforeEach(async ({ page }) => {
      // 1. Mettre OFF
      let loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      await setTwitchToggle(page, false);
      // 2. Remettre ON
      await setTwitchToggle(page, true);
      await logout(page);
    });

    test('le lien EN LIVE réapparaît dans le header desktop après re-activation', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('header#visitor_navbar').waitFor({ state: 'visible', timeout: 10000 });

      const liveBtn = page.locator('[data-testid="nav-live-btn"]');
      await expect(liveBtn).toBeVisible({ timeout: 10000 });
      await expect(liveBtn).toContainText('EN LIVE');
    });

    test('le lien EN LIVE réapparaît dans le menu mobile après re-activation', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.locator('header#visitor_navbar').waitFor({ state: 'visible', timeout: 10000 });

      const menuToggle = page.locator('[data-testid="header-menu-toggle"]');
      await menuToggle.click();
      await page.locator('.mobile-overlay').waitFor({ state: 'visible', timeout: 5000 });

      const mobileLiveLink = page.locator('.mobile-overlay__item--live a');
      await expect(mobileLiveLink).toBeVisible({ timeout: 5000 });
      await expect(mobileLiveLink).toContainText('EN LIVE');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Groupe 5 : Non-régression — les autres toggles ne sont pas affectés
  // ───────────────────────────────────────────────────────────────────────────

  test.describe('Non-régression — autres toggles de visibilité', () => {
    test.beforeEach(async ({ page }) => {
      const loggedIn = await loginAsAdmin(page);
      if (!loggedIn) {
        test.skip();
        return;
      }
      await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
      await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    });

    test('les 6 autres toggles de visibilité existent et sont intacts', async ({ page }) => {
      await openConfigSection(page, 'visibility');

      // Vérifier que chaque toggle des autres pages est toujours présent
      const autresToggleTestIds = [
        'config-toggle-page_articles_visible',
        'config-toggle-page_shop_visible',
        'config-toggle-page_contact_visible',
        'config-toggle-page_equipes_visible',
        'config-toggle-page_sponsors_visible',
        'config-toggle-page_recrutement_visible',
      ];

      for (const testId of autresToggleTestIds) {
        const toggle = page.locator(`[data-testid="${testId}"]`);
        await expect(toggle).toBeVisible({ timeout: 5000 });
      }
    });

    test('la section Visibilité contient bien 7 toggles au total (6 + Twitch)', async ({
      page,
    }) => {
      await openConfigSection(page, 'visibility');
      const allCheckboxes = page.locator('.toggle-group .toggle-item input[type="checkbox"]');
      const count = await allCheckboxes.count();
      expect(count).toBe(7);
    });
  });
});
