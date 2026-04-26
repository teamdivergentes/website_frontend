/**
 * Page Object Model — Page Admin Gestion des Jeux
 *
 * Sélecteurs basés sur games.component.ts (template inline) :
 *
 * Liste :
 * - .games-admin-page                  → conteneur principal
 * - .page-header h1                    → titre "Gestion des Jeux"
 * - button[mat-raised-button]          → bouton "Nouveau jeu"
 * - .error-message                     → message d'erreur
 * - [role="status"]                    → skeleton chargement
 * - .games-list                        → liste des jeux (cdkDropList)
 * - .game-item                         → ligne d'un jeu
 * - .game-item .game-info h3           → nom du jeu
 * - .game-item .game-key              → clé du jeu (p.game-key)
 * - mat-slide-toggle                   → toggle actif/inactif
 * - button[aria-label^="Modifier"]     → bouton édition par aria-label
 * - button[aria-label^="Supprimer"]    → bouton suppression par aria-label
 * - .empty-state                       → état vide (aucun jeu)
 *
 * Dialog création/édition (game-form-dialog.component.ts, template inline) :
 * - h2[mat-dialog-title]               → titre du dialog
 * - mat-dialog-content                 → contenu du dialog
 * - input[formControlName="key"]       → input clé unique (via matInput)
 * - input[formControlName="name"]      → input nom du jeu
 * - mat-checkbox                       → checkbox "Jeu actif"
 * - button[mat-dialog-close]           → bouton Annuler
 * - button[mat-raised-button][color="primary"] → bouton Enregistrer
 *
 * Dialog confirmation suppression :
 * - mat-dialog-content                 → contenu de confirmation
 * - button[mat-raised-button][color="warn"] → bouton Confirmer
 */

import { Page, Locator } from '@playwright/test';

export interface GameFormData {
  key: string;
  name: string;
  active?: boolean;
}

export class AdminGamesPage {
  readonly page: Page;

  readonly gamesAdminPage: Locator;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingSkeleton: Locator;
  readonly gamesList: Locator;
  readonly gameItems: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.gamesAdminPage = page.locator('.games-admin-page');
    this.pageTitle = page.locator('.games-admin-page .page-header h1');
    this.createButton = page.locator('.games-admin-page .page-header button[mat-raised-button]');
    this.errorMessage = page.locator('.games-admin-page .error-message');
    this.loadingSkeleton = page.locator('[role="status"][aria-label="Chargement en cours"]');
    this.gamesList = page.locator('.games-list');
    this.gameItems = page.locator('.game-item');
    this.emptyState = page.locator('.games-admin-page .empty-state');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/games', { waitUntil: 'domcontentloaded' });
    await this.gamesAdminPage.waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Attend que le chargement soit terminé */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      const skeleton = document.querySelector('[role="status"][aria-label="Chargement en cours"]');
      const content = document.querySelector('.games-list, .empty-state');
      return !skeleton || content !== null;
    }, { timeout: 15000 });
  }

  /** Retourne la ligne du jeu dont le nom correspond */
  getGameItem(name: string): Locator {
    return this.gameItems.filter({ has: this.page.locator('.game-info h3', { hasText: name }) });
  }

  /** Retourne le bouton de modification par nom du jeu */
  getEditButton(name: string): Locator {
    return this.page.locator(`button[aria-label="Modifier ${name}"]`);
  }

  /** Retourne le bouton de suppression par nom du jeu */
  getDeleteButton(name: string): Locator {
    return this.page.locator(`button[aria-label="Supprimer ${name}"]`);
  }

  /** Retourne le toggle actif/inactif d'un jeu par son nom */
  getToggleForGame(name: string): Locator {
    return this.getGameItem(name).locator('mat-slide-toggle');
  }

  /** Ouvre le dialog de création */
  async openCreateDialog(): Promise<void> {
    await this.createButton.click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Remplit le formulaire du dialog de création/édition */
  async fillGameForm(data: GameFormData): Promise<void> {
    const keyInput = this.page.locator('mat-dialog-content input[formcontrolname="key"]');
    const nameInput = this.page.locator('mat-dialog-content input[formcontrolname="name"]');

    await keyInput.fill(data.key);
    await nameInput.fill(data.name);

    if (data.active !== undefined) {
      const checkbox = this.page.locator('mat-dialog-content mat-checkbox');
      const isChecked = await checkbox.locator('input').isChecked();
      if (data.active !== isChecked) {
        await checkbox.click();
      }
    }
  }

  /** Soumet le formulaire du dialog (bouton Enregistrer) */
  async submitDialog(): Promise<void> {
    const saveBtn = this.page.locator(
      'mat-dialog-actions button[mat-raised-button][color="primary"]',
    );
    await saveBtn.click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  }

  /** Annule le dialog (bouton Annuler) */
  async cancelDialog(): Promise<void> {
    const cancelBtn = this.page.locator('mat-dialog-actions button[mat-dialog-close]');
    await cancelBtn.click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 5000 });
  }

  /** Crée un nouveau jeu : ouvre le dialog, remplit et soumet */
  async createGame(data: GameFormData): Promise<void> {
    await this.openCreateDialog();
    await this.fillGameForm(data);
    await this.submitDialog();
  }

  /** Modifie un jeu existant par son nom */
  async editGame(name: string, data: Partial<GameFormData>): Promise<void> {
    await this.getEditButton(name).click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'visible', timeout: 5000 });
    if (data.key !== undefined) {
      const keyInput = this.page.locator('mat-dialog-content input[formcontrolname="key"]');
      await keyInput.fill(data.key);
    }
    if (data.name !== undefined) {
      const nameInput = this.page.locator('mat-dialog-content input[formcontrolname="name"]');
      await nameInput.fill(data.name);
    }
    await this.submitDialog();
  }

  /** Supprime un jeu : clic suppression puis confirmation */
  async deleteGame(name: string): Promise<void> {
    await this.getDeleteButton(name).click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'visible', timeout: 5000 });
    // Dialog de confirmation : bouton "Confirmer" (warn)
    const confirmBtn = this.page.locator(
      'mat-dialog-actions button[mat-raised-button][color="warn"]',
    );
    await confirmBtn.click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  }
}
