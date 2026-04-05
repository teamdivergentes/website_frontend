/**
 * Page Object Model — Page Sponsors publique
 *
 * Sélecteurs basés sur sponsors.html :
 * - section.sponsors-page                     → section principale
 * - .sponsors-header h1                       → titre "NOS SPONSORS"
 * - .skeleton-sponsors[role="status"]         → skeleton de chargement
 * - .error-state[role="alert"]               → état d'erreur
 * - .sponsors-list                           → liste des sponsors chargés
 * - app-sponsor-card                         → carte sponsor (composant)
 * - .empty-state                             → état vide (aucun sponsor)
 * - section.join-us                          → section CTA "Devenez partenaire"
 * - a.join-us-btn                            → bouton CTA partenaire
 */

import { Page, Locator } from '@playwright/test';

export class SponsorsPage {
  readonly page: Page;

  readonly mainSection: Locator;
  readonly pageTitle: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorState: Locator;
  readonly sponsorsList: Locator;
  readonly sponsorCards: Locator;
  readonly emptyState: Locator;
  readonly joinUsSection: Locator;
  readonly partnerCta: Locator;

  constructor(page: Page) {
    this.page = page;

    this.mainSection = page.locator('section.sponsors-page');
    this.pageTitle = page.locator('.sponsors-header h1');
    this.loadingSkeleton = page.locator('.skeleton-sponsors[role="status"]');
    this.errorState = page.locator('.error-state[role="alert"]');
    this.sponsorsList = page.locator('.sponsors-list');
    this.sponsorCards = page.locator('app-sponsor-card');
    this.emptyState = page.locator('.empty-state');
    this.joinUsSection = page.locator('section.join-us');
    this.partnerCta = page.locator('a.join-us-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/structure/sponsors', { waitUntil: 'domcontentloaded' });
    await this.page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  }

  /** Attend que le chargement soit terminé */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      const skeleton = document.querySelector('.skeleton-sponsors');
      const content = document.querySelector('.sponsors-list, .empty-state, .error-state');
      return !skeleton || content !== null;
    }, { timeout: 15000 });
  }
}
