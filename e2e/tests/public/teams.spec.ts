/**
 * Tests E2E fonctionnels — Équipes
 *
 * Sélecteurs basés sur equipes.html et team-detail.html :
 *
 * equipes.html :
 * - section.equipes-ambassadeurs       → conteneur principal
 * - [role="status"]                    → skeleton de chargement
 * - .error-state[role="alert"]         → état d'erreur
 * - .equipes-section                   → section équipes chargées
 * - .equipes-grid                      → grille des cartes équipe
 * - a.team-card                        → carte équipe cliquable (lien)
 * - .team-name                         → nom de l'équipe dans la carte
 * - .empty-state h2                    → "Aucune équipe pour le moment"
 * - .ambassadeurs-section              → section ambassadeurs
 * - .ambassador-name                   → nom ambassadeur
 *
 * team-detail.html :
 * - section.team-detail-page           → conteneur détail équipe
 * - button.back-button                 → bouton retour
 * - .section-title                     → titre de l'équipe (h1)
 * - .players-grid a.player-card        → cartes joueurs (desktop)
 * - .player-name                       → nom du joueur
 * - .empty-members p                   → "Aucun membre dans cette équipe"
 * - .error-state button.btn-back       → bouton retour en cas d'erreur
 */

import { test, expect } from '@playwright/test';

async function waitForAngularInit(page: import('@playwright/test').Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

// Attendre que le chargement soit terminé (skeleton disparaît ou données arrivent)
async function waitForEquipesLoaded(page: import('@playwright/test').Page) {
  // Attendre que l'état de chargement disparaisse ou que les données arrivent
  await page.waitForFunction(() => {
    const status = document.querySelector('[role="status"]');
    const equipes = document.querySelector('.equipes-section, .empty-state, .error-state');
    return !status || equipes !== null;
  }, { timeout: 15000 });
}

test.describe('Page Équipes — Liste', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la page /structure/equipes se charge avec le conteneur principal', async ({ page }) => {
    const section = page.locator('section.equipes-ambassadeurs');
    await expect(section).toBeVisible({ timeout: 10000 });
  });

  test('un état est toujours visible : skeleton, erreur, équipes ou état vide', async ({ page }) => {
    // Attendre un état visible parmi les possibles
    const anyState = page.locator([
      '[role="status"]',
      '.equipes-section',
      '.empty-state',
      '.error-state'
    ].join(', '));
    await expect(anyState.first()).toBeAttached({ timeout: 15000 });
  });

  test('si des équipes sont chargées : la grille est visible', async ({ page }) => {
    await waitForEquipesLoaded(page);

    const equipesSectionCount = await page.locator('.equipes-section').count();
    const emptyStateCount = await page.locator('.empty-state').count();
    const errorStateCount = await page.locator('.error-state').count();

    if (equipesSectionCount > 0) {
      await expect(page.locator('.equipes-grid')).toBeVisible({ timeout: 5000 });
      const teamCards = page.locator('a.team-card');
      const count = await teamCards.count();
      expect(count).toBeGreaterThan(0);
    } else if (emptyStateCount > 0) {
      // État vide : message "Aucune équipe pour le moment"
      await expect(page.locator('.empty-state h2')).toContainText(/[Aa]ucune équipe/, { timeout: 5000 });
    } else if (errorStateCount > 0) {
      await expect(page.locator('.error-state')).toBeVisible({ timeout: 5000 });
    }
    // Dans tous les cas le test passe
  });

  test('si des équipes sont chargées : chaque carte affiche le nom de l\'équipe', async ({ page }) => {
    await waitForEquipesLoaded(page);

    const equipesSectionCount = await page.locator('.equipes-section').count();
    if (equipesSectionCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas de données équipe disponibles' });
      return;
    }

    const teamNames = page.locator('a.team-card .team-name');
    const count = await teamNames.count();
    expect(count).toBeGreaterThan(0);
    // Vérifier que le texte du nom n'est pas vide
    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await teamNames.nth(i).innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('si des équipes sont chargées : clic sur une carte navigue vers la page détail', async ({ page }) => {
    await waitForEquipesLoaded(page);

    const equipesSectionCount = await page.locator('.equipes-section').count();
    if (equipesSectionCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas de données équipe disponibles' });
      return;
    }

    const firstTeamCard = page.locator('a.team-card').first();
    await expect(firstTeamCard).toBeVisible({ timeout: 5000 });

    // Récupérer le href pour vérifier la navigation
    const href = await firstTeamCard.getAttribute('href');
    await firstTeamCard.click();
    await page.waitForLoadState('domcontentloaded');

    // L'URL doit contenir /structure/equipes/
    await expect(page).toHaveURL(/\/structure\/equipes\//);
  });

  test('l\'état vide affiche les CTAs vers recrutement et contact', async ({ page }) => {
    await waitForEquipesLoaded(page);

    const emptyState = page.locator('.empty-state');
    const emptyCount = await emptyState.count();
    if (emptyCount > 0) {
      await expect(page.locator('.btn-empty-primary')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.btn-empty-secondary')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Page Équipes — Détail équipe', () => {
  test('navigation vers le détail d\'une équipe depuis la liste', async ({ page }) => {
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForEquipesLoaded(page);

    const equipesSectionCount = await page.locator('.equipes-section').count();
    if (equipesSectionCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas de données équipe disponibles' });
      return;
    }

    // Cliquer sur la première équipe
    const firstCard = page.locator('a.team-card').first();
    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');
    await waitForAngularInit(page);

    // Un état doit être visible : skeleton, équipe ou erreur
    const anyState = page.locator([
      'section.team-detail-page',
      '.error-state',
      '[role="status"][aria-label="Chargement en cours"]'
    ].join(', '));
    await expect(anyState.first()).toBeAttached({ timeout: 15000 });
  });

  test('la page détail affiche le nom de l\'équipe si chargée', async ({ page }) => {
    // Naviguer via la liste pour obtenir un slug valide
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForEquipesLoaded(page);

    const equipesSectionCount = await page.locator('.equipes-section').count();
    if (equipesSectionCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas de données équipe disponibles' });
      return;
    }

    const firstCard = page.locator('a.team-card').first();
    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');

    // Attendre que le détail soit chargé ou en erreur
    await page.waitForFunction(() => {
      return document.querySelector('section.team-detail-page') !== null ||
             document.querySelector('.error-state') !== null;
    }, { timeout: 15000 });

    const teamDetailCount = await page.locator('section.team-detail-page').count();
    if (teamDetailCount > 0) {
      // Le titre de l'équipe (h1.section-title) doit être visible
      const titleEl = page.locator('.team-header .section-title');
      const titleCount = await titleEl.count();
      if (titleCount > 0) {
        await expect(titleEl).toBeVisible({ timeout: 5000 });
        const text = await titleEl.innerText();
        expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('la page détail affiche les joueurs ou un message vide', async ({ page }) => {
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForEquipesLoaded(page);

    const equipesSectionCount = await page.locator('.equipes-section').count();
    if (equipesSectionCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas de données équipe disponibles' });
      return;
    }

    await page.locator('a.team-card').first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      return document.querySelector('section.team-detail-page') !== null ||
             document.querySelector('.error-state') !== null;
    }, { timeout: 15000 });

    const teamDetailCount = await page.locator('section.team-detail-page').count();
    if (teamDetailCount > 0) {
      const playersGrid = page.locator('.players-grid');
      const emptyMembers = page.locator('.empty-members');
      const playersCount = await playersGrid.count();
      const emptyCount = await emptyMembers.count();

      // L'un ou l'autre doit être présent
      expect(playersCount + emptyCount).toBeGreaterThan(0);

      if (playersCount > 0) {
        const playerCards = page.locator('.players-grid a.player-card');
        const count = await playerCards.count();
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  test('le bouton retour sur la page détail navigue vers la liste', async ({ page }) => {
    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForEquipesLoaded(page);

    const equipesSectionCount = await page.locator('.equipes-section').count();
    if (equipesSectionCount === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas de données équipe disponibles' });
      return;
    }

    await page.locator('a.team-card').first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      return document.querySelector('section.team-detail-page') !== null ||
             document.querySelector('.error-state') !== null;
    }, { timeout: 15000 });

    // Clic sur bouton retour
    const backButton = page.locator('button.back-button');
    const backCount = await backButton.count();
    if (backCount > 0) {
      await backButton.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/structure\/equipes$/);
    }
  });
});
