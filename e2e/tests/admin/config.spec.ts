/**
 * Tests E2E — Page admin Configuration
 *
 * Vérifie la configuration du site via la page admin :
 * - Chargement de la page et des sections collapsibles
 * - Modification des champs de configuration (site_name, liens sociaux)
 * - Toggles de visibilité des pages publiques
 * - Sauvegarde des configurations
 *
 * Sélecteurs basés sur config-page.component.html et config-page.component.ts :
 * - .config-page                   → conteneur principal
 * - .page-header h1                → titre "Configuration du site"
 * - .form-section                  → section collapsible
 * - .form-section.open             → section ouverte
 * - .section-header                → en-tête cliquable de section
 * - .section-header h2             → titre de section
 * - .section-content               → contenu de section
 * - .section-content.open          → contenu visible
 * - .section-chevron               → indicateur ouvert/fermé
 * - #site_name                     → input nom du site
 * - #contact_email                 → input email de contact
 * - #youtube_link                  → input lien YouTube (requis)
 * - .toggle-group                  → groupe de toggles de visibilité
 * - .toggle-item input[type="checkbox"] → checkbox visibilité d'une page
 * - .toggle-label                  → label de la checkbox
 * - .form-actions button.btn-primary → bouton Enregistrer
 * - .form-actions button.btn-secondary → bouton Annuler
 * - .alert-success                 → message de succès
 * - .alert-error                   → message d'erreur
 * - .loading-state                 → état de chargement
 *
 * IDs des sections : general, social, contact, recruitment, seo, visibility
 * IDs des checkboxes de visibilité :
 *   page_shop_visible, page_contact_visible, page_equipes_visible,
 *   page_sponsors_visible, page_recrutement_visible, page_articles_visible
 */

import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function loginAsAdmin(page: Page): Promise<boolean> {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  const formVisible = await page.locator('form').waitFor({ timeout: 10000 }).then(() => true).catch(() => false);
  if (!formVisible) return false;

  await page.locator('#email').fill('admin@teamdivergentes.fr');
  await page.locator('#password').fill('admin123');
  await page.locator('button[type="submit"]').click();

  return page
    .waitForURL(/\/admin/, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
}

async function navigateToConfig(page: Page): Promise<boolean> {
  await page.goto('/admin/config', { waitUntil: 'domcontentloaded' });

  // Attendre que la page soit chargée (spinner ou formulaire)
  const loaded = await Promise.race([
    page.locator('form[formgroup]').waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    page.locator('.loading-state').waitFor({ timeout: 5000 })
      .then(() => page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }))
      .then(() => true)
      .catch(() => false),
  ]);

  // Attendre que le spinner disparaisse
  await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

  return loaded;
}

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

/**
 * Ouvre une section collapsible par son ID de section.
 * Les sections sont fermées par défaut.
 */
async function openSection(page: Page, sectionKey: 'general' | 'social' | 'notifications' | 'seo' | 'visibility'): Promise<void> {
  const sectionContent = page.locator(`#section-content-${sectionKey}`);
  const isOpen = await sectionContent.evaluate((el) => el.classList.contains('open'));

  if (!isOpen) {
    // Cliquer sur l'en-tête pour ouvrir la section
    const sectionHeader = page.locator(`.form-section`).filter({
      has: page.locator(`[aria-controls="section-content-${sectionKey}"]`)
    }).locator('.section-header');
    await sectionHeader.click();

    // Attendre que la section soit ouverte
    await expect(sectionContent).toHaveClass(/open/, { timeout: 5000 });
  }
}

/**
 * Récupère la valeur initiale d'un champ de config pour pouvoir la restaurer.
 */
async function getFieldValue(page: Page, fieldId: string): Promise<string> {
  const field = page.locator(`#${fieldId}`);
  return (await field.inputValue().catch(() => ''));
}

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Chargement de la page
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Config admin — Chargement', () => {
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

  test('la page config charge après le login', async ({ page }) => {
    const loaded = await navigateToConfig(page);
    expect(loaded).toBe(true);
    await expect(page).toHaveURL(/\/admin\/config/);
  });

  test('le titre "Configuration du site" est visible', async ({ page }) => {
    await navigateToConfig(page);
    const heading = page.locator('.page-header h1');
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toHaveText('Configuration du site');
  });

  test('le formulaire est affiché après le chargement', async ({ page }) => {
    await navigateToConfig(page);
    const form = page.locator('form');
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  // Cinq depuis l'EPIC-47 : « Notifications de contact » et « Notifications de
  // recrutement » ont fusionne dans une section « Notifications » unique, qui
  // porte aussi le canal boutique.
  test('les 5 sections collapsibles sont présentes', async ({ page }) => {
    await navigateToConfig(page);

    const sections = page.locator('.form-section');
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('les sections sont fermées par défaut', async ({ page }) => {
    await navigateToConfig(page);

    // Aucune section ne doit avoir la classe "open" au chargement
    const openSections = page.locator('.form-section.open');
    const openCount = await openSections.count();
    expect(openCount).toBe(0);
  });

  test('le bouton Enregistrer est visible dans les actions du formulaire', async ({ page }) => {
    await navigateToConfig(page);
    const saveBtn = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
  });

  test('le bouton Annuler est visible dans les actions du formulaire', async ({ page }) => {
    await navigateToConfig(page);
    const cancelBtn = page.locator('.form-actions button.btn-secondary').filter({ hasText: 'Annuler' });
    await expect(cancelBtn).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : Sections collapsibles
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Config admin — Sections collapsibles', () => {
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
    await navigateToConfig(page);
  });

  test('clic sur l\'en-tête "Informations générales" ouvre la section', async ({ page }) => {
    const sectionHeader = page.locator('[aria-controls="section-content-general"]');
    await sectionHeader.click();

    const sectionContent = page.locator('#section-content-general');
    await expect(sectionContent).toHaveClass(/open/, { timeout: 5000 });
  });

  test('la section "Informations générales" contient les champs site_name et contact_email', async ({ page }) => {
    await openSection(page, 'general');

    await expect(page.locator('#site_name')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#contact_email')).toBeVisible({ timeout: 5000 });
  });

  test('la section "Réseaux sociaux" contient les champs de liens', async ({ page }) => {
    await openSection(page, 'social');

    await expect(page.locator('#youtube_link')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#discord_url')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#tiktok_url')).toBeVisible({ timeout: 5000 });
  });

  test('la section "Visibilité des pages" contient les 6 toggles', async ({ page }) => {
    await openSection(page, 'visibility');

    const toggles = page.locator('.toggle-group .toggle-item');
    const count = await toggles.count();
    expect(count).toBe(6);
  });

  test('les labels des toggles de visibilité sont corrects', async ({ page }) => {
    await openSection(page, 'visibility');

    const labels = page.locator('.toggle-label');
    const textes = await labels.allTextContents();

    expect(textes).toContain('Boutique');
    expect(textes).toContain('Contact');
    expect(textes.some(t => t.includes('Équipes'))).toBe(true);
    expect(textes).toContain('Sponsors');
    expect(textes.some(t => t.includes('Recrutement'))).toBe(true);
    expect(textes).toContain('Articles');
  });

  test('re-clic sur l\'en-tête d\'une section ouverte la ferme', async ({ page }) => {
    // Ouvrir la section
    const sectionHeader = page.locator('[aria-controls="section-content-general"]');
    await sectionHeader.click();
    await expect(page.locator('#section-content-general')).toHaveClass(/open/, { timeout: 5000 });

    // Refermer la section
    await sectionHeader.click();
    await expect(page.locator('#section-content-general')).not.toHaveClass(/open/, { timeout: 5000 });
  });

  test('l\'en-tête de section a l\'attribut aria-expanded correct', async ({ page }) => {
    const sectionHeader = page.locator('[aria-controls="section-content-general"]');

    // Avant ouverture : aria-expanded="false"
    await expect(sectionHeader).toHaveAttribute('aria-expanded', 'false');

    await sectionHeader.click();

    // Après ouverture : aria-expanded="true"
    await expect(sectionHeader).toHaveAttribute('aria-expanded', 'true', { timeout: 5000 });
  });

  test('la section est accessible via la touche Entrée', async ({ page }) => {
    const sectionHeader = page.locator('[aria-controls="section-content-visibility"]');
    await sectionHeader.focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('#section-content-visibility')).toHaveClass(/open/, { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 3 : Toggles de visibilité des pages
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Config admin — Visibilité des pages', () => {
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
    await navigateToConfig(page);
    await openSection(page, 'visibility');
  });

  test('les checkboxes de visibilité sont des inputs de type checkbox', async ({ page }) => {
    const checkboxes = page.locator('.toggle-group .toggle-item input[type="checkbox"]');
    const count = await checkboxes.count();
    expect(count).toBe(7); // 6 pages initiales + En live (Twitch) ajouté EPIC-17
  });

  test('toggle la visibilité de la Boutique — décocher puis recocher', async ({ page }) => {
    const shopCheckbox = page.locator('.toggle-item').filter({ has: page.locator('.toggle-label', { hasText: 'Boutique' }) })
      .locator('input[type="checkbox"]');

    const wasChecked = await shopCheckbox.isChecked();

    // Changer l'état
    await shopCheckbox.click();
    await page.waitForTimeout(200); // laisser Angular traiter le signal

    const isNowChecked = await shopCheckbox.isChecked();
    expect(isNowChecked).toBe(!wasChecked);

    // Remettre dans l'état initial
    await shopCheckbox.click();
    await page.waitForTimeout(200);

    const isRestoredChecked = await shopCheckbox.isChecked();
    expect(isRestoredChecked).toBe(wasChecked);
  });

  test('toggle la visibilité du Contact — décocher puis recocher', async ({ page }) => {
    const contactCheckbox = page.locator('.toggle-item').filter({ has: page.locator('.toggle-label', { hasText: 'Contact' }) })
      .locator('input[type="checkbox"]');

    const wasChecked = await contactCheckbox.isChecked();

    await contactCheckbox.click();
    await page.waitForTimeout(200);

    const isNowChecked = await contactCheckbox.isChecked();
    expect(isNowChecked).toBe(!wasChecked);

    // Restaurer
    await contactCheckbox.click();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 4 : Modification et sauvegarde de configuration
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Config admin — Sauvegarde', () => {
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
    await navigateToConfig(page);
  });

  test('modifier site_name et sauvegarder affiche un message de succès', async ({ page }) => {
    await openSection(page, 'general');

    // Sauvegarder la valeur initiale pour la restaurer
    const originalValue = await getFieldValue(page, 'site_name');

    // Modifier le champ
    const siteNameInput = page.locator('#site_name');
    await siteNameInput.clear();
    await siteNameInput.fill('DVG Esport Test E2E');

    // Le champ youtube_link est requis — s'assurer qu'il est rempli
    await openSection(page, 'social');
    const youtubeLinkInput = page.locator('#youtube_link');
    const youtubeValue = await getFieldValue(page, 'youtube_link');
    if (!youtubeValue) {
      await youtubeLinkInput.fill('https://youtube.com/@test');
    }

    // Cliquer sur Enregistrer
    const saveBtn = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
    await saveBtn.click();

    // Un message de succès doit apparaître
    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible({ timeout: 15000 });
    await expect(successAlert).toContainText(/succès/i);

    // Restaurer la valeur originale
    await openSection(page, 'general');
    const siteNameInputRestore = page.locator('#site_name');
    await siteNameInputRestore.clear();
    await siteNameInputRestore.fill(originalValue || 'DVG Esport');

    const saveBtnRestore = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
    await saveBtnRestore.click();
    await page.locator('.alert-success').waitFor({ timeout: 15000 }).catch(() => {});
  });

  test('le bouton Annuler recharge les données depuis l\'API (reset)', async ({ page }) => {
    await openSection(page, 'general');

    // Modifier un champ
    const siteNameInput = page.locator('#site_name');
    const originalValue = await getFieldValue(page, 'site_name');
    await siteNameInput.clear();
    await siteNameInput.fill('Valeur Modifiée Non Sauvegardée');

    // Cliquer sur Annuler
    const cancelBtn = page.locator('.form-actions button.btn-secondary').filter({ hasText: 'Annuler' });
    await cancelBtn.click();

    // Le formulaire doit être rechargé depuis l'API (les sections se referment)
    await page.locator('.loading-state').waitFor({ timeout: 5000 }).catch(() => {});
    await page.locator('.loading-state').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});

    // Rouvrir la section pour vérifier la valeur
    await openSection(page, 'general');

    const restoredValue = await getFieldValue(page, 'site_name');
    // La valeur doit avoir été restaurée (différente de la valeur modifiée)
    expect(restoredValue).not.toBe('Valeur Modifiée Non Sauvegardée');
    // Elle doit correspondre à la valeur originale (ou être vide si le champ était vide)
    if (originalValue) {
      expect(restoredValue).toBe(originalValue);
    }
  });

  test('le bouton Enregistrer est désactivé si youtube_link est vide (champ requis)', async ({ page }) => {
    await openSection(page, 'social');

    // Vider le champ youtube_link (requis)
    const youtubeLinkInput = page.locator('#youtube_link');
    const currentValue = await getFieldValue(page, 'youtube_link');
    await youtubeLinkInput.clear();
    await youtubeLinkInput.blur();

    // Le formulaire est invalide → le bouton Enregistrer doit être désactivé
    const saveBtn = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
    await expect(saveBtn).toBeDisabled({ timeout: 5000 });

    // Restaurer la valeur pour ne pas laisser le formulaire dans un état invalide
    if (currentValue) {
      await youtubeLinkInput.fill(currentValue);
    }
  });

  test('modifier les toggles de visibilité et sauvegarder', async ({ page }) => {
    await openSection(page, 'visibility');

    // Lire l'état initial des checkboxes de visibilité
    const boutiqeCheckbox = page.locator('.toggle-item').filter({ has: page.locator('.toggle-label', { hasText: 'Boutique' }) })
      .locator('input[type="checkbox"]');

    const wasChecked = await boutiqeCheckbox.isChecked();

    // Changer l'état
    await boutiqeCheckbox.click();
    await page.waitForTimeout(200);

    // S'assurer que youtube_link est rempli (requis)
    await openSection(page, 'social');
    const youtubeLinkInput = page.locator('#youtube_link');
    const youtubeValue = await getFieldValue(page, 'youtube_link');
    if (!youtubeValue) {
      await youtubeLinkInput.fill('https://youtube.com/@test');
    }
    await openSection(page, 'general');
    const siteNameInput = page.locator('#site_name');
    const siteNameValue = await getFieldValue(page, 'site_name');
    if (!siteNameValue) {
      await siteNameInput.fill('DVG Esport');
    }

    // Sauvegarder
    const saveBtn = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
    await saveBtn.click();

    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible({ timeout: 15000 });

    // Restaurer l'état initial de la checkbox
    await openSection(page, 'visibility');
    const boutiqeCheckboxRestore = page.locator('.toggle-item').filter({ has: page.locator('.toggle-label', { hasText: 'Boutique' }) })
      .locator('input[type="checkbox"]');
    const isNowChecked = await boutiqeCheckboxRestore.isChecked();

    if (isNowChecked !== wasChecked) {
      await boutiqeCheckboxRestore.click();
      await page.waitForTimeout(200);

      const saveBtnRestore = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
      await saveBtnRestore.click();
      await page.locator('.alert-success').waitFor({ timeout: 15000 }).catch(() => {});
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 5 : Section SEO / Aperçu Discord
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Config admin — Section SEO', () => {
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
    await navigateToConfig(page);
    await openSection(page, 'seo');
  });

  test('la section SEO contient les champs og_title et og_description', async ({ page }) => {
    await expect(page.locator('#og_title')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#og_description')).toBeVisible({ timeout: 5000 });
  });

  test('l\'aperçu Discord est visible dans la section SEO', async ({ page }) => {
    const discordPreview = page.locator('.discord-preview');
    await expect(discordPreview).toBeVisible({ timeout: 5000 });
  });

  test('modifier og_title met à jour l\'aperçu Discord en temps réel', async ({ page }) => {
    const ogTitleInput = page.locator('#og_title');
    const testTitle = 'Test Aperçu Discord DVG';

    await ogTitleInput.clear();
    await ogTitleInput.fill(testTitle);

    // L'aperçu Discord doit se mettre à jour (binding Angular direct dans le template)
    const embedTitle = page.locator('.discord-embed-title');
    await expect(embedTitle).toContainText(testTitle, { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 6 : Section Notifications
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Page Config admin — Section Notifications', () => {
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
    await navigateToConfig(page);
    await openSection(page, 'notifications');
  });

  test('la section regroupe le SMTP et les trois canaux Discord', async ({ page }) => {
    await expect(page.locator('#contact_smtp_host')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#contact_smtp_port')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#contact_smtp_user')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#contact_smtp_pass')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#contact_discord_webhook')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#recruitment_discord_webhook')).toBeVisible({ timeout: 5000 });
    // Le canal boutique n'etait editable nulle part avant l'EPIC-47 : il fallait
    // ecrire `shop_discord_webhook` directement en base.
    await expect(page.locator('#shop_discord_webhook')).toBeVisible({ timeout: 5000 });
  });

  test('un webhook Discord invalide affiche une erreur de validation', async ({ page }) => {
    const webhookInput = page.locator('#contact_discord_webhook');
    await webhookInput.fill('https://exemple.com/pas-un-webhook-discord');
    await webhookInput.blur();

    // Cliquer sur Enregistrer pour déclencher la validation (ou juste vérifier en temps réel)
    const saveBtn = page.locator('.form-actions button.btn-primary').filter({ hasText: 'Enregistrer' });
    await saveBtn.click();

    // L'erreur de pattern doit apparaître
    const error = page.locator('.error-text').filter({ hasText: /webhook Discord invalide/i });
    await expect(error).toBeVisible({ timeout: 5000 });

    // Nettoyer le champ
    await webhookInput.clear();
  });
});
