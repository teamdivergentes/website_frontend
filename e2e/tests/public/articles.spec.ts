/**
 * Tests E2E fonctionnels — Articles
 *
 * Sélecteurs basés sur articles-page.component.html et article-detail.component.html :
 *
 * articles-page.component.html :
 * - section.articles-page                   → conteneur principal
 * - .articles-page__title                   → titre "ACTUALITÉS" (h1)
 * - .articles-page__skeleton[role="status"] → skeleton de chargement
 * - .error-state[role="alert"]              → état d'erreur
 * - .articles-page__empty[role="status"]    → état vide (aucun article)
 * - article.hero-card                       → article hero (featured #1)
 * - .hero-card__link                        → lien article hero
 * - .hero-card__title                       → titre article hero (h2)
 * - .duo-cards article.duo-card             → articles duo (featured #2 et #3)
 * - .duo-card__title                        → titre article duo (h3)
 * - .articles-page__grid article.article-card → grille articles réguliers
 * - .article-card__title                    → titre article régulier
 * - .article-card__excerpt                  → extrait article
 * - nav.articles-page__filters              → filtres par catégorie
 * - button.articles-page__filter-btn        → bouton filtre
 * - nav.articles-page__pagination           → pagination
 *
 * article-detail.component.html :
 * - article.article-detail                  → conteneur article détail
 * - .article-hero                           → image hero
 * - nav.article-breadcrumb                  → fil d'Ariane
 * - h1.article-header__title               → titre de l'article
 * - .article-header__category              → catégorie
 * - .article-content                        → contenu rendu
 * - .article-back a.article-back__link      → lien retour articles
 * - section.article-similar                 → articles similaires (si présents)
 */

import { test, expect } from '@playwright/test';

async function waitForAngularInit(page: import('@playwright/test').Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

async function waitForArticlesLoaded(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const skeleton = document.querySelector('.articles-page__skeleton[role="status"]');
    const content = document.querySelector(
      '.articles-page__editorial, .articles-page__empty, .error-state'
    );
    return !skeleton || content !== null;
  }, { timeout: 15000 });
}

test.describe('Page Articles — Liste', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/articles', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la page /articles charge avec le conteneur principal', async ({ page }) => {
    await expect(page.locator('section.articles-page')).toBeVisible({ timeout: 10000 });
  });

  test('le titre "ACTUALITÉS" est visible', async ({ page }) => {
    await expect(page.locator('.articles-page__title')).toContainText('ACTUALITÉS', { timeout: 10000 });
  });

  test('un état est visible : skeleton, erreur, articles ou état vide', async ({ page }) => {
    const anyState = page.locator([
      '.articles-page__skeleton',
      '.articles-page__editorial',
      '.articles-page__empty',
      '.error-state'
    ].join(', '));
    await expect(anyState.first()).toBeAttached({ timeout: 15000 });
  });

  test('si des articles sont présents : l\'article hero ou la grille est visible', async ({ page }) => {
    await waitForArticlesLoaded(page);

    const editorialCount = await page.locator('.articles-page__editorial').count();
    const emptyCount = await page.locator('.articles-page__empty').count();
    const errorCount = await page.locator('.error-state').count();

    if (editorialCount > 0) {
      // Un article au moins doit être présent
      const heroCard = page.locator('article.hero-card');
      const duoCards = page.locator('article.duo-card');
      const articleCards = page.locator('.articles-page__grid article.article-card');

      const heroCount = await heroCard.count();
      const duoCount = await duoCards.count();
      const gridCount = await articleCards.count();

      expect(heroCount + duoCount + gridCount).toBeGreaterThan(0);
    } else if (emptyCount > 0) {
      await expect(page.locator('.articles-page__empty')).toContainText(/[Aa]ucun article/, { timeout: 5000 });
    } else if (errorCount > 0) {
      await expect(page.locator('.error-state')).toBeVisible({ timeout: 5000 });
    }
  });

  test('si des articles hero sont présents : titre visible', async ({ page }) => {
    await waitForArticlesLoaded(page);

    const heroCard = page.locator('article.hero-card');
    const count = await heroCard.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'article hero disponible' });
      return;
    }

    const heroTitle = page.locator('.hero-card__title');
    await expect(heroTitle).toBeVisible({ timeout: 5000 });
    const text = await heroTitle.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('si des articles réguliers sont présents : titre et date visibles', async ({ page }) => {
    await waitForArticlesLoaded(page);

    const articleCards = page.locator('.articles-page__grid article.article-card');
    const count = await articleCards.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'articles réguliers disponibles' });
      return;
    }

    // Vérifier la première carte
    const firstCard = articleCards.first();
    const title = firstCard.locator('.article-card__title');
    const date = firstCard.locator('.article-card__date');

    await expect(title).toBeVisible({ timeout: 5000 });
    await expect(date).toBeAttached({ timeout: 5000 });

    const titleText = await title.innerText();
    expect(titleText.trim().length).toBeGreaterThan(0);
  });

  test('clic sur un article hero navigue vers le détail', async ({ page }) => {
    await waitForArticlesLoaded(page);

    const heroLink = page.locator('.hero-card__link');
    const count = await heroLink.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'article hero disponible' });
      return;
    }

    await heroLink.first().click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/articles\/.+/);
  });

  test('clic sur un article de la grille navigue vers le détail', async ({ page }) => {
    await waitForArticlesLoaded(page);

    const articleLink = page.locator('.articles-page__grid article.article-card .article-card__link');
    const count = await articleLink.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'article régulier disponible' });
      return;
    }

    await articleLink.first().click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/articles\/.+/);
  });

  test('les filtres par catégorie sont présents si des types existent', async ({ page }) => {
    await waitForArticlesLoaded(page);

    const filtersNav = page.locator('nav.articles-page__filters');
    const count = await filtersNav.count();
    if (count > 0) {
      await expect(filtersNav).toBeVisible({ timeout: 5000 });

      // Le bouton "Tous" doit être présent
      const tousBtn = page.locator('button.articles-page__filter-btn').filter({ hasText: 'Tous' });
      await expect(tousBtn).toBeVisible({ timeout: 5000 });
      await expect(tousBtn).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('clic sur un filtre catégorie le marque comme actif', async ({ page }) => {
    await waitForArticlesLoaded(page);

    const filterBtns = page.locator('button.articles-page__filter-btn');
    const count = await filterBtns.count();
    if (count < 2) {
      test.info().annotations.push({ type: 'note', description: 'Pas assez de filtres disponibles' });
      return;
    }

    // Cliquer sur le deuxième filtre (pas "Tous")
    const secondFilter = filterBtns.nth(1);
    await secondFilter.click();
    await page.waitForTimeout(300);

    await expect(secondFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(secondFilter).toHaveClass(/articles-page__filter-btn--active/);
  });
});

test.describe('Page Articles — Détail article', () => {
  test('navigation depuis la liste vers le détail d\'un article', async ({ page }) => {
    await page.goto('/articles', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForArticlesLoaded(page);

    // Chercher n'importe quel lien d'article
    const anyArticleLink = page.locator(
      '.hero-card__link, .duo-card__link, .articles-page__grid .article-card__link'
    );
    const count = await anyArticleLink.count();
    if (count === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'articles disponibles' });
      return;
    }

    await anyArticleLink.first().click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/articles\/.+/);
  });

  test('la page détail d\'article affiche le titre et le contenu', async ({ page }) => {
    await page.goto('/articles', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForArticlesLoaded(page);

    const anyArticleLink = page.locator(
      '.hero-card__link, .duo-card__link, .articles-page__grid .article-card__link'
    );
    if (await anyArticleLink.count() === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'articles disponibles' });
      return;
    }

    await anyArticleLink.first().click();
    await page.waitForLoadState('domcontentloaded');

    // Attendre que l'article soit chargé (skeleton disparaît)
    await page.waitForFunction(() => {
      return document.querySelector('article.article-detail') !== null ||
             document.querySelector('.error-state') !== null;
    }, { timeout: 15000 });

    const articleDetail = page.locator('article.article-detail');
    const count = await articleDetail.count();
    if (count > 0) {
      // Le titre h1 doit être visible
      const titleEl = page.locator('h1.article-header__title');
      await expect(titleEl).toBeVisible({ timeout: 5000 });
      const titleText = await titleEl.innerText();
      expect(titleText.trim().length).toBeGreaterThan(0);

      // Le contenu doit être rendu
      await expect(page.locator('.article-content')).toBeVisible({ timeout: 5000 });
    }
  });

  test('le fil d\'Ariane est présent sur la page détail', async ({ page }) => {
    await page.goto('/articles', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForArticlesLoaded(page);

    const anyArticleLink = page.locator(
      '.hero-card__link, .duo-card__link, .articles-page__grid .article-card__link'
    );
    if (await anyArticleLink.count() === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'articles disponibles' });
      return;
    }

    await anyArticleLink.first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      return document.querySelector('article.article-detail') !== null;
    }, { timeout: 15000 });

    const breadcrumb = page.locator('nav.article-breadcrumb');
    const breadcrumbCount = await breadcrumb.count();
    if (breadcrumbCount > 0) {
      await expect(breadcrumb).toBeVisible({ timeout: 5000 });
      // Liens Accueil et Articles dans le fil d'Ariane
      await expect(breadcrumb.locator('a').filter({ hasText: 'Articles' })).toBeVisible({ timeout: 5000 });
    }
  });

  test('le lien "Retour aux articles" ramène à la liste', async ({ page }) => {
    await page.goto('/articles', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
    await waitForArticlesLoaded(page);

    const anyArticleLink = page.locator(
      '.hero-card__link, .duo-card__link, .articles-page__grid .article-card__link'
    );
    if (await anyArticleLink.count() === 0) {
      test.info().annotations.push({ type: 'note', description: 'Pas d\'articles disponibles' });
      return;
    }

    await anyArticleLink.first().click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      return document.querySelector('article.article-detail') !== null;
    }, { timeout: 15000 });

    const backLink = page.locator('.article-back a.article-back__link');
    const backCount = await backLink.count();
    if (backCount > 0) {
      await backLink.scrollIntoViewIfNeeded();
      await expect(backLink).toBeVisible({ timeout: 5000 });
      await expect(backLink).toContainText('Retour aux articles');
      await backLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/articles$/);
    }
  });
});
