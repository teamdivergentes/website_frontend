/**
 * Page Object Model — Page Admin Configuration du site
 *
 * Sélecteurs basés sur config-page.component.html :
 *
 * Conteneur :
 * - .config-page                       → conteneur principal
 * - .page-header h1                    → titre "Configuration du site"
 *
 * Sections accordéon :
 * - .form-section                      → section accordéon
 * - .form-section .section-header      → en-tête cliquable d'une section
 * - .form-section.open                 → section ouverte
 * - [aria-controls="section-content-general"]  → toggle section Informations générales
 * - [aria-controls="section-content-social"]   → toggle section Réseaux sociaux
 * - [aria-controls="section-content-contact"]  → toggle section Notifications contact
 * - [aria-controls="section-content-recruitment"] → toggle section Notifications recrutement
 * - [aria-controls="section-content-seo"]      → toggle section SEO
 * - [aria-controls="section-content-visibility"] → toggle section Visibilité des pages
 *
 * Champs principaux :
 * - #site_name                         → input Nom du site
 * - #contact_email                     → input Email de contact
 * - #contact_phone                     → input Téléphone
 * - #youtube_link                      → input Lien YouTube (embed)
 * - #twitter_url                       → input Lien Twitter/X
 * - #instagram_url                     → input Lien Instagram
 * - #discord_url                       → input Lien Discord
 * - #youtube_url                       → input URL chaîne YouTube
 * - #twitch_url                        → input Lien Twitch
 * - #mail_url                          → input Lien email footer
 *
 * Visibilité des pages (toggles checkbox) :
 * - label.toggle-item:has(#page_shop_visible)      → toggle Boutique
 * - label.toggle-item:has(#page_contact_visible)   → toggle Contact
 * - label.toggle-item:has(#page_equipes_visible)   → toggle Équipes
 * - label.toggle-item:has(#page_sponsors_visible)  → toggle Sponsors
 * - label.toggle-item:has(#page_recrutement_visible) → toggle Recrutement
 * - label.toggle-item:has(#page_articles_visible)  → toggle Articles
 * - [data-testid="config-toggle-page_twitch_visible"] → toggle En live (Twitch) — EPIC-22
 *
 * Actions :
 * - .form-actions button.btn.btn-primary  → bouton "Enregistrer"
 * - .form-actions button.btn.btn-secondary → bouton "Annuler"
 * - .alert.alert-success               → message de succès
 * - .alert.alert-error                 → message d'erreur
 */

import { Page, Locator } from '@playwright/test';

export type PageKey =
  | 'shop'
  | 'contact'
  | 'equipes'
  | 'sponsors'
  | 'recrutement'
  | 'articles'
  | 'twitch';

export type SectionKey =
  | 'general'
  | 'social'
  | 'contact'
  | 'recruitment'
  | 'seo'
  | 'visibility';

export class AdminConfigPage {
  readonly page: Page;

  readonly configPage: Locator;
  readonly pageTitle: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly successAlert: Locator;
  readonly errorAlert: Locator;

  // Champs principaux
  readonly siteNameInput: Locator;
  readonly contactEmailInput: Locator;
  readonly contactPhoneInput: Locator;
  readonly youtubeEmbedInput: Locator;
  readonly twitterUrlInput: Locator;
  readonly instagramUrlInput: Locator;
  readonly discordUrlInput: Locator;
  readonly youtubeUrlInput: Locator;
  readonly twitchUrlInput: Locator;
  readonly mailUrlInput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.configPage = page.locator('.config-page');
    this.pageTitle = page.locator('.config-page .page-header h1');
    this.saveButton = page.locator('.form-actions button.btn.btn-primary');
    this.cancelButton = page.locator('.form-actions button.btn.btn-secondary');
    this.successAlert = page.locator('.alert.alert-success');
    this.errorAlert = page.locator('.alert.alert-error');

    this.siteNameInput = page.locator('#site_name');
    this.contactEmailInput = page.locator('#contact_email');
    this.contactPhoneInput = page.locator('#contact_phone');
    this.youtubeEmbedInput = page.locator('#youtube_link');
    this.twitterUrlInput = page.locator('#twitter_url');
    this.instagramUrlInput = page.locator('#instagram_url');
    this.discordUrlInput = page.locator('#discord_url');
    this.youtubeUrlInput = page.locator('#youtube_url');
    this.twitchUrlInput = page.locator('#twitch_url');
    this.mailUrlInput = page.locator('#mail_url');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/config', { waitUntil: 'domcontentloaded' });
    await this.configPage.waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Attend que le formulaire soit chargé (visible, pas spinner) */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('.loading-state .spinner');
      return !spinner;
    }, { timeout: 15000 });
  }

  /** Ouvre une section accordéon si elle est fermée */
  async openSection(section: SectionKey): Promise<void> {
    const toggle = this.page.locator(`[aria-controls="section-content-${section}"]`);
    const isExpanded = await toggle.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await toggle.click();
    }
    await this.page
      .locator(`#section-content-${section}.open`)
      .waitFor({ state: 'attached', timeout: 3000 });
  }

  /** Retourne le toggle checkbox de visibilité pour une page donnée */
  getPageVisibilityToggle(pageKey: PageKey): Locator {
    return this.page.locator(`input[type="checkbox"]`).filter({
      has: this.page.locator('xpath=ancestor::label[contains(@class,"toggle-item")]'),
    }).and(
      // Approche par formControlName indirect via l'attribut id du checkbox
      this.page.locator(`[id*="page_${pageKey}_visible"], label:has-text("${this.getPageLabel(pageKey)}") input[type="checkbox"]`),
    );
  }

  /**
   * Coche ou décoche la visibilité d'une page.
   * Nécessite que la section "visibility" soit ouverte au préalable.
   */
  async togglePageVisibility(pageKey: PageKey): Promise<void> {
    await this.openSection('visibility');
    // Sélectionner par le label de la toggle-item
    const label = this.getPageLabel(pageKey);
    const toggleItem = this.page.locator('label.toggle-item', { hasText: label });
    const checkbox = toggleItem.locator('input[type="checkbox"]');
    await checkbox.click();
  }

  /**
   * Lit la valeur actuelle (coché ou non) du toggle d'une page.
   * Nécessite que la section "visibility" soit ouverte au préalable.
   */
  async getPageVisibilityValue(pageKey: PageKey): Promise<boolean> {
    await this.openSection('visibility');
    const label = this.getPageLabel(pageKey);
    const toggleItem = this.page.locator('label.toggle-item', { hasText: label });
    return toggleItem.locator('input[type="checkbox"]').isChecked();
  }

  /** Sauvegarde la configuration */
  async save(): Promise<void> {
    await this.saveButton.click();
  }

  /** Annule les changements */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /** Attend l'affichage du message de succès */
  async waitForSuccess(): Promise<void> {
    await this.successAlert.waitFor({ state: 'visible', timeout: 10000 });
  }

  private getPageLabel(pageKey: PageKey): string {
    const labels: Record<PageKey, string> = {
      shop: 'Boutique',
      contact: 'Contact',
      equipes: 'Équipes / Ambassadeurs',
      sponsors: 'Sponsors',
      recrutement: 'Recrutement',
      articles: 'Articles',
      twitch: 'En live (Twitch)',
    };
    return labels[pageKey];
  }
}
