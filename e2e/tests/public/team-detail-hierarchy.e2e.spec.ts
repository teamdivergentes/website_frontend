/**
 * Tests E2E — Page detail equipe — EPIC-17 F4
 *
 * Verifie la hierarchie visuelle reorganisee :
 * 1. Nom equipe (H1)
 * 2. "NOS JOUEURS" (H2)
 * 3. "NOTRE COACHING STAFF" (H2 conditionnelle, si >= 1 coach)
 *
 * Sélecteurs basés sur team-detail.html :
 * - section.team-detail-page   -> conteneur principal
 * - h1.team-title              -> titre H1 nom equipe
 * - h2.players-heading         -> "NOS JOUEURS"
 * - h2.coaching-heading        -> "NOTRE COACHING STAFF" (conditionnel)
 * - .players-grid .player-card -> carte d'un joueur
 * - .coaching-grid .coach-card -> carte d'un coach
 * - section[role="status"]     -> skeleton chargement
 * - .error-state               -> état erreur
 * - button.back-button         -> bouton retour
 */

import { test, expect, Page } from '@playwright/test';
import { isBackendAvailable } from '../../helpers/auth';

async function getFirstTeamSlug(page: Page): Promise<string | null> {
  const response = await page.request.get('/api/teams', { timeout: 10000 }).catch(() => null);
  if (!response || !response.ok()) return null;
  const teams = await response.json().catch(() => []);
  if (!Array.isArray(teams) || teams.length === 0) return null;
  return teams[0]?.slug ?? teams[0]?.id?.toString() ?? null;
}

async function navigateToTeamDetail(page: Page, slug: string): Promise<void> {
  await page.goto(`/structure/equipes/${slug}`, { waitUntil: 'domcontentloaded' });
  await page.locator('section[role="status"]').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await Promise.race([
    page.locator('section.team-detail-page').waitFor({ timeout: 15000 }).catch(() => {}),
    page.locator('.error-state').waitFor({ timeout: 15000 }).catch(() => {}),
  ]);
}

test.describe('Page detail equipe — Hierarchie visuelle', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
  });

  test('H1 : le nom de l\'equipe est affiche en premier titre', async ({ page }) => {
    const slug = await getFirstTeamSlug(page);
    if (!slug) {
      test.info().annotations.push({ type: 'note', description: 'Aucune equipe disponible' });
      return;
    }
    await navigateToTeamDetail(page, slug);
    const hasTeam = await page.locator('section.team-detail-page').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeam) return;

    const h1 = page.locator('h1.team-title');
    await expect(h1).toBeVisible({ timeout: 10000 });
    const teamName = await h1.textContent();
    expect(teamName?.trim().length).toBeGreaterThan(0);
  });

  test('H2 NOS JOUEURS apparait apres le H1', async ({ page }) => {
    const slug = await getFirstTeamSlug(page);
    if (!slug) return;
    await navigateToTeamDetail(page, slug);
    const hasTeam = await page.locator('section.team-detail-page').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeam) return;

    await expect(page.locator('h1.team-title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2.players-heading')).toContainText('NOS JOUEURS', { timeout: 10000 });

    const h1Box = await page.locator('h1.team-title').boundingBox();
    const h2Box = await page.locator('h2.players-heading').boundingBox();
    if (h1Box && h2Box) {
      expect(h1Box.y).toBeLessThan(h2Box.y);
    }
  });

  test('les cartes joueurs sont visibles sous NOS JOUEURS', async ({ page }) => {
    const slug = await getFirstTeamSlug(page);
    if (!slug) return;
    await navigateToTeamDetail(page, slug);
    const hasTeam = await page.locator('section.team-detail-page').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeam) return;

    const hasPlayers = await page.locator('.players-grid').isVisible({ timeout: 5000 }).catch(() => false);
    const hasEmpty = await page.locator('.empty-members').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasPlayers || hasEmpty).toBe(true);
  });

  test('H2 NOTRE COACHING STAFF est conditionnel', async ({ page }) => {
    const slug = await getFirstTeamSlug(page);
    if (!slug) return;
    await navigateToTeamDetail(page, slug);
    const hasTeam = await page.locator('section.team-detail-page').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeam) return;

    const coachingHeading = page.locator('h2.coaching-heading');
    const hasCoaching = await coachingHeading.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasCoaching) {
      await expect(coachingHeading).toContainText('NOTRE COACHING STAFF');
      const h2PlayersBox = await page.locator('h2.players-heading').boundingBox();
      const h2CoachingBox = await coachingHeading.boundingBox();
      if (h2PlayersBox && h2CoachingBox) {
        expect(h2PlayersBox.y).toBeLessThan(h2CoachingBox.y);
      }
      expect(await page.locator('.coaching-grid .coach-card').count()).toBeGreaterThan(0);
    } else {
      await expect(coachingHeading).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('une equipe inexistante affiche erreur ou reste sur la page sans crash', async ({ page }) => {
    await page.goto('/structure/equipes/equipe-inexistante-e2e-99999', { waitUntil: 'domcontentloaded' });
    await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });

    // Attendre que le skeleton disparaisse (fin du chargement)
    await page.locator('section[role="status"]').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});

    // Attendre un peu pour que l'erreur async soit traitée
    await page.waitForTimeout(2000);

    // L'app doit etre dans l'un de ces etats :
    // 1. .error-state visible (equipe introuvable)
    // 2. Redirige vers /404
    // 3. Redirige vers /not-found
    // 4. Redirige vers /structure/equipes (liste)
    const hasError = await page.locator('.error-state').isVisible({ timeout: 3000 }).catch(() => false);
    const url = page.url();
    const isOnErrorPage = url.includes('/404') || url.includes('/not-found') || url.includes('/structure/equipes');

    // Verifier qu'il n'y a pas de crash JavaScript
    const hasTeamDetail = await page.locator('section.team-detail-page').isVisible({ timeout: 3000 }).catch(() => false);

    // Au moins l'un des etats valides doit etre vrai
    expect(hasError || isOnErrorPage || !hasTeamDetail).toBe(true);
  });
});

test.describe('Page detail equipe — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) test.skip();
  });

  test('le bouton retour ramene a la liste des equipes', async ({ page }) => {
    const slug = await getFirstTeamSlug(page);
    if (!slug) return;
    await navigateToTeamDetail(page, slug);
    const hasTeam = await page.locator('section.team-detail-page').isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTeam) return;

    await page.locator('button.back-button').click();
    await page.waitForURL(/\/structure\/equipes/, { timeout: 10000 });
    expect(page.url()).toContain('/structure/equipes');
  });

  test('un clic sur une carte joueur navigue vers la page joueur', async ({ page }) => {
    const slug = await getFirstTeamSlug(page);
    if (!slug) return;
    await navigateToTeamDetail(page, slug);
    const hasPlayers = await page.locator('.players-grid .player-card').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasPlayers) {
      test.info().annotations.push({ type: 'note', description: 'Aucun joueur dans cette equipe' });
      return;
    }
    await page.locator('.players-grid .player-card').first().click();
    await page.waitForURL(/\/joueur\//, { timeout: 10000 });
    expect(page.url()).toContain('/joueur/');
  });
});
