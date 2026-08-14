/**
 * Tests E2E — Page admin Catégories d'articles (`/admin/articles/categories`)
 *
 * Non-régression de la migration dialogue -> page routée (EPIC-41, feature 3,
 * 7e et dernière migration).
 *
 * L'écran était le **seul dialogue dans un dialogue** du panel : la liste des
 * catégories s'ouvrait en modale `md` par-dessus la liste des articles, et
 * ouvrait à son tour le formulaire de catégorie en `sm`. Deux overlays empilés,
 * deux pièges de focus imbriqués — `Échap` ferme le second et le premier reste
 * ouvert derrière sans que rien ne l'annonce. C'est la seule interdiction
 * absolue de la règle inscrite dans `frontend/CLAUDE.md`.
 *
 * La migration est une **dé-imbrication** : la liste devient une page, le
 * formulaire de catégorie **reste** un dialogue `sm` (un seul contrôle, aucun
 * sous-éditeur, aucune liste enfant — il satisfait les trois conditions). Les
 * tests vérifient donc qu'il n'y a jamais **plus d'un** overlay à l'écran, pas
 * qu'il n'y en a aucun.
 *
 * Sélecteurs relevés dans le markup réel, pas devinés :
 *
 * Liste des articles (articles-list.component.html) :
 * - button[aria-label="Gérer les catégories d'articles"] → accès à la page
 * - .filters-bar mat-form-field (label « Catégorie ») mat-select → filtre
 * - table[aria-label="Liste des articles"]              → tableau des articles
 * - tr[mat-row]                                         → ligne d'article
 * - td.col-title.article-title                          → titre d'un article
 * - td.col-type .type-badge                             → badge de catégorie
 * - .error-message[role="alert"]                        → erreur de la liste
 *
 * Page catégories (article-categories-page.component.ts) :
 * - .page-header h1                        → « Catégories d'articles »
 * - button.back-button                     → retour aux articles
 * - [data-testid="page-count"]             → « N catégories »
 * - button[aria-label="Créer une nouvelle catégorie"] → « Nouvelle catégorie »
 * - .error-state / [data-testid="error-retry"]        → erreur bloquante + réessai
 * - .empty-state / [data-testid="empty-action"]       → aucune catégorie
 * - table.categories-table                 → tableau des catégories
 * - tr[mat-row]                            → ligne de catégorie
 * - td.col-name                            → nom d'une catégorie
 * - button[aria-label^="Modifier "]        → édition d'une catégorie
 * - button[aria-label^="Supprimer "]       → suppression d'une catégorie
 * - .skeleton-table[role="status"]         → squelette de chargement
 *   (aria-label « Chargement en cours », porté par `<app-skeleton>`)
 *
 * Dialogue de catégorie (article-category-dialog.component.ts) :
 * - mat-dialog-container                       → l'unique overlay attendu
 * - h2[mat-dialog-title]                       → « Nouvelle / Modifier la catégorie »
 * - input[formcontrolname="name"]              → champ Nom
 * - [data-testid="form-submit"]                → Créer / Mettre à jour
 * - [data-testid="form-cancel"]                → Annuler
 *   (le pied partagé n'a ni `mat-dialog-close` ni bouton « Fermer » : ces deux
 *   sélecteurs, encore visés par l'ancienne spec, ne pouvaient que timeouter)
 *
 * Éditeur d'article (article-editor.component.html) :
 * - input#title / select#typeId / textarea#excerpt
 * - button[aria-label="Enregistrer l'article"]
 *
 * Fil d'Ariane (admin-header.component.ts) :
 * - nav.page-title .breadcrumb-link / .breadcrumb-current
 *
 * Dialogue de confirmation (confirm-dialog.component.ts) :
 * - mat-dialog-container button « Supprimer » / « Confirmer »
 *
 * Notification (AdminNotifier -> MatSnackBar) :
 * - simple-snack-bar                       → message de refus 409
 */

import { test, expect, Page, Route } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_CATEGORY = 'Catégorie E2E';
const RENAMED_CATEGORY = 'Catégorie E2E renommée';
const TEST_ARTICLE_TITLE = 'Article E2E Catégories';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function goToArticles(page: Page): Promise<void> {
  await page.goto('/admin/articles', { waitUntil: 'domcontentloaded' });
  await page
    .locator('.skeleton-table[role="status"]')
    .waitFor({ state: 'hidden', timeout: 20000 })
    .catch(() => {});
}

/** Ouvre la page des catégories depuis la liste des articles. */
async function openCategoriesPage(page: Page): Promise<void> {
  await goToArticles(page);
  await page.locator('button[aria-label="Gérer les catégories d\'articles"]').click();
  await expect(page).toHaveURL(/\/admin\/articles\/categories$/, { timeout: 10000 });
  await waitForCategoriesLoaded(page);
}

async function waitForCategoriesLoaded(page: Page): Promise<void> {
  await page
    .locator('.skeleton-table[role="status"]')
    .waitFor({ state: 'hidden', timeout: 20000 })
    .catch(() => {});
}

function categoryRow(page: Page, name: string) {
  return page.locator('tr[mat-row]').filter({ has: page.locator('td.col-name', { hasText: name }) });
}

/** Crée une catégorie via le dialogue, depuis la page des catégories. */
async function createCategory(page: Page, name: string): Promise<void> {
  await page.locator('button[aria-label="Créer une nouvelle catégorie"]').click();

  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible({ timeout: 10000 });
  await dialog.locator('input[formcontrolname="name"]').fill(name);
  await dialog.locator('[data-testid="form-submit"]').click();
  await expect(dialog).toBeHidden({ timeout: 15000 });
}

/** Confirme le dialogue de suppression. */
async function confirmDeletion(page: Page): Promise<void> {
  const dialog = page.locator('mat-dialog-container');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await dialog
    .locator('button')
    .filter({ hasText: /Supprimer|Confirmer/ })
    .last()
    .click();
}

/** Supprime la catégorie de test si elle traîne encore. */
async function cleanupCategory(page: Page, name: string): Promise<void> {
  await openCategoriesPage(page);
  const row = categoryRow(page, name);
  if (!(await row.isVisible().catch(() => false))) return;

  await row.locator(`button[aria-label="Supprimer ${name}"]`).click();
  await confirmDeletion(page);
  await expect(row).toBeHidden({ timeout: 10000 });
}

/** Supprime l'article de test si il traîne encore. */
async function cleanupArticle(page: Page, title: string): Promise<void> {
  await goToArticles(page);
  const row = page
    .locator('tr[mat-row]')
    .filter({ has: page.locator('td.article-title', { hasText: title }) });
  if (!(await row.isVisible().catch(() => false))) return;

  await row.locator(`button[aria-label="Supprimer ${title}"]`).click();
  await confirmDeletion(page);
  await expect(row).toBeHidden({ timeout: 10000 });
}

/** Locator du select de filtre par catégorie de la liste des articles. */
function typeFilter(page: Page) {
  return page
    .locator('.filters-bar mat-form-field')
    .filter({ hasText: 'Catégorie' })
    .locator('mat-select');
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : la dé-imbrication
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Catégories d’articles — la page routée', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) test.skip();
  });

  test('le bouton « Catégories » ouvre une page, plus un dialogue', async ({ page }) => {
    await openCategoriesPage(page);

    // Le dialogue montait un `mat-dialog-container` : il ne doit plus y en
    // avoir tant qu'aucun formulaire n'est demandé.
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    await expect(page.locator('.page-header h1')).toContainText("Catégories d'articles");
  });

  test('l’URL est partageable : un accès direct rend la même page', async ({ page }) => {
    await page.goto('/admin/articles/categories', { waitUntil: 'domcontentloaded' });
    await waitForCategoriesLoaded(page);

    await expect(page.locator('.page-header h1')).toContainText("Catégories d'articles", {
      timeout: 15000,
    });
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
  });

  test('le fil d’Ariane descend jusqu’à « Catégories »', async ({ page }) => {
    await openCategoriesPage(page);

    const trail = page.locator('nav.page-title');
    await expect(trail.locator('.breadcrumb-link', { hasText: 'Articles' })).toBeVisible();
    await expect(trail.locator('.breadcrumb-current')).toHaveText('Catégories');
  });

  test('le bouton de retour ramène à la liste des articles', async ({ page }) => {
    await openCategoriesPage(page);

    await page.locator('button.back-button').click();
    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 10000 });
  });

  test('le retour arrière du navigateur ramène à la liste', async ({ page }) => {
    await openCategoriesPage(page);

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 10000 });
  });

  test('le formulaire reste un dialogue, et il est le seul overlay à l’écran', async ({ page }) => {
    await openCategoriesPage(page);
    await page.locator('button[aria-label="Créer une nouvelle catégorie"]').click();

    // C'est tout l'objet de la migration : un seul overlay, jamais deux.
    await expect(page.locator('mat-dialog-container')).toHaveCount(1);
    await expect(page.locator('h2[mat-dialog-title]')).toContainText('Nouvelle catégorie');

    // `Échap` ferme le dialogue et rend la page — plus de modale résiduelle
    // derrière, qui était le symptôme de l'imbrication.
    await page.keyboard.press('Escape');
    await expect(page.locator('mat-dialog-container')).toHaveCount(0);
    await expect(page.locator('.page-header h1')).toContainText("Catégories d'articles");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : erreur de chargement bloquante et réessayable
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Catégories d’articles — erreur de chargement', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) test.skip();
  });

  test('une panne d’API rend un bandeau bloquant, pas un écran vide', async ({ page }) => {
    // Le dialogue affichait un snackbar de 3 secondes puis son état vide :
    // passé le délai, une panne se lisait « Aucune catégorie créée ».
    let failing = true;
    await page.route('**/api/article-types', (route: Route) => {
      if (failing && route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.continue();
    });

    await page.goto('/admin/articles/categories', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('.error-state')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.empty-state')).toHaveCount(0);
    await expect(page.locator('table.categories-table')).toHaveCount(0);
    await expect(page.locator('[data-testid="page-count"]')).toHaveCount(0);

    // Le réessai est proposé et il recharge réellement.
    failing = false;
    await page.locator('[data-testid="error-retry"]').click();
    await expect(page.locator('.error-state')).toHaveCount(0, { timeout: 15000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : parcours métier complet
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Catégories d’articles — cycle de vie', () => {
  test.beforeEach(async ({ page }) => {
    if (!(await isBackendAvailable(page))) {
      test.skip();
      return;
    }
    if (!(await loginAsAdmin(page))) test.skip();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    if ((await isBackendAvailable(page)) && (await loginAsAdmin(page))) {
      await cleanupArticle(page, TEST_ARTICLE_TITLE).catch(() => undefined);
      await cleanupCategory(page, RENAMED_CATEGORY).catch(() => undefined);
      await cleanupCategory(page, TEST_CATEGORY).catch(() => undefined);
    }
    await page.close();
  });

  test('crée une catégorie depuis la page', async ({ page }) => {
    await openCategoriesPage(page);
    await createCategory(page, TEST_CATEGORY);

    await expect(categoryRow(page, TEST_CATEGORY)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="page-count"]')).toContainText('catégorie');
  });

  test('la nouvelle catégorie apparaît dans le filtre de la liste des articles', async ({
    page,
  }) => {
    await goToArticles(page);
    await typeFilter(page).click();

    await expect(page.locator('mat-option', { hasText: TEST_CATEGORY })).toBeVisible({
      timeout: 10000,
    });
    await page.keyboard.press('Escape');
  });

  test('la catégorie est affectable à un article, et filtre la liste', async ({ page }) => {
    await page.goto('/admin/articles/new', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('input#title')).toBeVisible({ timeout: 15000 });

    await page.locator('input#title').fill(TEST_ARTICLE_TITLE);
    await page.locator('select#typeId').selectOption({ label: TEST_CATEGORY });
    await page.locator('textarea#excerpt').fill('Extrait E2E catégories.');
    await page.locator('button[aria-label="Enregistrer l\'article"]').click();

    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 20000 });

    const row = page
      .locator('tr[mat-row]')
      .filter({ has: page.locator('td.article-title', { hasText: TEST_ARTICLE_TITLE }) });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.locator('td.col-type')).toContainText(TEST_CATEGORY);

    // Le filtre par catégorie retient bien l'article.
    await typeFilter(page).click();
    await page.locator('mat-option', { hasText: TEST_CATEGORY }).click();
    await expect(row).toBeVisible({ timeout: 15000 });
  });

  test('la suppression d’une catégorie utilisée reste refusée', async ({ page }) => {
    await openCategoriesPage(page);
    await categoryRow(page, TEST_CATEGORY)
      .locator(`button[aria-label="Supprimer ${TEST_CATEGORY}"]`)
      .click();
    await confirmDeletion(page);

    await expect(
      page.locator('simple-snack-bar', {
        hasText: 'des articles utilisent cette catégorie',
      }),
    ).toBeVisible({ timeout: 10000 });
    await expect(categoryRow(page, TEST_CATEGORY)).toBeVisible();
  });

  test('renomme la catégorie depuis le dialogue d’édition', async ({ page }) => {
    await openCategoriesPage(page);
    await categoryRow(page, TEST_CATEGORY)
      .locator(`button[aria-label="Modifier ${TEST_CATEGORY}"]`)
      .click();

    const dialog = page.locator('mat-dialog-container');
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await expect(dialog.locator('h2[mat-dialog-title]')).toContainText('Modifier la catégorie');
    await dialog.locator('input[formcontrolname="name"]').fill(RENAMED_CATEGORY);
    await dialog.locator('[data-testid="form-submit"]').click();
    await expect(dialog).toBeHidden({ timeout: 15000 });

    await expect(categoryRow(page, RENAMED_CATEGORY)).toBeVisible({ timeout: 10000 });
  });

  test('supprime l’article puis la catégorie devenue libre', async ({ page }) => {
    await cleanupArticle(page, TEST_ARTICLE_TITLE);

    await openCategoriesPage(page);
    const row = categoryRow(page, RENAMED_CATEGORY);
    await row.locator(`button[aria-label="Supprimer ${RENAMED_CATEGORY}"]`).click();
    await confirmDeletion(page);

    await expect(row).toBeHidden({ timeout: 15000 });
  });
});
