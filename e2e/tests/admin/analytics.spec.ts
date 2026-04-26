/**
 * Tests E2E — Page admin Analytics (lecture seule)
 *
 * Vérifie l'affichage du dashboard Analytics après authentification.
 * La page est en lecture seule : consultation des métriques GA4, graphiques
 * et filtres de période. Deux états possibles selon la configuration du backend :
 *   - État "non configuré" (503) : message explicatif visible
 *   - État "configuré" (données) : KPI cards, graphiques, tableaux affichés
 *
 * Sélecteurs basés sur analytics-dashboard.component.html et ses sous-composants :
 * - .analytics-page              → conteneur principal
 * - .page-header                 → en-tête avec titre et sélecteur de période
 * - .page-header h1              → titre "Analytics"
 * - .page-header .page-subtitle  → sous-titre "Données Google Analytics"
 * - .loading-grid[role="status"] → skeleton de chargement (6 cartes)
 * - .skeleton-card               → carte skeleton individuelle
 * - .skeleton-chart              → skeleton du graphique
 * - .not-configured-state        → état GA non configuré (erreur 503)
 * - .error-state                 → état erreur générique
 * - .kpi-grid                    → grille des 6 KPI cards (aria-label "Métriques clés")
 * - .kpi-card                    → carte KPI individuelle
 * - .kpi-title                   → libellé de la métrique
 * - .kpi-value                   → valeur formatée de la métrique
 * - .kpi-change                  → variation vs période précédente
 * - .row-chart-realtime          → ligne graphique visiteurs + temps réel
 * - .col-chart                   → colonne du graphique visiteurs
 * - .col-realtime                → colonne du compteur temps réel
 * - .chart-card                  → carte graphique Chart.js
 * - .chart-title                 → titre du graphique ("Évolution des visiteurs")
 * - canvas[baseChart]            → canvas Chart.js (via [type]="line")
 * - .realtime-card               → carte compteur temps réel
 * - .realtime-badge              → badge "En direct"
 * - .badge-label                 → texte "En direct"
 * - .row-full                    → ligne tableau top pages
 * - .table-card                  → carte tableau top pages
 * - .table-title                 → titre "Top pages"
 * - .pages-table                 → tableau des pages
 * - .row-three-cols              → ligne sources / appareils / géo
 *
 * Date range picker (app-date-range-picker) :
 * - .date-range-picker           → conteneur du sélecteur
 * - mat-button-toggle-group      → groupe de boutons preset (aria-label "Période d'analyse")
 * - mat-button-toggle            → bouton de preset individuel
 * - .custom-range                → champs de date personnalisés (visible si preset "Personnalisé")
 * - button[mat-flat-button]      → bouton "Appliquer" (plage personnalisée)
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Navigue vers /admin/analytics et attend que le contenu soit prêt
 * (fin du skeleton ou affichage de l'état non configuré ou de l'erreur).
 * Retourne true dès qu'un état final est détecté.
 */
async function navigateToAnalytics(page: Page): Promise<boolean> {
  await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded' });

  // Attendre la fin du skeleton (disparition) ou l'apparition d'un état final
  const loaded = await Promise.race([
    page
      .locator('.kpi-grid')
      .waitFor({ timeout: 20000 })
      .then(() => true)
      .catch(() => false),
    page
      .locator('.not-configured-state')
      .waitFor({ timeout: 20000 })
      .then(() => true)
      .catch(() => false),
    page
      .locator('.error-state')
      .waitFor({ timeout: 20000 })
      .then(() => true)
      .catch(() => false),
  ]);

  return loaded;
}

/**
 * Détermine si GA est configuré sur le backend en interrogeant l'endpoint analytics.
 * Retourne true si les données sont disponibles (200), false si 503 (non configuré).
 */
async function isGaConfigured(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/analytics/overview', { timeout: 8000 });
    return response.status() !== 503;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Chargement de la page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Analytics admin — Affichage', () => {
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

  test('la page analytics charge après le login', async ({ page }) => {
    const loaded = await navigateToAnalytics(page);
    expect(loaded).toBe(true);

    await expect(page).toHaveURL(/\/admin\/analytics/);
  });

  test('le titre "Analytics" est visible', async ({ page }) => {
    await navigateToAnalytics(page);

    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Analytics');
  });

  test('le sous-titre "Données Google Analytics" est visible', async ({ page }) => {
    await navigateToAnalytics(page);

    const subtitle = page.locator('.page-header .page-subtitle');
    await expect(subtitle).toBeVisible({ timeout: 10000 });
    await expect(subtitle).toHaveText('Données Google Analytics');
  });

  test('le sélecteur de période est présent dans le header', async ({ page }) => {
    await navigateToAnalytics(page);

    const picker = page.locator('.page-header .date-range-picker');
    await expect(picker).toBeVisible({ timeout: 10000 });
  });

  test('la page affiche soit les données GA, soit l\'état non configuré, soit une erreur', async ({ page }) => {
    await navigateToAnalytics(page);

    const hasData = await page.locator('.kpi-grid').isVisible().catch(() => false);
    const hasNotConfigured = await page.locator('.not-configured-state').isVisible().catch(() => false);
    const hasError = await page.locator('.error-state').isVisible().catch(() => false);

    expect(hasData || hasNotConfigured || hasError).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : État "GA non configuré"
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Analytics admin — État non configuré', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    const gaConfigured = await isGaConfigured(page);
    if (gaConfigured) {
      // GA est configuré, ces tests ne s'appliquent pas
      test.skip();
    }
  });

  test('le message "Google Analytics non configuré" est visible', async ({ page }) => {
    await navigateToAnalytics(page);

    const notConfiguredState = page.locator('.not-configured-state');
    await expect(notConfiguredState).toBeVisible({ timeout: 15000 });

    const heading = notConfiguredState.locator('h2');
    await expect(heading).toHaveText('Google Analytics non configuré');
  });

  test('le message d\'état contient une explication', async ({ page }) => {
    await navigateToAnalytics(page);

    const notConfiguredState = page.locator('.not-configured-state');
    await expect(notConfiguredState).toBeVisible({ timeout: 15000 });

    const paragraph = notConfiguredState.locator('p');
    await expect(paragraph).toBeVisible({ timeout: 5000 });
    await expect(paragraph).toContainText('Google Analytics Data API');
  });

  test('les étapes de configuration sont listées', async ({ page }) => {
    await navigateToAnalytics(page);

    const notConfiguredState = page.locator('.not-configured-state');
    await expect(notConfiguredState).toBeVisible({ timeout: 15000 });

    const steps = notConfiguredState.locator('.nc-steps');
    await expect(steps).toBeVisible({ timeout: 5000 });

    const listItems = steps.locator('ol li');
    const count = await listItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('le lien analytics.google.com est présent dans les étapes', async ({ page }) => {
    await navigateToAnalytics(page);

    const notConfiguredState = page.locator('.not-configured-state');
    await expect(notConfiguredState).toBeVisible({ timeout: 15000 });

    const gaLink = notConfiguredState.locator('a[href*="analytics.google.com"]');
    await expect(gaLink).toBeVisible({ timeout: 5000 });
    // Le lien s'ouvre dans un nouvel onglet pour ne pas quitter l'admin
    await expect(gaLink).toHaveAttribute('target', '_blank');
    await expect(gaLink).toHaveAttribute('rel', /noopener/);
  });

  test('les KPI cards et graphiques ne sont PAS affichés en état non configuré', async ({ page }) => {
    await navigateToAnalytics(page);

    await expect(page.locator('.not-configured-state')).toBeVisible({ timeout: 15000 });

    // Le contenu principal ne doit pas être rendu
    await expect(page.locator('.kpi-grid')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('.row-chart-realtime')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('.row-full')).not.toBeVisible({ timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : État avec données GA (si GA configuré)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Analytics admin — Données GA disponibles', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    const gaConfigured = await isGaConfigured(page);
    if (!gaConfigured) {
      // GA non configuré, ces tests ne s'appliquent pas
      test.skip();
    }
  });

  test('la grille de KPI cards est affichée', async ({ page }) => {
    await navigateToAnalytics(page);

    const kpiGrid = page.locator('.kpi-grid');
    await expect(kpiGrid).toBeVisible({ timeout: 20000 });
    await expect(kpiGrid).toHaveAttribute('aria-label', 'Métriques clés');
  });

  test('6 KPI cards sont présentes', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const cards = page.locator('.kpi-grid .kpi-card');
    await expect(cards).toHaveCount(6);
  });

  test('les labels des 6 KPI cards sont corrects', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const expectedTitles = [
      'Utilisateurs totaux',
      'Nouveaux utilisateurs',
      'Sessions',
      'Pages vues',
      'Durée moy. session',
      'Taux de rebond',
    ];

    for (const title of expectedTitles) {
      const card = page.locator('.kpi-card').filter({ hasText: title });
      await expect(card).toBeVisible({ timeout: 5000 });
    }
  });

  test('chaque KPI card affiche une valeur formatée', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const firstCard = page.locator('.kpi-card').first();
    const value = firstCard.locator('.kpi-value');
    await expect(value).toBeVisible({ timeout: 5000 });

    // La valeur doit être une chaîne non vide
    const text = await value.textContent();
    expect(text?.trim()).toBeTruthy();
  });

  test('le graphique "Évolution des visiteurs" est affiché', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const chartCard = page.locator('.col-chart .chart-card');
    await expect(chartCard).toBeVisible({ timeout: 10000 });

    const chartTitle = chartCard.locator('.chart-title');
    await expect(chartTitle).toHaveText('Évolution des visiteurs');
  });

  test('le canvas Chart.js est rendu dans le graphique visiteurs', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const canvas = page.locator('.col-chart canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('le compteur temps réel est affiché', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const realtimeCard = page.locator('.col-realtime .realtime-card');
    await expect(realtimeCard).toBeVisible({ timeout: 10000 });
  });

  test('le badge "En direct" est visible dans le compteur temps réel', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const badgeLabel = page.locator('.realtime-card .badge-label');
    await expect(badgeLabel).toBeVisible({ timeout: 10000 });
    await expect(badgeLabel).toHaveText('En direct');
  });

  test('le tableau Top pages est affiché', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const tableCard = page.locator('.row-full .table-card');
    await expect(tableCard).toBeVisible({ timeout: 10000 });

    const tableTitle = tableCard.locator('.table-title');
    await expect(tableTitle).toHaveText('Top pages');
  });

  test('la ligne sources / appareils / géo est affichée', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.kpi-grid').waitFor({ timeout: 20000 });

    const threeColsRow = page.locator('.row-three-cols');
    await expect(threeColsRow).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Sélecteur de période (date range picker)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Analytics admin — Sélecteur de période', () => {
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

  test('le groupe de presets est affiché avec le bon aria-label', async ({ page }) => {
    await navigateToAnalytics(page);

    const toggleGroup = page.locator('mat-button-toggle-group[aria-label="Période d\'analyse"]');
    await expect(toggleGroup).toBeVisible({ timeout: 15000 });
  });

  test('les 5 presets attendus sont présents', async ({ page }) => {
    await navigateToAnalytics(page);

    const toggleGroup = page.locator('mat-button-toggle-group[aria-label="Période d\'analyse"]');
    await expect(toggleGroup).toBeVisible({ timeout: 15000 });

    const expectedPresets = [
      "Aujourd'hui",
      '7 derniers jours',
      '30 derniers jours',
      '3 derniers mois',
      'Personnalisé',
    ];

    for (const label of expectedPresets) {
      const toggle = toggleGroup.locator('mat-button-toggle').filter({ hasText: label });
      await expect(toggle).toBeVisible({ timeout: 5000 });
    }
  });

  test('le preset "7 derniers jours" est sélectionné par défaut', async ({ page }) => {
    await navigateToAnalytics(page);

    const toggleGroup = page.locator('mat-button-toggle-group[aria-label="Période d\'analyse"]');
    await expect(toggleGroup).toBeVisible({ timeout: 15000 });

    // Le bouton actif doit avoir la classe checked ou l'attribut aria-checked=true
    const sevenDaysToggle = toggleGroup.locator('mat-button-toggle').filter({ hasText: '7 derniers jours' });
    await expect(sevenDaysToggle).toBeVisible({ timeout: 5000 });

    const classes = await sevenDaysToggle.getAttribute('class');
    expect(classes).toMatch(/mat-button-toggle-checked/);
  });

  test('clic sur "30 derniers jours" change le preset actif', async ({ page }) => {
    await navigateToAnalytics(page);

    const toggleGroup = page.locator('mat-button-toggle-group[aria-label="Période d\'analyse"]');
    await expect(toggleGroup).toBeVisible({ timeout: 15000 });

    const thirtyDaysToggle = toggleGroup.locator('mat-button-toggle').filter({ hasText: '30 derniers jours' });
    await thirtyDaysToggle.click();

    // Après le clic, ce bouton doit devenir checked
    const classes = await thirtyDaysToggle.getAttribute('class');
    expect(classes).toMatch(/mat-button-toggle-checked/);
  });

  test('clic sur "Personnalisé" affiche les champs de date', async ({ page }) => {
    await navigateToAnalytics(page);

    const toggleGroup = page.locator('mat-button-toggle-group[aria-label="Période d\'analyse"]');
    await expect(toggleGroup).toBeVisible({ timeout: 15000 });

    const customToggle = toggleGroup.locator('mat-button-toggle').filter({ hasText: 'Personnalisé' });
    await customToggle.click();

    const customRange = page.locator('.custom-range');
    await expect(customRange).toBeVisible({ timeout: 5000 });

    // Deux champs date et le bouton Appliquer
    const dateFields = customRange.locator('mat-form-field');
    await expect(dateFields).toHaveCount(2);

    const applyButton = customRange.locator('button').filter({ hasText: 'Appliquer' });
    await expect(applyButton).toBeVisible({ timeout: 5000 });
  });

  test('le bouton "Appliquer" est désactivé quand les champs personnalisés sont vides', async ({ page }) => {
    await navigateToAnalytics(page);

    const toggleGroup = page.locator('mat-button-toggle-group[aria-label="Période d\'analyse"]');
    await expect(toggleGroup).toBeVisible({ timeout: 15000 });

    const customToggle = toggleGroup.locator('mat-button-toggle').filter({ hasText: 'Personnalisé' });
    await customToggle.click();

    const applyButton = page.locator('.custom-range button').filter({ hasText: 'Appliquer' });
    await expect(applyButton).toBeVisible({ timeout: 5000 });
    await expect(applyButton).toBeDisabled({ timeout: 5000 });
  });

  test('re-sélectionner un preset masque les champs personnalisés', async ({ page }) => {
    await navigateToAnalytics(page);

    const toggleGroup = page.locator('mat-button-toggle-group[aria-label="Période d\'analyse"]');
    await expect(toggleGroup).toBeVisible({ timeout: 15000 });

    // Ouvrir le mode personnalisé
    const customToggle = toggleGroup.locator('mat-button-toggle').filter({ hasText: 'Personnalisé' });
    await customToggle.click();
    await expect(page.locator('.custom-range')).toBeVisible({ timeout: 5000 });

    // Revenir sur un preset prédéfini
    const sevenDaysToggle = toggleGroup.locator('mat-button-toggle').filter({ hasText: '7 derniers jours' });
    await sevenDaysToggle.click();

    // Les champs personnalisés doivent disparaître
    await expect(page.locator('.custom-range')).not.toBeVisible({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 5 : Tableau Top pages — tri interactif (si données disponibles)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Analytics admin — Tri du tableau Top pages', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }
    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
      return;
    }

    const gaConfigured = await isGaConfigured(page);
    if (!gaConfigured) {
      test.skip();
    }
  });

  test('le tableau Top pages affiche les colonnes de tri', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.row-full .table-card').waitFor({ timeout: 20000 });

    const table = page.locator('.pages-table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Colonnes triables
    const sortableHeaders = table.locator('th.sortable');
    const count = await sortableHeaders.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('la colonne "Vues" est triée par défaut (desc)', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.row-full .table-card').waitFor({ timeout: 20000 });

    const viewsHeader = page.locator('.pages-table th.sortable').filter({ hasText: 'Vues' });
    await expect(viewsHeader).toBeVisible({ timeout: 5000 });

    // La colonne active a la classe .active
    const classes = await viewsHeader.getAttribute('class');
    expect(classes).toMatch(/active/);

    // aria-sort doit indiquer "descending" par défaut
    const ariaSort = await viewsHeader.getAttribute('aria-sort');
    expect(ariaSort).toBe('descending');
  });

  test('clic sur l\'en-tête "Utilisateurs" change le tri', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.row-full .table-card').waitFor({ timeout: 20000 });

    const usersHeader = page
      .locator('.pages-table th.sortable')
      .filter({ hasText: 'Utilisateurs' });
    await expect(usersHeader).toBeVisible({ timeout: 5000 });

    await usersHeader.click();

    // Après le clic, cette colonne devient active avec descending
    const classes = await usersHeader.getAttribute('class');
    expect(classes).toMatch(/active/);

    const ariaSort = await usersHeader.getAttribute('aria-sort');
    expect(['ascending', 'descending']).toContain(ariaSort);
  });

  test('double clic sur la même colonne inverse le sens du tri', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.row-full .table-card').waitFor({ timeout: 20000 });

    const viewsHeader = page.locator('.pages-table th.sortable').filter({ hasText: 'Vues' });
    await expect(viewsHeader).toBeVisible({ timeout: 5000 });

    // 1er clic sur la colonne déjà active → passe en ascending
    await viewsHeader.click();
    const ariaSort1 = await viewsHeader.getAttribute('aria-sort');
    expect(ariaSort1).toBe('ascending');

    // 2e clic → repasse en descending
    await viewsHeader.click();
    const ariaSort2 = await viewsHeader.getAttribute('aria-sort');
    expect(ariaSort2).toBe('descending');
  });

  test('les en-têtes triables sont accessibles au clavier', async ({ page }) => {
    await navigateToAnalytics(page);

    await page.locator('.row-full .table-card').waitFor({ timeout: 20000 });

    const viewsHeader = page.locator('.pages-table th.sortable').filter({ hasText: 'Vues' });
    await expect(viewsHeader).toBeVisible({ timeout: 5000 });

    // L'en-tête doit avoir un tabindex pour être focusable
    const tabindex = await viewsHeader.getAttribute('tabindex');
    expect(tabindex).toBe('0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 6 : Sécurité et contrôle d'accès
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Analytics admin — Contrôle d\'accès', () => {
  test('un utilisateur non authentifié est redirigé depuis /admin/analytics', async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }

    // Accès direct sans login
    await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded' });

    // L'authGuard doit rediriger vers /auth/login
    await page.waitForURL(/\/auth\/login/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
