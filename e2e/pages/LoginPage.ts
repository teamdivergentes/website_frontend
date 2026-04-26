/**
 * Page Object Model — Page de connexion
 *
 * Sélecteurs basés sur login.component.ts (template inline) :
 * - #email                   → input email (id="email")
 * - #password                → input mot de passe (id="password")
 * - button[type="submit"]    → bouton Se connecter (.btn.btn-primary)
 * - .alert.alert-error       → message d'erreur serveur
 * - .error-message           → messages d'erreur de validation inline
 * - .password-toggle         → bouton toggle affichage mot de passe
 */

import { Page, Locator } from '@playwright/test';
import { TEST_ADMIN } from '../fixtures/test-data';

export class LoginPage {
  readonly page: Page;

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly passwordToggle: Locator;
  readonly loginCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"].btn.btn-primary');
    this.errorMessage = page.locator('.alert.alert-error');
    this.passwordToggle = page.locator('.password-toggle');
    this.loginCard = page.locator('.login-card');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await this.loginCard.waitFor({ state: 'visible', timeout: 15000 });
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAsAdmin(): Promise<void> {
    await this.goto();
    await this.login(TEST_ADMIN.email, TEST_ADMIN.password);
    // Attendre la redirection vers l'admin après connexion réussie
    await this.page.waitForURL(/\/admin/, { timeout: 15000 });
  }

  /** Retourne le message d'erreur de validation pour un champ donné */
  fieldErrorMessage(fieldId: 'email' | 'password'): Locator {
    return this.page
      .locator(`#${fieldId}`)
      .locator('xpath=ancestor::div[contains(@class,"form-group")]')
      .locator('.error-message');
  }
}
