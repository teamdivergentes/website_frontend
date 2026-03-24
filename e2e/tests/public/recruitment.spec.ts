/**
 * Tests E2E fonctionnels — Recrutement
 *
 * Sélecteurs basés sur recrutement.html et job-detail.component.html :
 *
 * recrutement.html :
 * - section.recrutement                 → conteneur principal
 * - .section-header h1                  → titre "Recrutements"
 * - .skeleton-postes-list[role="status"] → skeleton de chargement
 * - .error-state[role="alert"]          → état d'erreur
 * - .postes-container                   → conteneur des postes
 * - .postes-list                        → liste des offres actives
 * - .poste-card                         → carte offre de recrutement
 * - .poste-title                        → titre de l'offre (h2)
 * - .poste-type                         → type de contrat
 * - .poste-description                  → description courte
 * - a.btn-postuler                      → lien "Découvrir" vers le détail
 * - .no-postes h2                       → "Aucun poste à pourvoir"
 *
 * job-detail.component.html :
 * - section.job-detail                  → conteneur détail offre
 * - .job-detail__label                  → "Fiche de poste"
 * - h1.job-detail__title                → titre du poste
 * - .job-detail__type-badge             → badge type de contrat
 * - .job-detail__card                   → card principale
 * - .info-item                          → élément d'info (lieu, type, etc.)
 * - a.btn-apply                         → bouton "Postuler"
 * - a.btn-back                          → lien "Retour aux offres"
 */

import { test, expect } from '@playwright/test';

async function waitForAngularInit(page: import('@playwright/test').Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

async function waitForRecrutementLoaded(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const status = document.querySelector('.skeleton-postes-list[role="status"]');
    const content = document.querySelector('.postes-container, .error-state');
    return !status || content !== null;
  }, { timeout: 15000 });
}

test.describe('Page Recrutement — Liste des offres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la page /structure/recrutement charge correctement', async ({ page }) => {
    const section = page.locator('section.recrutement');
    await expect(section).toBeVisible({ timeout: 10000 });
  });

  test('le titre "Recrutements" est visible', async ({ page }) => {
    await expect(page.locator('.section-header h1')).toContainText('Recrutements', { timeout: 10000 });
  });

  test('le label "Nos offres" est visible dans le header', async ({ page }) => {
    await expect(page.locator('.section-header .header-content .section-label'))
      .toContainText(/[Nn]os offres/, { timeout: 10000 });
  });

  test('un état est visible : skeleton, erreur, offres ou état vide', async ({ page }) => {
    const anyState = page.locator([
      '.skeleton-postes-list',
      '.postes-container',
      '.error-state'
    ].join(', '));
    await expect(anyState.first()).toBeAttached({ timeout: 15000 });
  });

  test('si des offres sont disponibles : chaque carte affiche titre et type', async ({ page }) => {
    await waitForRecrutementLoaded(page);

    const postesList = page.locator('.postes-list');
    const postesCount = await postesList.count();
    if (postesCount === 0) {
      // Vérifier l'état vide ou l'erreur
      const noPostes = page.locator('.no-postes');
      const errorState = page.locator('.error-state');
      const noPostesCount = await noPostes.count();
      const errorCount = await errorState.count();
      expect(noPostesCount + errorCount).toBeGreaterThan(0);
      return;
    }

    const posteCards = page.locator('.poste-card');
    const count = await posteCards.count();
    expect(count).toBeGreaterThan(0);

    // Vérifier que chaque carte a un titre et un type
    for (let i = 0; i < Math.min(count, 3); i++) {
      const card = posteCards.nth(i);
      const title = card.locator('.poste-title');
      const type = card.locator('.poste-type');
      await expect(title).toBeVisible({ timeout: 5000 });
      await expect(type).toBeVisible({ timeout: 5000 });
      const titleText = await title.innerText();
      expect(titleText.trim().length).toBeGreaterThan(0);
    }
  });

  test('si des offres sont disponibles : chaque carte affiche une description', async ({ page }) => {
    await waitForRecrutementLoaded(page);

    const posteCards = page.locator('.poste-card');
    const count = await posteCards.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'offres disponibles' });
      return;
    }

    for (let i = 0; i < Math.min(count, 3); i++) {
      const desc = posteCards.nth(i).locator('.poste-description');
      await expect(desc).toBeVisible({ timeout: 5000 });
    }
  });

  test('si des offres ont un slug : le lien "Découvrir" est présent', async ({ page }) => {
    await waitForRecrutementLoaded(page);

    const posteCards = page.locator('.poste-card');
    const count = await posteCards.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'offres disponibles' });
      return;
    }

    // Chercher les boutons "Découvrir" dans les cartes
    const discoverLinks = page.locator('a.btn-postuler');
    const linksCount = await discoverLinks.count();
    if (linksCount > 0) {
      await expect(discoverLinks.first()).toBeVisible({ timeout: 5000 });
      await expect(discoverLinks.first()).toContainText('Découvrir');
    }
  });

  test('clic sur "Découvrir" navigue vers la page détail de l\'offre', async ({ page }) => {
    await waitForRecrutementLoaded(page);

    const discoverLinks = page.locator('a.btn-postuler');
    const count = await discoverLinks.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas de lien Découvrir disponible' });
      return;
    }

    await discoverLinks.first().click();
    await page.waitForLoadState('domcontentloaded');
    // L'URL doit contenir /structure/recrutement/[slug]
    await expect(page).toHaveURL(/\/structure\/recrutement\/.+/);
  });

  test('l\'état vide affiche un email de candidature spontanée', async ({ page }) => {
    await waitForRecrutementLoaded(page);

    const noPostes = page.locator('.no-postes');
    const count = await noPostes.count();
    if (count > 0) {
      await expect(page.locator('.no-postes h2')).toContainText(/[Aa]ucun poste/, { timeout: 5000 });
      // L'email de contact doit être présent
      const emailLink = page.locator('.no-postes a[href^="mailto:"]');
      await expect(emailLink).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Page Recrutement — Détail offre', () => {
  test('navigation depuis la liste vers le détail d\'une offre', async ({ page }) => {
    await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForRecrutementLoaded(page);

    const discoverLinks = page.locator('a.btn-postuler');
    const count = await discoverLinks.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'offre avec slug disponible' });
      return;
    }

    await discoverLinks.first().click();
    await page.waitForLoadState('domcontentloaded');
    await waitForAngularInit(page);

    // Attendre que le détail soit chargé
    await page.waitForFunction(() => {
      return document.querySelector('section.job-detail') !== null;
    }, { timeout: 15000 });

    await expect(page.locator('section.job-detail')).toBeVisible({ timeout: 10000 });
  });

  test('la page détail affiche le titre, le type et les infos du poste', async ({ page }) => {
    await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForRecrutementLoaded(page);

    const discoverLinks = page.locator('a.btn-postuler');
    if (await discoverLinks.count() === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'offre disponible' });
      return;
    }

    await discoverLinks.first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      const detail = document.querySelector('section.job-detail');
      const skeleton = document.querySelector('[role="status"]');
      return detail !== null && !skeleton;
    }, { timeout: 15000 });

    // Label "Fiche de poste"
    await expect(page.locator('.job-detail__label')).toContainText('Fiche de poste', { timeout: 5000 });

    // Titre du poste (h1)
    const titleEl = page.locator('h1.job-detail__title');
    await expect(titleEl).toBeVisible({ timeout: 5000 });
    const titleText = await titleEl.innerText();
    expect(titleText.trim().length).toBeGreaterThan(0);

    // Badge type
    await expect(page.locator('.job-detail__type-badge')).toBeVisible({ timeout: 5000 });
  });

  test('le bouton "Postuler" est visible sur la page détail', async ({ page }) => {
    await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForRecrutementLoaded(page);

    const discoverLinks = page.locator('a.btn-postuler');
    if (await discoverLinks.count() === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'offre disponible' });
      return;
    }

    await discoverLinks.first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      return document.querySelector('.job-detail__actions') !== null;
    }, { timeout: 15000 });

    const applyBtn = page.locator('a.btn-apply');
    await expect(applyBtn).toBeVisible({ timeout: 5000 });
    await expect(applyBtn).toContainText('Postuler');
  });

  test('le lien "Retour aux offres" ramène à la liste', async ({ page }) => {
    await page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForRecrutementLoaded(page);

    const discoverLinks = page.locator('a.btn-postuler');
    if (await discoverLinks.count() === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'offre disponible' });
      return;
    }

    await discoverLinks.first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      return document.querySelector('.job-detail__actions') !== null;
    }, { timeout: 15000 });

    const backLink = page.locator('a.btn-back');
    await expect(backLink).toBeVisible({ timeout: 5000 });
    await expect(backLink).toContainText('Retour aux offres');

    await backLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/structure\/recrutement$/);
  });
});
