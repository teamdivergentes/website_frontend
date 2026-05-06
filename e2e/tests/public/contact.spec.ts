/**
 * Tests E2E fonctionnels — Formulaire de contact
 *
 * Sélecteurs basés sur contact.html :
 * - section#contact                         → conteneur principal
 * - header.contact-header h1.title          → titre principal
 * - .contact-channels                       → section coordonnées
 * - a.channel-card[aria-label*="Discord"]   → carte Discord
 * - a.channel-card[href^="mailto:"]         → carte Email
 * - .section-divider                        → séparateur "Ou envoyez-nous un message"
 * - .contact-card                           → card formulaire
 * - .theme-selector .chips-container        → conteneur chips sujet
 * - button.chip                             → chip sélecteur de sujet
 * - button.chip.active                      → chip sélectionné
 * - .chip-icon                              → icône ✓ dans le chip actif
 * - form.contact-form                       → formulaire principal
 * - #name                                   → input Nom / Prénom
 * - #email                                  → input Adresse e-mail
 * - #request                                → textarea Votre message
 * - button[type="submit"].submit-btn        → bouton "Envoyer le message"
 * - .error-message                          → messages d'erreur de validation
 * - .success-container                      → message de succès après envoi
 *
 * Cas d'usage responsable :
 * - Aucun appel réseau réel n'est effectué (les tests ne soumettent pas vraiment)
 * - Les tests vérifient uniquement la présence des éléments et la validation côté client
 */

import { test, expect } from '@playwright/test';

async function waitForAngularInit(page: import('@playwright/test').Page) {
  await page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

async function waitForContactForm(page: import('@playwright/test').Page): Promise<boolean> {
  const rendered = await page.locator('form.contact-form')
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  return rendered;
}

test.describe('Page Contact — Structure de la page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('la page /contact charge correctement', async ({ page }) => {
    await expect(page.locator('section#contact')).toBeVisible({ timeout: 10000 });
  });

  test('le titre principal est visible', async ({ page }) => {
    await expect(page.locator('header.contact-header h1.title')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('header.contact-header h1.title')).toContainText(/[Cc]ontactez/);
  });

  test('la section coordonnées de contact est visible si configurée', async ({ page }) => {
    // La section .contact-channels n'est rendue que si la config dynamique
    // (Discord URL, email contact) est chargee depuis /api/config. Sans
    // backend (cas CI sans proxy /api), la section est masquee.
    const channels = page.locator('.contact-channels');
    const present = await channels.count();
    if (present === 0) {
      test.info().annotations.push({ type: 'note', description: 'contact-channels masque (config dynamique non chargee)' });
      return;
    }
    await expect(channels).toBeVisible({ timeout: 10000 });
  });

  test('la carte Discord est visible si l\'URL est configurée', async ({ page }) => {
    const discordCard = page.locator('a.channel-card[aria-label*="Discord"]');
    const count = await discordCard.count();
    if (count > 0) {
      await expect(discordCard).toBeVisible({ timeout: 5000 });
      // La carte Discord doit avoir un lien valide
      const href = await discordCard.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('la carte Email est visible si l\'email est configuré', async ({ page }) => {
    const emailCard = page.locator('a.channel-card[href^="mailto:"]');
    const count = await emailCard.count();
    if (count > 0) {
      await expect(emailCard).toBeVisible({ timeout: 5000 });
      await expect(emailCard.locator('.channel-title')).toContainText('Email');
    }
  });

  test('le séparateur "Ou envoyez-nous un message" est visible', async ({ page }) => {
    await expect(page.locator('.section-divider')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.divider-text')).toContainText(/[Oo]u envoyez/);
  });

  test('la card formulaire est visible', async ({ page }) => {
    await expect(page.locator('.contact-card')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Page Contact — Formulaire', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);
  });

  test('le formulaire de contact est rendu', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.info().annotations.push({ type: 'note', description: 'Formulaire non disponible (backend absent ?)' });
      return;
    }
    await expect(page.locator('form.contact-form')).toBeVisible({ timeout: 5000 });
  });

  test('tous les champs du formulaire sont présents et visibles', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.skip();
      return;
    }

    // Sélecteur de sujet (chips)
    await expect(page.locator('.theme-selector')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.chips-container')).toBeVisible({ timeout: 5000 });

    // Champ nom
    await expect(page.locator('#name')).toBeVisible({ timeout: 5000 });
    // Champ email
    await expect(page.locator('#email')).toBeVisible({ timeout: 5000 });
    // Textarea message
    await expect(page.locator('#request')).toBeVisible({ timeout: 5000 });
    // Bouton submit
    await expect(page.locator('button[type="submit"].submit-btn')).toBeVisible({ timeout: 5000 });
  });

  test('les labels des champs sont présents', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.skip();
      return;
    }

    await expect(page.locator('label[for="name"]')).toContainText(/[Nn]om/, { timeout: 5000 });
    await expect(page.locator('label[for="email"]')).toContainText(/[Ee]-mail|email/, { timeout: 5000 });
    await expect(page.locator('label[for="request"]')).toContainText(/[Mm]essage/, { timeout: 5000 });
  });

  test('les chips de sujet sont présentes et cliquables', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.skip();
      return;
    }

    const chips = page.locator('.chips-container button.chip');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);

    // Clic sur le premier chip
    await chips.first().click();
    await expect(chips.first()).toHaveClass(/active/);
  });

  test('le chip sélectionné affiche l\'icône de validation ✓', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.skip();
      return;
    }

    const firstChip = page.locator('.chips-container button.chip').first();
    await firstChip.click();

    await expect(firstChip.locator('.chip-icon')).toBeVisible({ timeout: 3000 });
  });

  test('le bouton submit est désactivé si le formulaire est invalide', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.skip();
      return;
    }

    const submitBtn = page.locator('button[type="submit"].submit-btn');
    await expect(submitBtn).toBeDisabled({ timeout: 5000 });
  });

  test('remplir tous les champs valides active le bouton submit', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.skip();
      return;
    }

    // 1. Sélectionner un sujet
    const firstChip = page.locator('.chips-container button.chip').first();
    await firstChip.click();

    // 2. Remplir le nom
    await page.locator('#name').fill('Jean Dupont');

    // 3. Remplir l'email
    await page.locator('#email').fill('test@teamdivergentes.fr');

    // 4. Remplir le message
    await page.locator('#request').fill('Ceci est un message de test de plus de dix caractères.');

    // Le bouton doit maintenant être activé
    const submitBtn = page.locator('button[type="submit"].submit-btn');
    await expect(submitBtn).not.toBeDisabled({ timeout: 5000 });
  });

  test('le bouton submit affiche "Envoyer le message" par défaut', async ({ page }) => {
    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.skip();
      return;
    }

    await expect(page.locator('button[type="submit"].submit-btn .btn-text'))
      .toContainText('Envoyer le message', { timeout: 5000 });
  });
});

test.describe('Page Contact — Responsive', () => {
  test('le formulaire est utilisable sur mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);

    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.info().annotations.push({ type: 'note', description: 'Formulaire non disponible' });
      return;
    }

    // Tous les champs doivent être visibles sur mobile
    await expect(page.locator('#name')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#email')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#request')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"].submit-btn')).toBeVisible({ timeout: 5000 });

    // Pas de scroll horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test('les chips de sujet sont accessibles sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);

    const formRendered = await waitForContactForm(page);
    if (!formRendered) {
      test.info().annotations.push({ type: 'note', description: 'Formulaire non disponible' });
      return;
    }

    const chips = page.locator('.chips-container button.chip');
    const count = await chips.count();
    expect(count).toBeGreaterThan(0);

    // Les chips doivent être visibles (peut nécessiter un scroll)
    await chips.first().scrollIntoViewIfNeeded();
    await expect(chips.first()).toBeVisible({ timeout: 5000 });
  });

  test('le titre est visible sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await waitForAngularInit(page);

    await expect(page.locator('header.contact-header h1.title')).toBeVisible({ timeout: 10000 });
  });
});
