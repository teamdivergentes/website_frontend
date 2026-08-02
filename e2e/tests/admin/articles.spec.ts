/**
 * Tests E2E — Page admin Articles (CRUD)
 *
 * Vérifie les opérations CRUD sur les articles :
 * affichage de la liste, création via l'éditeur dédié, édition, suppression,
 * toggles publié/featured inline et validation du formulaire.
 *
 * Les tests de mutation (create/edit/delete) utilisent test.describe.serial()
 * pour garantir l'ordre d'exécution et le nettoyage des données.
 *
 * Sélecteurs basés sur articles-list.component.html et article-editor.component.html :
 *
 * Liste (articles-list.component.html) :
 * - .articles-admin-page          → conteneur principal
 * - .page-header h1               → titre "Gestion des articles"
 * - .page-header button[aria-label="Créer un nouvel article"] → bouton "Nouvel article"
 * - .page-header button[aria-label*="Gérer les catégories"]   → lien vers la page catégories
 * - .table-container              → zone du tableau (chargée ou skeleton)
 * - table[aria-label="Liste des articles"] → tableau Material
 * - tr[mat-row]                   → ligne d'article
 * - td.col-title.article-title    → titre d'un article dans le tableau
 * - td.col-type .type-badge       → badge catégorie
 * - td.col-toggle mat-slide-toggle → toggle publié/featured
 * - td.col-actions button[aria-label^="Modifier"] → bouton modifier
 * - td.col-actions button[aria-label^="Supprimer"] → bouton supprimer
 * - .empty-state                  → état vide (aucun article)
 * - .skeleton-table[role="status"] → skeleton loading (aria-label « Chargement en cours »)
 * - .error-message[role="alert"]  → message d'erreur
 *
 * Éditeur (article-editor.component.html) — route /admin/articles/new et /admin/articles/edit/:id :
 * - .article-editor-page          → conteneur éditeur
 * - .page-header h1               → titre "Nouvel article" ou "Modifier l'article"
 * - .btn-back                     → bouton Retour
 * - button[aria-label="Enregistrer l'article"] → bouton Enregistrer
 * - button[aria-label="Supprimer l'article"]   → bouton Supprimer (mode édition)
 * - input#title                   → champ Titre (requis)
 * - input#slug                    → champ Slug (auto-généré)
 * - select#typeId                 → select Catégorie (requis)
 * - textarea#excerpt              → champ Extrait (optionnel)
 * - mat-slide-toggle[aria-label="Publier l'article"]          → toggle Publié (sidebar)
 * - mat-slide-toggle[aria-label="Mettre l'article en avant"]  → toggle Featured (sidebar)
 * - .alert-error[role="alert"]    → erreur globale formulaire
 * - .editor-container             → zone Editor.js
 *
 * Dialog de confirmation (ConfirmDialogComponent) :
 * - mat-dialog-container          → conteneur dialog Material
 * - mat-dialog-container button contenant "Confirmer" → bouton confirmation
 *
 * Catégories : la gestion est passée en page routée (/admin/articles/categories).
 * Ses tests vivent dans e2e/tests/admin/article-categories.spec.ts.
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

const TEST_ARTICLE_TITLE = 'Article E2E Test Playwright';
const UPDATED_ARTICLE_TITLE = 'Article E2E Modifié Playwright';
const TEST_ARTICLE_EXCERPT = 'Extrait de test généré par Playwright pour validation E2E.';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToArticles(page: Page): Promise<boolean> {
  await page.goto('/admin/articles', { waitUntil: 'domcontentloaded' });

  // Attendre que la page soit chargée : le skeleton disparaît OU le tableau
  // OU l'état vide est visible.
  // `<app-skeleton>` porte `aria-label="Chargement en cours"` : l'ancien
  // sélecteur « Chargement des articles en cours » n'existait plus et faisait
  // simplement expirer les 20 secondes avant de continuer.
  await page
    .locator('.skeleton-table[role="status"]')
    .waitFor({ state: 'hidden', timeout: 20000 })
    .catch(() => {});

  const loaded = await Promise.race([
    page
      .locator('table[aria-label="Liste des articles"]')
      .waitFor({ timeout: 15000 })
      .then(() => true)
      .catch(() => false),
    page
      .locator('.empty-state')
      .waitFor({ timeout: 15000 })
      .then(() => true)
      .catch(() => false),
    page
      .locator('.error-message')
      .waitFor({ timeout: 15000 })
      .then(() => true)
      .catch(() => false),
  ]);

  return loaded;
}

/**
 * Navigue vers /admin/articles/new, remplit les champs obligatoires
 * (titre + catégorie) et retourne true si la page s'est chargée correctement.
 * La catégorie est sélectionnée via le premier <option> disponible si aucune
 * valeur n'est fournie.
 */
async function openEditorAndFillRequired(
  page: Page,
  title: string,
  excerpt?: string,
): Promise<boolean> {
  await page.goto('/admin/articles/new', { waitUntil: 'domcontentloaded' });

  // Attendre que le formulaire soit prêt (skeleton disparu)
  const formReady = await page
    .locator('.article-editor-page input#title')
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false);

  if (!formReady) return false;

  // Remplir le titre
  const titleInput = page.locator('input#title');
  await expect(titleInput).toBeVisible({ timeout: 5000 });
  await titleInput.fill(title);

  // Attendre la génération automatique du slug
  await page.waitForTimeout(400);

  // Sélectionner la première catégorie disponible
  const typeSelect = page.locator('select#typeId');
  await expect(typeSelect).toBeVisible({ timeout: 5000 });
  const options = typeSelect.locator('option:not([disabled])');
  const optionCount = await options.count();

  if (optionCount === 0) {
    // Aucune catégorie disponible — le test sera incomplet
    return false;
  }

  const firstOptionValue = await options.first().getAttribute('value');
  if (firstOptionValue) {
    await typeSelect.selectOption(firstOptionValue);
  }

  // Remplir l'extrait (optionnel)
  if (excerpt) {
    const excerptArea = page.locator('textarea#excerpt');
    await expect(excerptArea).toBeVisible({ timeout: 5000 });
    await excerptArea.fill(excerpt);
  }

  return true;
}

/**
 * Cherche la ligne du tableau correspondant au titre donné et renvoie le locator.
 */
function getArticleRowByTitle(page: Page, title: string) {
  return page.locator('tr[mat-row]').filter({
    has: page.locator('td.article-title', { hasText: title }),
  });
}

/**
 * Supprime un article depuis la liste en cliquant sur son bouton Supprimer
 * et en confirmant le dialog.
 */
async function deleteArticleByTitle(page: Page, articleTitle: string): Promise<void> {
  const row = getArticleRowByTitle(page, articleTitle);
  const count = await row.count();
  if (count === 0) return;

  const deleteBtn = row.locator(`button[aria-label="Supprimer ${articleTitle}"]`);
  await deleteBtn.click();

  // Confirmer dans le dialog MatDialog
  const confirmBtn = page
    .locator('mat-dialog-container')
    .locator('button')
    .filter({ hasText: /Confirmer|Supprimer|Oui/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que la ligne disparaisse
  await expect(row).not.toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Affichage de la liste (lecture seule)
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Articles admin — Affichage', () => {
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

  test('la page articles charge après le login', async ({ page }) => {
    const loaded = await navigateToArticles(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/articles/);
  });

  test('le titre "Gestion des articles" est visible', async ({ page }) => {
    await navigateToArticles(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Gestion des articles');
  });

  test('le bouton "Nouvel article" est visible', async ({ page }) => {
    await navigateToArticles(page);
    const btn = page.locator('button[aria-label="Créer un nouvel article"]');
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('le bouton "Catégories" est visible', async ({ page }) => {
    await navigateToArticles(page);
    const btn = page.locator('button[aria-label*="Gérer les catégories"]');
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('le tableau des articles est affiché ou l\'état vide est visible', async ({ page }) => {
    await navigateToArticles(page);

    const hasTable = await page
      .locator('table[aria-label="Liste des articles"]')
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible().catch(() => false);

    expect(hasTable || hasEmpty).toBe(true);
  });

  test('les en-têtes de colonne sont présents (Titre, Catégorie, Publié, À la une, Créé le)', async ({
    page,
  }) => {
    await navigateToArticles(page);

    // La table est visible uniquement s'il y a des articles
    const hasTable = await page
      .locator('table[aria-label="Liste des articles"]')
      .isVisible()
      .catch(() => false);

    if (!hasTable) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucun article, état vide affiché — en-têtes non testables',
      });
      return;
    }

    const table = page.locator('table[aria-label="Liste des articles"]');
    await expect(table.locator('th').filter({ hasText: 'Titre' })).toBeVisible({ timeout: 5000 });
    await expect(table.locator('th').filter({ hasText: 'Catégorie' })).toBeVisible({
      timeout: 5000,
    });
    await expect(table.locator('th').filter({ hasText: 'Publié' })).toBeVisible({ timeout: 5000 });
    await expect(table.locator('th').filter({ hasText: 'À la une' })).toBeVisible({
      timeout: 5000,
    });
    await expect(table.locator('th').filter({ hasText: 'Créé le' })).toBeVisible({
      timeout: 5000,
    });
  });

  test('chaque article affiche titre, badge catégorie et date', async ({ page }) => {
    await navigateToArticles(page);

    const hasTable = await page
      .locator('table[aria-label="Liste des articles"]')
      .isVisible()
      .catch(() => false);

    if (!hasTable) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucun article dans la base — test ignoré',
      });
      return;
    }

    const firstRow = page.locator('tr[mat-row]').first();
    await expect(firstRow.locator('td.article-title')).toBeVisible({ timeout: 5000 });
    await expect(firstRow.locator('td.col-type .type-badge')).toBeVisible({ timeout: 5000 });
    await expect(firstRow.locator('td.col-date')).toBeVisible({ timeout: 5000 });
  });

  test('chaque article affiche les actions (toggle publié, toggle featured, modifier, supprimer)', async ({
    page,
  }) => {
    await navigateToArticles(page);

    const hasTable = await page
      .locator('table[aria-label="Liste des articles"]')
      .isVisible()
      .catch(() => false);

    if (!hasTable) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucun article — test ignoré',
      });
      return;
    }

    const firstRow = page.locator('tr[mat-row]').first();

    // Toggle "Publié"
    const publishedToggles = firstRow.locator('td.col-toggle mat-slide-toggle');
    await expect(publishedToggles.first()).toBeVisible({ timeout: 5000 });

    // Bouton "Mis en avant" (star icon button)
    await expect(
      firstRow.locator('td.col-toggle button[aria-label*="une"]'),
    ).toBeVisible({ timeout: 5000 });

    // Boutons modifier et supprimer
    await expect(
      firstRow.locator('td.col-actions button[aria-label^="Modifier"]'),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      firstRow.locator('td.col-actions button[aria-label^="Supprimer"]'),
    ).toBeVisible({ timeout: 5000 });
  });

  test('le skeleton de chargement disparaît avant l\'affichage du contenu', async ({ page }) => {
    await page.goto('/admin/articles', { waitUntil: 'domcontentloaded' });

    // Le skeleton peut apparaître brièvement — on attend sa disparition
    await page
      .locator('[role="status"][aria-label="Chargement des articles en cours"]')
      .waitFor({ state: 'hidden', timeout: 20000 })
      .catch(() => {});

    // Après chargement, le skeleton ne doit plus être visible
    const skeleton = page.locator('.skeleton-table[aria-hidden="true"]');
    const skeletonVisible = await skeleton.isVisible().catch(() => false);
    expect(skeletonVisible).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : CRUD complet — serial (Create → Edit → Delete)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Page Articles admin — CRUD complet', () => {
  let loggedIn = false;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      await page.close();
      return;
    }
    loggedIn = await loginAsAdmin(page);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp || !loggedIn) {
      test.skip();
      return;
    }
    await loginAsAdmin(page);
  });

  test('création : naviguer vers /admin/articles/new depuis le bouton "Nouvel article"', async ({
    page,
  }) => {
    await navigateToArticles(page);

    const newBtn = page.locator('button[aria-label="Créer un nouvel article"]');
    await expect(newBtn).toBeVisible({ timeout: 10000 });
    await newBtn.click();

    await expect(page).toHaveURL(/\/admin\/articles\/new/, { timeout: 10000 });

    // La page de l'éditeur doit être visible
    const editorPage = page.locator('.article-editor-page');
    await expect(editorPage).toBeVisible({ timeout: 10000 });

    // Le titre de page doit indiquer "Nouvel article"
    await expect(page.locator('.page-header h1')).toHaveText('Nouvel article', {
      timeout: 10000,
    });
  });

  test('création : remplir le formulaire et enregistrer un nouvel article', async ({ page }) => {
    const filled = await openEditorAndFillRequired(page, TEST_ARTICLE_TITLE, TEST_ARTICLE_EXCERPT);
    expect(filled).toBe(true);

    // Le slug doit avoir été auto-généré depuis le titre
    const slugInput = page.locator('input#slug');
    await expect(slugInput).not.toHaveValue('', { timeout: 5000 });

    // Cliquer sur Enregistrer
    const saveBtn = page.locator('button[aria-label="Enregistrer l\'article"]');
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Après sauvegarde réussie, redirection vers /admin/articles
    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 20000 });

    // Le nouvel article doit apparaître dans le tableau
    const newRow = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);
    await expect(newRow).toBeVisible({ timeout: 15000 });
  });

  test('l\'article créé affiche le bon titre dans le tableau', async ({ page }) => {
    await navigateToArticles(page);

    const row = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.locator('td.article-title')).toContainText(TEST_ARTICLE_TITLE);
  });

  test('l\'article créé est en statut brouillon (toggle publié décoché)', async ({ page }) => {
    await navigateToArticles(page);

    const row = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);
    await expect(row).toBeVisible({ timeout: 10000 });

    // Le toggle publié doit être non coché pour un article créé sans cocher "Publié"
    const publishedToggle = row.locator('td.col-toggle mat-slide-toggle').first();
    await expect(publishedToggle).toBeVisible({ timeout: 5000 });
    // Vérifier que le bouton input du toggle est non coché
    const toggleInput = publishedToggle.locator('input[type="checkbox"]');
    await expect(toggleInput).not.toBeChecked({ timeout: 5000 });
  });

  test('toggle publié : publier l\'article créé depuis la liste', async ({ page }) => {
    await navigateToArticles(page);

    const row = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);
    await expect(row).toBeVisible({ timeout: 10000 });

    const publishedToggle = row.locator('td.col-toggle mat-slide-toggle').first();
    const toggleInput = publishedToggle.locator('input[type="checkbox"]');

    // L'article est en brouillon — cliquer sur le toggle pour le publier
    const wasChecked = await toggleInput.isChecked().catch(() => false);
    await publishedToggle.click();

    // Attendre le snackbar de confirmation
    const snackbar = page.locator('simple-snack-bar');
    await expect(snackbar).toBeVisible({ timeout: 10000 });
    await expect(snackbar).toContainText(/publié|dépublié/);

    // L'état du toggle doit avoir changé
    if (wasChecked) {
      await expect(toggleInput).not.toBeChecked({ timeout: 5000 });
    } else {
      await expect(toggleInput).toBeChecked({ timeout: 5000 });
    }
  });

  test('édition : cliquer sur Modifier redirige vers l\'éditeur en mode édition', async ({
    page,
  }) => {
    await navigateToArticles(page);

    const row = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);
    await expect(row).toBeVisible({ timeout: 10000 });

    const editBtn = row.locator(`button[aria-label="Modifier ${TEST_ARTICLE_TITLE}"]`);
    await editBtn.click();

    // Redirection vers /admin/articles/edit/:id
    await expect(page).toHaveURL(/\/admin\/articles\/edit\/\d+/, { timeout: 10000 });

    // Le titre de page doit indiquer "Modifier l'article"
    await expect(page.locator('.page-header h1')).toContainText("Modifier l'article", {
      timeout: 10000,
    });
  });

  test('édition : les champs sont pré-remplis avec les données de l\'article', async ({
    page,
  }) => {
    await navigateToArticles(page);

    const row = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);
    await expect(row).toBeVisible({ timeout: 10000 });

    const editBtn = row.locator(`button[aria-label="Modifier ${TEST_ARTICLE_TITLE}"]`);
    await editBtn.click();

    await expect(page).toHaveURL(/\/admin\/articles\/edit\/\d+/, { timeout: 10000 });

    // Attendre que le skeleton de chargement disparaisse
    await page
      .locator('[role="status"][aria-label="Chargement de l\'article"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    // Vérifier que le titre est pré-rempli
    const titleInput = page.locator('input#title');
    await expect(titleInput).toHaveValue(TEST_ARTICLE_TITLE, { timeout: 10000 });

    // Vérifier que le slug est pré-rempli
    const slugInput = page.locator('input#slug');
    await expect(slugInput).not.toHaveValue('', { timeout: 5000 });
  });

  test('édition : modifier le titre et enregistrer', async ({ page }) => {
    await navigateToArticles(page);

    const row = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);
    await expect(row).toBeVisible({ timeout: 10000 });

    const editBtn = row.locator(`button[aria-label="Modifier ${TEST_ARTICLE_TITLE}"]`);
    await editBtn.click();

    await expect(page).toHaveURL(/\/admin\/articles\/edit\/\d+/, { timeout: 10000 });

    // Attendre le chargement complet
    await page
      .locator('[role="status"][aria-label="Chargement de l\'article"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    // Modifier le titre
    const titleInput = page.locator('input#title');
    await expect(titleInput).toBeVisible({ timeout: 10000 });
    await titleInput.clear();
    await titleInput.fill(UPDATED_ARTICLE_TITLE);

    // Enregistrer
    const saveBtn = page.locator('button[aria-label="Enregistrer l\'article"]');
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Redirection vers la liste
    await expect(page).toHaveURL(/\/admin\/articles$/, { timeout: 20000 });

    // L'article modifié doit apparaître avec le nouveau titre
    const updatedRow = getArticleRowByTitle(page, UPDATED_ARTICLE_TITLE);
    await expect(updatedRow).toBeVisible({ timeout: 15000 });
  });

  test('l\'ancien titre n\'est plus visible après l\'édition', async ({ page }) => {
    await navigateToArticles(page);

    const oldTitleCell = page.locator('td.article-title', { hasText: TEST_ARTICLE_TITLE });
    await expect(oldTitleCell).not.toBeVisible({ timeout: 5000 });
  });

  test('suppression : supprimer l\'article de test depuis la liste (nettoyage)', async ({
    page,
  }) => {
    await navigateToArticles(page);

    // Chercher le titre courant (modifié ou original si édition a échoué)
    const updatedRow = getArticleRowByTitle(page, UPDATED_ARTICLE_TITLE);
    const originalRow = getArticleRowByTitle(page, TEST_ARTICLE_TITLE);

    const updatedExists = await updatedRow.isVisible().catch(() => false);
    const originalExists = await originalRow.isVisible().catch(() => false);

    const targetTitle = updatedExists
      ? UPDATED_ARTICLE_TITLE
      : originalExists
        ? TEST_ARTICLE_TITLE
        : null;

    if (!targetTitle) {
      test.info().annotations.push({
        type: 'note',
        description: "Article de test non trouvé, déjà supprimé ou jamais créé.",
      });
      return;
    }

    await deleteArticleByTitle(page, targetTitle);

    // Vérifier que l'article n'est plus dans le tableau
    const deletedRow = getArticleRowByTitle(page, targetTitle);
    await expect(deletedRow).not.toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Validation du formulaire éditeur
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Articles admin — Validation formulaire', () => {
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
    // Naviguer directement vers l'éditeur de création
    await page.goto('/admin/articles/new', { waitUntil: 'domcontentloaded' });
    await page
      .locator('.article-editor-page input#title')
      .waitFor({ timeout: 15000 })
      .catch(() => {});
  });

  test('le bouton Enregistrer est désactivé si le titre est vide', async ({ page }) => {
    // Sans remplir le titre, le bouton doit être disabled (form invalide)
    const saveBtn = page.locator('button[aria-label="Enregistrer l\'article"]');
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });
  });

  test('une erreur de validation apparaît si le titre est touché puis vidé', async ({ page }) => {
    const titleInput = page.locator('input#title');
    await titleInput.fill('Titre temporaire');
    await titleInput.clear();
    await titleInput.blur();

    // Le message d'erreur doit apparaître
    const errorMsg = page.locator('span.error-text[role="alert"]', {
      hasText: 'Le titre est requis',
    });
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('le slug est auto-généré depuis le titre après une pause', async ({ page }) => {
    const titleInput = page.locator('input#title');
    await titleInput.fill('Mon Super Article de Test');

    // Attendre le debounce (300ms + marge)
    await page.waitForTimeout(500);

    const slugInput = page.locator('input#slug');
    await expect(slugInput).toHaveValue('mon-super-article-de-test', { timeout: 5000 });
  });

  test('le bouton Enregistrer est activé quand titre et catégorie sont remplis', async ({
    page,
  }) => {
    // Vérifier qu'une catégorie est disponible
    const typeSelect = page.locator('select#typeId');
    const options = typeSelect.locator('option:not([disabled])');
    const optionCount = await options.count();

    if (optionCount === 0) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucune catégorie disponible — test incomplet',
      });
      return;
    }

    // Remplir les champs requis
    await page.locator('input#title').fill('Article Validation Test');
    await page.waitForTimeout(400);

    const firstOptionValue = await options.first().getAttribute('value');
    if (firstOptionValue) {
      await typeSelect.selectOption(firstOptionValue);
    }

    const saveBtn = page.locator('button[aria-label="Enregistrer l\'article"]');
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
  });

  test('le bouton Retour redirige vers la liste des articles sans sauvegarde', async ({ page }) => {
    // Remplir partiellement le formulaire
    await page.locator('input#title').fill('Titre non sauvegardé');

    // Cliquer sur Retour
    const backBtn = page.locator('.btn-back');
    await expect(backBtn).toBeVisible({ timeout: 5000 });
    await backBtn.click();

    // Redirection vers /admin/articles
    await expect(page).toHaveURL(/\/admin\/articles/, { timeout: 10000 });
  });

  test('le select catégorie affiche un placeholder "Sélectionner une catégorie"', async ({
    page,
  }) => {
    const typeSelect = page.locator('select#typeId');
    await expect(typeSelect).toBeVisible({ timeout: 5000 });

    // L'option désactivée par défaut doit être présente
    const placeholder = typeSelect.locator('option[disabled]');
    await expect(placeholder).toHaveText('Sélectionner une catégorie', { timeout: 5000 });
  });

  test('le mode édition n\'est pas accessible sans ID valide dans l\'URL', async ({ page }) => {
    // Naviguer avec un ID invalide
    await page.goto('/admin/articles/edit/999999', { waitUntil: 'domcontentloaded' });

    // Soit une erreur est affichée, soit redirection vers la liste
    const hasError = await page
      .locator('.alert-error[role="alert"]')
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    const isRedirected = page.url().includes('/admin/articles') && !page.url().includes('edit');

    expect(hasError || isRedirected).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Categories — voir article-categories.spec.ts
// ─────────────────────────────────────────────────────────────────────────────
//
// Les tests du « dialog Categories » vivaient ici. La gestion des categories
// est devenue la page `/admin/articles/categories` (EPIC-41, feature 3) : ce
// n'est plus un dialogue, et les tests visaient de toute facon des selecteurs
// morts — `button[mat-button][mat-dialog-close]` et un bouton « Fermer » que le
// pied d'action partage ne porte plus depuis longtemps. Ils ne pouvaient que
// timeouter en silence. La non-regression est reprise, elargie, dans
// `e2e/tests/admin/article-categories.spec.ts`.
