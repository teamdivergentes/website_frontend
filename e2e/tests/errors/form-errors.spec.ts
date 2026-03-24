/**
 * Tests E2E négatifs : Validation des formulaires
 *
 * Vérifie que les formulaires affichent les messages d'erreur appropriés
 * lorsque l'utilisateur soumet des données invalides ou manquantes.
 *
 * Formulaires couverts :
 * 1. Formulaire de login (ReactiveFormsModule, Validators.required + Validators.email)
 * 2. Formulaire de contact (TemplateDrivenForms, FormsModule, minlength, required, email)
 *
 * Messages d'erreur extraits des templates Angular :
 * - Login : "L'email est requis", "Email invalide", "Le mot de passe est requis"
 * - Contact nom : "Minimum 2 caractères requis"
 * - Contact email : "Adresse e-mail invalide"
 * - Contact message : "Minimum 10 caractères requis"
 * - Contact sujet manquant : "Veuillez sélectionner un sujet pour votre demande"
 */

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 1 : Formulaire de login
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Formulaire de login - validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    // Attendre que le formulaire Angular soit disponible
    await page.locator('form').waitFor({ timeout: 10000 });
  });

  test('soumettre sans rien remplir → le bouton est désactivé (formulaire invalide)', async ({ page }) => {
    // Le composant Angular désactive le bouton quand loginForm.invalid
    // [disabled]="loading() || loginForm.invalid"
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Tenter un clic forcé ne doit pas soumettre le formulaire (onSubmit() retourne si invalid)
    await submitBtn.click({ force: true });
    await expect(page).toHaveURL(new RegExp('/auth/login'));
  });

  test('toucher le champ email puis le quitter → affiche "L\'email est requis"', async ({ page }) => {
    // Interaction minimale : focus puis blur sans saisir de valeur
    const emailInput = page.locator('#email');
    await emailInput.focus();
    await emailInput.blur();

    // Angular Angular control: hasError('required') && touched
    await expect(page.locator('.error-message').filter({ hasText: "L'email est requis" }))
      .toBeVisible({ timeout: 3000 });
  });

  test('email sans @ → affiche "Email invalide"', async ({ page }) => {
    await page.locator('#email').fill('ceci-nest-pas-un-email');
    await page.locator('#email').blur();

    await expect(page.locator('.error-message').filter({ hasText: 'Email invalide' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('email "a@b" (tld manquant) → affiche "Email invalide"', async ({ page }) => {
    // Validators.email d'Angular est strict sur le format
    await page.locator('#email').fill('a@b');
    await page.locator('#email').blur();

    await expect(page.locator('.error-message').filter({ hasText: 'Email invalide' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('toucher le champ password puis le quitter → affiche "Le mot de passe est requis"', async ({ page }) => {
    // Remplir l'email d'abord pour isoler l'erreur password
    await page.locator('#email').fill('valid@email.com');
    const passwordInput = page.locator('#password');
    await passwordInput.focus();
    await passwordInput.blur();

    await expect(page.locator('.error-message').filter({ hasText: 'Le mot de passe est requis' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('email valide + password vide → bouton toujours désactivé', async ({ page }) => {
    await page.locator('#email').fill('valid@email.com');
    // Ne pas remplir le password
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('email vide + password rempli → bouton toujours désactivé', async ({ page }) => {
    await page.locator('#password').fill('monmotdepasse');
    // Email reste vide
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('les deux champs valides → bouton activé', async ({ page }) => {
    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('monmotdepasse');

    // Le formulaire est valide → bouton activé (même si le backend va refuser)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).not.toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Groupe 2 : Formulaire de contact
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Formulaire de contact - validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    // Attendre que l'app soit initialisée (APP_INITIALIZER charge la config)
    await page.locator('app-root').waitFor({ timeout: 10000 });
    // Attendre que le formulaire contact soit rendu
    const formRendered = await page.locator('form.contact-form')
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (!formRendered) {
      // Si la page contact n'est pas rendue (backend absent), skip le test
      test.skip();
    }
  });

  test('soumettre sans sujet sélectionné → affiche "Veuillez sélectionner un sujet"', async ({ page }) => {
    // Remplir les autres champs pour que seul le sujet manque
    await page.locator('#name').fill('Jean Dupont');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#request').fill('Voici mon message de test de plus de dix caractères.');

    // Soumettre sans sélectionner de chip/sujet
    await page.locator('button[type="submit"]').click();

    // Le template vérifie selectedGameCtrl.invalid && contactForm.submitted
    // Message : "Veuillez sélectionner un sujet pour votre demande"
    await expect(page.locator('.error-message').filter({
      hasText: 'Veuillez sélectionner un sujet pour votre demande'
    })).toBeVisible({ timeout: 3000 });
  });

  test('champ nom trop court (1 caractère) → affiche "Minimum 2 caractères requis"', async ({ page }) => {
    // Remplir le nom avec un seul caractère (minlength="2" dans le template)
    await page.locator('#name').fill('A');
    await page.locator('#name').blur();

    // Angular template-driven: nameCtrl.invalid && nameCtrl.touched
    await expect(page.locator('.error-message').filter({ hasText: 'Minimum 2 caractères requis' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('email invalide dans le formulaire de contact → affiche "Adresse e-mail invalide"', async ({ page }) => {
    // Saisir un email sans @ dans le champ email du formulaire contact
    await page.locator('#email').fill('emailsansarrobase');
    await page.locator('#email').blur();

    // Angular template-driven: emailCtrl.invalid && emailCtrl.touched
    await expect(page.locator('.error-message').filter({ hasText: 'Adresse e-mail invalide' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('email vide dans le formulaire de contact → affiche "Adresse e-mail invalide"', async ({ page }) => {
    // Focus + blur sans saisie : required + email validator
    await page.locator('#email').focus();
    await page.locator('#email').blur();

    await expect(page.locator('.error-message').filter({ hasText: 'Adresse e-mail invalide' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('message trop court (< 10 caractères) → affiche "Minimum 10 caractères requis"', async ({ page }) => {
    // Le textarea a minlength="10" dans le template
    await page.locator('#request').fill('Court');
    await page.locator('#request').blur();

    // Angular template-driven: requestCtrl.invalid && requestCtrl.touched
    await expect(page.locator('.error-message').filter({ hasText: 'Minimum 10 caractères requis' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('message vide → affiche "Minimum 10 caractères requis"', async ({ page }) => {
    await page.locator('#request').focus();
    await page.locator('#request').blur();

    await expect(page.locator('.error-message').filter({ hasText: 'Minimum 10 caractères requis' }))
      .toBeVisible({ timeout: 3000 });
  });

  test('soumettre formulaire entièrement vide → plusieurs erreurs de validation visibles', async ({ page }) => {
    // Toucher tous les champs en les ciblant puis en quittant
    await page.locator('#name').focus();
    await page.locator('#email').focus();
    await page.locator('#request').focus();
    await page.locator('body').click(); // blur général

    // Soumettre pour déclencher la validation des champs non touchés
    await page.locator('button[type="submit"]').click();

    // Le formulaire doit afficher au moins une erreur de validation
    const errorMessages = page.locator('.error-message');
    const count = await errorMessages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('les chips de sujet sont cliquables et le sujet sélectionné est visuellement marqué', async ({ page }) => {
    // Cliquer sur le premier chip (eSport)
    const firstChip = page.locator('.chip').first();
    await firstChip.click();

    // La classe 'active' est ajoutée au chip sélectionné
    await expect(firstChip).toHaveClass(/active/);

    // L'icône de validation (✓) doit apparaître dans le chip
    await expect(firstChip.locator('.chip-icon')).toBeVisible();
  });

  test('le bouton "Envoyer" est désactivé si le formulaire est invalide', async ({ page }) => {
    // Sans rien remplir, contactForm.invalid = true
    // [disabled]="contactForm.invalid || isSubmitting()"
    const submitBtn = page.locator('button[type="submit"].submit-btn');
    await expect(submitBtn).toBeDisabled();
  });
});
