/**
 * Page Object Model — Page Contact publique
 *
 * Sélecteurs basés sur contact.html :
 * - section#contact                     → section principale
 * - .contact-channels                   → cartes Discord / Email / Téléphone
 * - a[aria-label*="Discord"]            → carte Discord
 * - .contact-form                       → formulaire principal
 * - #name                               → input Nom / Prénom
 * - #email                              → input Adresse e-mail
 * - #request                            → textarea Message
 * - button.chip                         → chips de sélection du sujet
 * - button.chip.active                  → chip sélectionné
 * - button.submit-btn[type="submit"]    → bouton Envoyer le message
 * - .success-container                  → conteneur de succès post-envoi
 * - .success-title                      → titre "Message envoyé !"
 * - .error-message--server              → erreur serveur
 */

import { Page, Locator } from '@playwright/test';

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
  subject?: string;
}

export class ContactPage {
  readonly page: Page;

  readonly mainSection: Locator;
  readonly contactChannels: Locator;
  readonly discordCard: Locator;
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageTextarea: Locator;
  readonly subjectChips: Locator;
  readonly submitButton: Locator;
  readonly successContainer: Locator;
  readonly successTitle: Locator;
  readonly serverError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.mainSection = page.locator('section#contact');
    this.contactChannels = page.locator('.contact-channels');
    this.discordCard = page.locator('a[aria-label*="Discord"]');
    this.form = page.locator('.contact-form');
    this.nameInput = page.locator('#name');
    this.emailInput = page.locator('#email');
    this.messageTextarea = page.locator('#request');
    this.subjectChips = page.locator('button.chip');
    this.submitButton = page.locator('button.submit-btn[type="submit"]');
    this.successContainer = page.locator('.success-container');
    this.successTitle = page.locator('.success-title');
    this.serverError = page.locator('.error-message--server');
  }

  async goto(): Promise<void> {
    await this.page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await this.mainSection.waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Sélectionne un chip de sujet par son texte */
  async selectSubject(subject: string): Promise<void> {
    const chip = this.subjectChips.filter({ hasText: subject }).first();
    await chip.click();
  }

  /** Sélectionne le premier chip disponible */
  async selectFirstSubject(): Promise<void> {
    await this.subjectChips.first().click();
  }

  /** Remplit tous les champs du formulaire */
  async fillForm(data: ContactFormData): Promise<void> {
    if (data.subject) {
      await this.selectSubject(data.subject);
    } else {
      await this.selectFirstSubject();
    }
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.messageTextarea.fill(data.message);
  }

  /** Soumet le formulaire */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** Remplit et soumet le formulaire en une seule étape */
  async fillAndSubmit(data: ContactFormData): Promise<void> {
    await this.fillForm(data);
    await this.submit();
  }

  /** Attend l'affichage du message de succès */
  async waitForSuccess(): Promise<void> {
    await this.successContainer.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Retourne le message d'erreur de validation pour un champ donné */
  getFieldError(fieldId: 'name' | 'email' | 'request'): Locator {
    return this.page
      .locator(`#${fieldId}`)
      .locator('xpath=ancestor::div[contains(@class,"form-group")]')
      .locator('.error-message');
  }
}
