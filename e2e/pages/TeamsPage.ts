/**
 * Page Object Model — Page Équipes publique
 *
 * Sélecteurs basés sur equipes.html et team-detail.html :
 *
 * Liste (/structure/equipes) :
 * - section.equipes-ambassadeurs        → conteneur principal
 * - [role="status"]                     → skeleton de chargement
 * - .error-state[role="alert"]          → état d'erreur
 * - .equipes-section                    → section équipes chargées
 * - .equipes-grid                       → grille des cartes
 * - a.team-card                         → carte équipe cliquable
 * - a.team-card .team-name             → nom de l'équipe
 * - .empty-state                        → état vide (aucune équipe)
 * - .ambassadeurs-section               → section ambassadeurs
 * - .ambassador-card .ambassador-name   → nom d'un ambassadeur
 *
 * Détail (/structure/equipes/:slug) :
 * - section.team-detail-page            → conteneur détail
 * - button.back-button                  → bouton retour vers la liste
 * - .team-header .section-title         → titre h1 de l'équipe
 * - .players-grid a.player-card         → cartes joueurs
 * - .player-name                        → nom d'un joueur
 * - .empty-members                      → message aucun membre
 */

import { Page, Locator } from '@playwright/test';

export class TeamsPage {
  readonly page: Page;

  // Liste
  readonly mainSection: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorState: Locator;
  readonly teamsSection: Locator;
  readonly teamsGrid: Locator;
  readonly teamCards: Locator;
  readonly emptyState: Locator;
  readonly ambassadorsSection: Locator;

  // Détail équipe
  readonly teamDetailPage: Locator;
  readonly backButton: Locator;
  readonly teamTitle: Locator;
  readonly playersGrid: Locator;
  readonly playerCards: Locator;
  readonly emptyMembersMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.mainSection = page.locator('section.equipes-ambassadeurs');
    this.loadingSkeleton = page.locator('[role="status"]');
    this.errorState = page.locator('.error-state[role="alert"]');
    this.teamsSection = page.locator('.equipes-section');
    this.teamsGrid = page.locator('.equipes-grid');
    this.teamCards = page.locator('a.team-card');
    this.emptyState = page.locator('.empty-state');
    this.ambassadorsSection = page.locator('.ambassadeurs-section');

    this.teamDetailPage = page.locator('section.team-detail-page');
    this.backButton = page.locator('button.back-button');
    this.teamTitle = page.locator('.team-header .section-title');
    this.playersGrid = page.locator('.players-grid');
    this.playerCards = page.locator('.players-grid a.player-card');
    this.emptyMembersMessage = page.locator('.empty-members');
  }

  async goto(): Promise<void> {
    await this.page.goto('/structure/equipes', { waitUntil: 'domcontentloaded' });
    await this.page.locator('app-root').waitFor({ state: 'attached', timeout: 15000 });
  }

  /** Attend que le chargement soit terminé (skeleton disparu) */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      const status = document.querySelector('[role="status"]');
      const content = document.querySelector('.equipes-section, .empty-state, .error-state');
      return !status || content !== null;
    }, { timeout: 15000 });
  }

  /** Clique sur la carte équipe dont le nom correspond (correspondance partielle) */
  async clickTeam(name: string): Promise<void> {
    const card = this.teamCards.filter({ hasText: name }).first();
    await card.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Clique sur la première carte équipe disponible */
  async clickFirstTeam(): Promise<void> {
    await this.teamCards.first().click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Retourne la carte équipe par son nom */
  getTeamCard(name: string): Locator {
    return this.teamCards.filter({ hasText: name });
  }

  /** Retourne le nom de l'équipe visible sur la carte à l'index donné */
  getTeamNameAt(index: number): Locator {
    return this.teamCards.nth(index).locator('.team-name');
  }

  /** Retourne le nom d'un ambassadeur à l'index donné */
  getAmbassadorNameAt(index: number): Locator {
    return this.ambassadorsSection.locator('.ambassador-card .ambassador-name').nth(index);
  }

  /** Attend que la page de détail soit chargée ou en erreur */
  async waitForDetailLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      return (
        document.querySelector('section.team-detail-page') !== null ||
        document.querySelector('.error-state') !== null
      );
    }, { timeout: 15000 });
  }
}
