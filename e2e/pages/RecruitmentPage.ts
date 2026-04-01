/**
 * Page Object Model — Page Recrutement publique
 *
 * Sélecteurs basés sur recrutement.html :
 * - section.recrutement                       → section principale
 * - .skeleton-postes-list[role="status"]      → skeleton de chargement
 * - .error-state[role="alert"]               → état d'erreur
 * - .postes-container                        → conteneur des offres chargées
 * - .postes-list                             → liste des offres
 * - .poste-card                              → carte d'une offre
 * - .poste-card .poste-title                 → titre de l'offre (h2)
 * - .poste-card .poste-type                  → type du poste
 * - .poste-card .poste-description           → description courte
 * - a.btn-postuler                           → bouton "Découvrir"
 * - .no-postes                               → état vide (aucun poste)
 */

import { Page, Locator } from '@playwright/test';

export class RecruitmentPage {
  readonly page: Page;

  readonly mainSection: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorState: Locator;
  readonly postesContainer: Locator;
  readonly postesList: Locator;
  readonly jobCards: Locator;
  readonly noPostesMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.mainSection = page.locator('section.recrutement');
    this.loadingSkeleton = page.locator('.skeleton-postes-list[role="status"]');
    this.errorState = page.locator('.error-state[role="alert"]');
    this.postesContainer = page.locator('.postes-container');
    this.postesList = page.locator('.postes-list');
    this.jobCards = page.locator('.poste-card');
    this.noPostesMessage = page.locator('.no-postes');
  }

  async goto(): Promise<void> {
    await this.page.goto('/structure/recrutement', { waitUntil: 'domcontentloaded' });
    await this.page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  }

  /** Attend que le chargement soit terminé */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      const skeleton = document.querySelector('.skeleton-postes-list');
      const content = document.querySelector('.postes-container, .error-state');
      return !skeleton || content !== null;
    }, { timeout: 15000 });
  }

  /** Retourne le titre d'une offre par son index */
  getJobTitleAt(index: number): Locator {
    return this.jobCards.nth(index).locator('.poste-title');
  }

  /** Retourne le type d'une offre par son index */
  getJobTypeAt(index: number): Locator {
    return this.jobCards.nth(index).locator('.poste-type');
  }

  /** Retourne le bouton "Découvrir" d'une offre par son index */
  getDiscoverButtonAt(index: number): Locator {
    return this.jobCards.nth(index).locator('a.btn-postuler');
  }

  /** Clique sur le bouton "Découvrir" d'une offre pour accéder au détail */
  async clickJob(title: string): Promise<void> {
    const card = this.jobCards.filter({ hasText: title }).first();
    const discoverBtn = card.locator('a.btn-postuler');
    await discoverBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Clique sur le premier bouton "Découvrir" disponible */
  async clickFirstJob(): Promise<void> {
    await this.jobCards.first().locator('a.btn-postuler').click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
