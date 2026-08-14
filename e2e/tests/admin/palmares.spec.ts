/**
 * Tests E2E — Palmarès (admin → public)
 *
 * Parcours couverts :
 * 1. Parcours nominal CM→public :
 *    - Login admin → /admin/trophies → créer un trophée « E2E Cup »
 *    - Activer le toggle page_palmares_visible dans /admin/config
 *    - Vérifier que le trophée apparaît sur /structure/palmares
 * 2. Erreur de validation : champs requis vides → bouton Créer désactivé
 * 3. Nettoyage : suppression du trophée créé + remise du toggle config à false
 *
 * Sélecteurs basés sur trophies-admin.component.ts et trophy-dialog.component.ts :
 * - .trophies-admin-page              → conteneur principal de la page admin
 * - .page-header h1                   → titre "Palmarès"
 * - .page-header button               → bouton "Nouveau trophée"
 * - .trophies-table                   → tableau des trophées
 * - .trophies-table tbody tr          → ligne d'un trophée
 * - h2[mat-dialog-title]              → titre du dialog
 * - input[formcontrolname="competition"] → champ Compétition
 * - input[formcontrolname="placement"]   → champ Placement
 * - input[formcontrolname="date"]        → champ Date
 * - mat-checkbox[formcontrolname="featured"] → checkbox À la une
 * - mat-checkbox[formcontrolname="active"]   → checkbox Actif
 * - button[mat-raised-button][color="primary"] → bouton Créer / Mettre à jour
 * - button[mat-button] (Annuler)      → ferme le dialog sans sauvegarder
 * - mat-slide-toggle[attr.aria-label^="Mettre à la une"] → toggle inline à la une
 * - button[aria-label^="Supprimer "]  → bouton supprimer un trophée
 * - mat-dialog-container button[mat-raised-button] → bouton confirmer suppression
 *
 * Sélecteurs config :
 * - data-testid="config-toggle-page_palmares_visible" → checkbox de visibilité
 * - .form-actions button.btn-primary  → bouton Enregistrer config
 * - .alert-success                    → message de succès config
 *
 * Sélecteurs page publique palmares.html :
 * - section.palmares-page                              → conteneur principal
 * - .hero-monument .hero-competition                   → compétition du trophée hero (featured le plus récent)
 * - .mosaic-section .mosaic-grid .mosaic-card .mosaic-competition → cartes trophées featured (hors hero)
 * - .history .year-group .year-label                   → libellé de groupe par année
 * - .history .history-row                              → ligne d'historique
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, isBackendAvailable } from '../../helpers/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Constantes de test
// ─────────────────────────────────────────────────────────────────────────────

const TEST_TROPHY_COMPETITION = `e2e-E2E Cup-${Date.now()}`;
const TEST_TROPHY_PLACEMENT = 1;
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function navigateToAdminTrophies(page: Page): Promise<boolean> {
  await page.goto('/admin/trophies', { waitUntil: 'domcontentloaded' });

  const loaded = await Promise.race([
    page.locator('.trophies-table').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.empty-state').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.skeleton-table[role="status"]').waitFor({ state: 'hidden', timeout: 15000 }).then(() => true).catch(() => false),
  ]);

  await page
    .locator('.skeleton-table[role="status"]')
    .waitFor({ state: 'hidden', timeout: 15000 })
    .catch(() => {});

  return loaded;
}

async function navigateToConfig(page: Page): Promise<void> {
  await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
  await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

/**
 * Ouvre la section "Visibilité des pages" dans la config.
 */
async function openVisibilitySection(page: Page): Promise<void> {
  const sectionContent = page.locator('#section-content-visibility');
  const isOpen = await sectionContent.evaluate((el) => el.classList.contains('open')).catch(() => false);

  if (!isOpen) {
    const sectionHeader = page.locator('[aria-controls="section-content-visibility"]');
    await sectionHeader.click();
    await expect(sectionContent).toHaveClass(/open/, { timeout: 5000 });
  }
}

/**
 * Ouvre le dialog "Nouveau trophée" et remplit les champs minimum.
 * Retourne true si le dialog s'est ouvert.
 */
async function openCreateTrophyDialog(
  page: Page,
  competition: string,
  placement: number,
  date: string,
  featured = false,
): Promise<boolean> {
  const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau trophée' });
  await expect(createBtn).toBeVisible({ timeout: 10000 });
  await createBtn.click();

  const dialogTitle = page.locator('h2[mat-dialog-title]');
  const dialogOpened = await dialogTitle
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!dialogOpened) return false;

  await expect(dialogTitle).toContainText('Nouveau trophée');

  // Compétition
  const competitionInput = page.locator('mat-dialog-container input[formcontrolname="competition"]');
  await expect(competitionInput).toBeVisible({ timeout: 5000 });
  await competitionInput.fill(competition);

  // Placement
  const placementInput = page.locator('mat-dialog-container input[formcontrolname="placement"]');
  await placementInput.clear();
  await placementInput.fill(String(placement));

  // Date
  const dateInput = page.locator('mat-dialog-container input[formcontrolname="date"]');
  await dateInput.fill(date);

  // Checkbox "À la une"
  if (featured) {
    const featuredCheckbox = page.locator('mat-dialog-container mat-checkbox').filter({ hasText: 'À la une' });
    const isChecked = await featuredCheckbox.locator('input[type="checkbox"]').isChecked().catch(() => false);
    if (!isChecked) {
      await featuredCheckbox.click();
    }
  }

  return true;
}

/**
 * Supprime un trophée par son nom de compétition depuis la table admin.
 */
async function deleteTrophyByCompetition(page: Page, competition: string): Promise<void> {
  const row = page.locator('.trophies-table tbody tr').filter({
    has: page.locator('td strong', { hasText: competition }),
  });

  const count = await row.count();
  if (count === 0) return;

  const deleteBtn = row.locator(`button[aria-label="Supprimer ${competition}"]`);
  await deleteBtn.click();

  // Confirmer dans le dialog de suppression
  const confirmBtn = page
    .locator('mat-dialog-container button[mat-raised-button]')
    .filter({ hasText: /Supprimer|Confirmer/ })
    .last();
  await expect(confirmBtn).toBeVisible({ timeout: 5000 });
  await confirmBtn.click();

  // Attendre que la ligne disparaisse
  await expect(row).not.toBeVisible({ timeout: 10000 });
}

/**
 * Désactive le toggle page_palmares_visible et sauvegarde.
 * Utilisé en nettoyage pour remettre l'état initial.
 */
async function disablePalmaresVisibility(page: Page): Promise<void> {
  await navigateToConfig(page);
  await openVisibilitySection(page);

  const toggle = page.locator('[data-testid="config-toggle-page_palmares_visible"]');
  const isChecked = await toggle.isChecked().catch(() => false);

  if (isChecked) {
    await toggle.click();
    await page.waitForTimeout(200); // laisser Angular traiter le signal
  }

  // S'assurer que youtube_link est rempli (requis pour la sauvegarde)
  const socialSection = page.locator('#section-content-social');
  const isSocialOpen = await socialSection.evaluate((el) => el.classList.contains('open')).catch(() => false);
  if (!isSocialOpen) {
    const socialHeader = page.locator('[aria-controls="section-content-social"]');
    await socialHeader.click();
    await expect(socialSection).toHaveClass(/open/, { timeout: 5000 });
  }
  const youtubeLinkInput = page.locator('#youtube_link');
  const youtubeValue = await youtubeLinkInput.inputValue().catch(() => '');
  if (!youtubeValue) {
    await youtubeLinkInput.fill('https://youtube.com/@teamdivergentes');
  }

  const saveBtn = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
  await saveBtn.click();
  await page.locator('.alert-success').waitFor({ timeout: 15000 }).catch(() => {});
}

/**
 * Lit l'état réel de `page_palmares_visible` dans la configuration publique.
 *
 * Le palmarès est masqué par défaut : quand il l'est, `TeamDetailComponent`
 * n'interroge plus `/api/trophies` et ne rend plus `app-team-honours`. Une spec
 * qui décrit ce bloc n'a alors rien à vérifier et doit se sauter.
 */
async function estPalmaresActif(page: Page): Promise<boolean> {
  const reponse = await page.request.get('/api/config');
  if (!reponse.ok()) return false;
  const configs = (await reponse.json()) as { key: string; value: string }[];
  return configs.some(
    config => config.key === 'page_palmares_visible' && config.value === 'true',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Chargement de la page admin /admin/trophies
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Trophées admin — Affichage', () => {
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

  test('la page /admin/trophies se charge après le login', async ({ page }) => {
    const loaded = await navigateToAdminTrophies(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/trophies/);
  });

  test('le titre "Palmarès" est visible', async ({ page }) => {
    await navigateToAdminTrophies(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toContainText('Palmarès');
  });

  test('le bouton "Nouveau trophée" est visible', async ({ page }) => {
    await navigateToAdminTrophies(page);
    const btn = page.locator('.page-header button').filter({ hasText: 'Nouveau trophée' });
    await expect(btn).toBeVisible({ timeout: 10000 });
  });

  test('la table ou l\'état vide est affiché après le chargement', async ({ page }) => {
    await navigateToAdminTrophies(page);

    const hasTable = await page.locator('.trophies-table').isVisible().catch(() => false);
    const hasEmpty = await page.locator('.empty-state').isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : Validation du formulaire — erreur si champs requis vides
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Trophées admin — Validation du formulaire', () => {
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
    await navigateToAdminTrophies(page);
  });

  test('le bouton Créer est désactivé si la compétition est vide', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau trophée' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Vider le champ compétition (il est vide par défaut au premier chargement)
    const competitionInput = page.locator('mat-dialog-container input[formcontrolname="competition"]');
    await expect(competitionInput).toBeVisible({ timeout: 5000 });
    // S'assurer qu'il est bien vide
    await competitionInput.clear();

    // Vider aussi la date pour être sûr que le formulaire est invalide
    const dateInput = page.locator('mat-dialog-container input[formcontrolname="date"]');
    await dateInput.clear();
    await dateInput.blur();

    // Le bouton Créer doit être désactivé (form.invalid)
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Créer|Enregistrement/ });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('le bouton Créer est désactivé si le placement est 0 (invalide)', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau trophée' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir la compétition et la date (champs requis)
    const competitionInput = page.locator('mat-dialog-container input[formcontrolname="competition"]');
    await competitionInput.fill('Compétition test validation');

    const dateInput = page.locator('mat-dialog-container input[formcontrolname="date"]');
    await dateInput.fill(TODAY);

    // Mettre placement à 0 (valeur interdite : min=1)
    const placementInput = page.locator('mat-dialog-container input[formcontrolname="placement"]');
    await placementInput.clear();
    await placementInput.fill('0');
    await placementInput.blur();

    // Le bouton Créer doit être désactivé
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Créer|Enregistrement/ });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  });

  test('une erreur de validation apparaît si la compétition est touchée puis vidée', async ({ page }) => {
    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau trophée' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    const competitionInput = page.locator('mat-dialog-container input[formcontrolname="competition"]');
    await competitionInput.fill('quelque chose');
    await competitionInput.clear();
    await competitionInput.blur();

    // L'erreur "obligatoire" doit apparaître
    const error = page.locator('mat-dialog-container mat-error').filter({ hasText: /obligatoire/ });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Fermer le dialog
    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();
  });

  test('Annuler dans le dialog ne crée pas de trophée', async ({ page }) => {
    const countBefore = await page.locator('.trophies-table tbody tr').count().catch(() => 0);

    const createBtn = page.locator('.page-header button').filter({ hasText: 'Nouveau trophée' });
    await createBtn.click();

    await page.locator('h2[mat-dialog-title]').waitFor({ timeout: 10000 });

    // Remplir partiellement
    await page
      .locator('mat-dialog-container input[formcontrolname="competition"]')
      .fill('Trophée non sauvegardé E2E');

    const cancelBtn = page.locator('mat-dialog-container button[mat-button]').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });

    const countAfter = await page.locator('.trophies-table tbody tr').count().catch(() => 0);
    expect(countAfter).toBe(countBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Parcours nominal CM→public (serial : Create → Config → Public → Cleanup)
// ─────────────────────────────────────────────────────────────────────────────

test.describe.serial('Palmarès — parcours nominal admin→public', () => {
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

  test('création : ouvrir le dialog et créer le trophée E2E Cup', async ({ page }) => {
    await navigateToAdminTrophies(page);

    const filled = await openCreateTrophyDialog(
      page,
      TEST_TROPHY_COMPETITION,
      TEST_TROPHY_PLACEMENT,
      TODAY,
      true, // featured = true + date du jour → devient le trophée hero (.hero-monument)
    );
    expect(filled).toBe(true);

    // Cliquer sur "Créer"
    const saveBtn = page
      .locator('mat-dialog-container button[mat-raised-button][color="primary"]')
      .filter({ hasText: /Créer|Enregistrement/ });
    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    // Le dialog se ferme
    await page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 15000 });

    // Le trophée doit apparaître dans la table
    const newRow = page.locator('.trophies-table tbody tr').filter({
      has: page.locator('td strong', { hasText: TEST_TROPHY_COMPETITION }),
    });
    await expect(newRow).toBeVisible({ timeout: 15000 });
  });

  test('la ligne du trophée créé affiche le bon nom de compétition', async ({ page }) => {
    await navigateToAdminTrophies(page);

    const row = page.locator('.trophies-table tbody tr').filter({
      has: page.locator('td strong', { hasText: TEST_TROPHY_COMPETITION }),
    });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.locator('td strong')).toContainText(TEST_TROPHY_COMPETITION);
  });

  test('config : activer le toggle page_palmares_visible et sauvegarder', async ({ page }) => {
    await navigateToConfig(page);
    await openVisibilitySection(page);

    const toggle = page.locator('[data-testid="config-toggle-page_palmares_visible"]');
    const isChecked = await toggle.isChecked().catch(() => false);

    if (!isChecked) {
      await toggle.click();
      await page.waitForTimeout(200); // laisser Angular traiter le signal
    }

    // S'assurer que youtube_link est rempli (champ requis du formulaire config)
    const socialSection = page.locator('#section-content-social');
    const isSocialOpen = await socialSection.evaluate((el) => el.classList.contains('open')).catch(() => false);
    if (!isSocialOpen) {
      const socialHeader = page.locator('[aria-controls="section-content-social"]');
      await socialHeader.click();
      await expect(socialSection).toHaveClass(/open/, { timeout: 5000 });
    }
    const youtubeLinkInput = page.locator('#youtube_link');
    const youtubeValue = await youtubeLinkInput.inputValue().catch(() => '');
    if (!youtubeValue) {
      await youtubeLinkInput.fill('https://youtube.com/@teamdivergentes');
    }

    // Sauvegarder
    const saveBtn = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
    await saveBtn.click();

    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible({ timeout: 15000 });
    await expect(successAlert).toContainText(/succès/i);

    // Vérifier que le toggle est bien coché après sauvegarde
    await openVisibilitySection(page);
    const toggleAfter = page.locator('[data-testid="config-toggle-page_palmares_visible"]');
    await expect(toggleAfter).toBeChecked({ timeout: 5000 });
  });

  test('page publique : /structure/palmares affiche le trophée à la une', async ({ page }) => {
    await page.goto('/structure/palmares', { waitUntil: 'domcontentloaded' });

    // Attendre que le skeleton disparaisse
    await page.locator('[role="status"][aria-label="Chargement du palmarès"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    // Le conteneur principal doit être visible
    const palmares = page.locator('section.palmares-page');
    await expect(palmares).toBeVisible({ timeout: 15000 });

    // Notre trophée E2E Cup est featured : il apparaît soit en hero (featured le plus
    // récent, date du jour), soit dans la mosaïque des autres featured.
    const heroMatch = page.locator('.hero-monument .hero-competition', {
      hasText: TEST_TROPHY_COMPETITION,
    });
    const mosaicMatch = page.locator('.mosaic-section .mosaic-card .mosaic-competition', {
      hasText: TEST_TROPHY_COMPETITION,
    });
    await expect(heroMatch.or(mosaicMatch).first()).toBeVisible({ timeout: 15000 });
  });

  test('page publique : /structure/palmares affiche une section historique (.year-label)', async ({ page }) => {
    await page.goto('/structure/palmares', { waitUntil: 'domcontentloaded' });

    await page.locator('[role="status"][aria-label="Chargement du palmarès"]')
      .waitFor({ state: 'hidden', timeout: 15000 })
      .catch(() => {});

    // Le groupe d'années doit être visible
    const yearLabel = page.locator('.history .year-group .year-label');
    await expect(yearLabel.first()).toBeVisible({ timeout: 15000 });
  });

  test('nettoyage : supprimer le trophée E2E créé', async ({ page }) => {
    await navigateToAdminTrophies(page);
    await deleteTrophyByCompetition(page, TEST_TROPHY_COMPETITION);

    // Le trophée ne doit plus apparaître dans la table
    const deletedRow = page.locator('.trophies-table tbody tr').filter({
      has: page.locator('td strong', { hasText: TEST_TROPHY_COMPETITION }),
    });
    await expect(deletedRow).not.toBeVisible({ timeout: 10000 });
  });

  test('nettoyage : désactiver le toggle page_palmares_visible', async ({ page }) => {
    await disablePalmaresVisibility(page);

    // Vérifier que le toggle est bien décoché
    await openVisibilitySection(page);
    const toggle = page.locator('[data-testid="config-toggle-page_palmares_visible"]');
    await expect(toggle).not.toBeChecked({ timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Toggle « à la une » inline dans la table admin
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Trophées admin — Toggle à la une', () => {
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
    await navigateToAdminTrophies(page);
  });

  test('chaque ligne de trophée dans la table affiche un toggle "À la une"', async ({ page }) => {
    if (!(await page.locator('.trophies-table').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucun trophée dans la base, test ignoré',
      });
      return;
    }

    const firstRow = page.locator('.trophies-table tbody tr').first();
    const toggle = firstRow.locator('mat-slide-toggle');
    await expect(toggle).toBeVisible({ timeout: 5000 });
  });

  test('le toggle "À la une" a un aria-label descriptif', async ({ page }) => {
    if (!(await page.locator('.trophies-table').isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucun trophée dans la base, test ignoré',
      });
      return;
    }

    const firstToggle = page.locator('.trophies-table tbody tr').first().locator('mat-slide-toggle');
    const ariaLabel = await firstToggle.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Mettre à la une .+/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 5 : Badges trophées sur la page équipe publique
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Équipe — Badges trophées', () => {
  test('le bloc app-team-honours reflète fidèlement les trophées réels de l\'équipe', async ({ page }) => {
    const backendUp = await isBackendAvailable(page);
    if (!backendUp) {
      test.skip();
      return;
    }

    // Palmarès désactivé : ni appel /api/trophies ni bloc rendu, par conception.
    if (!(await estPalmaresActif(page))) {
      test.skip();
      return;
    }

    await page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });

    // Attendre que les équipes se chargent
    await page.waitForFunction(() => {
      const equipes = document.querySelector('.equipes-section, .empty-state, .error-state');
      return equipes !== null;
    }, { timeout: 15000 });

    const hasEquipes = await page.locator('.equipes-section').isVisible().catch(() => false);
    if (!hasEquipes) {
      test.info().annotations.push({
        type: 'note',
        description: 'Aucune équipe disponible, test ignoré',
      });
      return;
    }

    // Vérité terrain : on capture la véritable réponse GET /api/trophies?teamId=…
    // déclenchée par TeamDetailComponent au chargement, plutôt que de brancher sur
    // la simple présence/absence d'un sélecteur CSS. Ainsi, si app-team-honours
    // cesse de se rendre alors que l'API renvoie des trophées, le test échoue
    // franchement au lieu de glisser silencieusement dans la branche "pas de
    // trophée" (c'est exactement ce qui s'est produit avec l'ancien sélecteur
    // .team-trophies, devenu mort après le passage à app-team-honours).
    const trophiesResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/trophies?teamId=') && response.request().method() === 'GET',
      { timeout: 15000 },
    );

    // Naviguer vers le détail de la première équipe
    const firstCard = page.locator('a.team-card').first();
    await firstCard.click();
    await page.waitForLoadState('domcontentloaded');

    await page.waitForFunction(() => {
      return document.querySelector('section.team-detail-page') !== null ||
             document.querySelector('.error-state') !== null;
    }, { timeout: 15000 });

    const hasDetail = await page.locator('section.team-detail-page').isVisible().catch(() => false);
    if (!hasDetail) {
      test.info().annotations.push({
        type: 'note',
        description: 'Détail équipe non chargé, test ignoré',
      });
      return;
    }

    // Échec franc (pas de .catch) si l'appel n'a jamais lieu : TeamDetailComponent
    // doit toujours interroger /api/trophies dès qu'une équipe est chargée.
    const trophiesResponse = await trophiesResponsePromise;
    if (!trophiesResponse.ok()) {
      test.info().annotations.push({
        type: 'note',
        description: `API trophées a répondu ${trophiesResponse.status()}, test ignoré (hors périmètre de cette vérification)`,
      });
      return;
    }
    const teamTrophies = (await trophiesResponse.json()) as unknown[];

    const honoursSection = page.locator('.team-honours');

    if (teamTrophies.length > 0) {
      // Des trophées existent réellement pour cette équipe : app-team-honours DOIT
      // s'afficher, avec au moins une ligne et sa pastille de rang.
      await expect(honoursSection).toBeVisible({ timeout: 5000 });

      const rows = honoursSection.locator('.team-honours__row');
      const rowCount = await rows.count();
      expect(rowCount).toBeGreaterThan(0);
      expect(rowCount).toBeLessThanOrEqual(4); // MAX_LIGNES côté composant

      await expect(rows.first().locator('.team-honours__rank')).toBeVisible();

      // Le lien "voir tout le palmarès" n'apparaît qu'au-delà de 4 trophées
      const moreLink = honoursSection.locator('.team-honours__more');
      if (teamTrophies.length > 4) {
        await expect(moreLink).toBeVisible();
        const href = await moreLink.getAttribute('href');
        expect(href).toContain('/structure/palmares');
      } else {
        await expect(moreLink).toHaveCount(0);
      }
    } else {
      // Vérité terrain confirmée par l'API : aucun trophée pour cette équipe.
      // app-team-honours ne doit alors rien rendre — échec franc si présent.
      await expect(honoursSection).toHaveCount(0);
      test.info().annotations.push({
        type: 'note',
        description:
          "Aucun trophée associé à la première équipe (confirmé par /api/trophies), app-team-honours ne rend rien : comportement attendu",
      });
    }
  });
});
