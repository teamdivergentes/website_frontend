/**
 * Page Object Model — Page Admin Gestion du Staff
 *
 * Sélecteurs basés sur staff-list.component.html et staff-form.component.ts :
 *
 * Liste (staff-list.component.html) :
 * - .staff-list-page                   → conteneur principal
 * - .page-header h1                    → titre "Gestion du Staff"
 * - .page-header button.btn.btn-primary → bouton "Ajouter un membre"
 * - .category-tabs button.tab         → onglets filtres (ADMIN / HEADSTAFF / AMBASSADOR)
 * - button.tab.active                  → onglet actif
 * - [role="status"]                    → skeleton chargement
 * - .staff-grid                        → grille drag-and-drop
 * - .staff-card                        → carte d'un membre
 * - .staff-card .member-info h3       → nom du membre
 * - .staff-card .member-info .role    → rôle du membre
 * - .staff-card .member-info .badge   → catégorie du membre
 * - button.btn-edit                    → bouton modifier (aria-label^="Modifier")
 * - button.btn-delete                  → bouton supprimer (aria-label^="Supprimer")
 * - .empty-state                       → état vide
 * - .alert.alert-error                 → message d'erreur
 *
 * Dialog création/édition (staff-form.component.ts template inline) :
 * - h2[mat-dialog-title]                        → titre du dialog
 * - input[formControlName="name"]               → input Nom
 * - input[formControlName="role"]               → input Rôle
 * - mat-select[formControlName="category"]      → select Catégorie
 * - button[mat-button] (Annuler)                → bouton annuler
 * - button[mat-raised-button][color="primary"]  → bouton Créer / Mettre à jour
 */

import { Page, Locator } from '@playwright/test';

export type StaffCategory = 'ADMIN' | 'HEADSTAFF' | 'AMBASSADOR';

export interface StaffFormData {
  name: string;
  role: string;
  category?: StaffCategory;
}

export class AdminStaffPage {
  readonly page: Page;

  readonly staffListPage: Locator;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly categoryTabs: Locator;
  readonly loadingSkeleton: Locator;
  readonly staffGrid: Locator;
  readonly staffCards: Locator;
  readonly emptyState: Locator;
  readonly alertError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.staffListPage = page.locator('.staff-list-page');
    this.pageTitle = page.locator('.staff-list-page .page-header h1');
    this.createButton = page.locator('.staff-list-page .page-header button.btn.btn-primary');
    this.categoryTabs = page.locator('.category-tabs button.tab');
    this.loadingSkeleton = page.locator('[role="status"][aria-label="Chargement en cours"]');
    this.staffGrid = page.locator('.staff-grid');
    this.staffCards = page.locator('.staff-card');
    this.emptyState = page.locator('.staff-list-page .empty-state');
    this.alertError = page.locator('.staff-list-page .alert.alert-error');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin/staff', { waitUntil: 'domcontentloaded' });
    await this.staffListPage.waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Attend que le chargement soit terminé */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      const skeleton = document.querySelector('[role="status"][aria-label="Chargement en cours"]');
      const content = document.querySelector('.staff-grid, .empty-state');
      return !skeleton || content !== null;
    }, { timeout: 15000 });
  }

  /** Filtre par catégorie via les onglets */
  async selectCategory(category: StaffCategory): Promise<void> {
    const labelMap: Record<StaffCategory, string | RegExp> = {
      ADMIN: /Administration/,
      HEADSTAFF: /Headstaff/,
      AMBASSADOR: /Ambassadeurs/,
    };
    const tab = this.categoryTabs.filter({ hasText: labelMap[category] });
    await tab.click();
  }

  /** Retourne la carte staff correspondant au nom donné */
  getStaffCard(name: string): Locator {
    return this.staffCards.filter({
      has: this.page.locator('.member-info h3', { hasText: name }),
    });
  }

  /** Retourne le bouton modifier par nom du membre */
  getEditButton(name: string): Locator {
    return this.page.locator(`button.btn-edit[aria-label="Modifier ${name}"]`);
  }

  /** Retourne le bouton supprimer par nom du membre */
  getDeleteButton(name: string): Locator {
    return this.page.locator(`button.btn-delete[aria-label="Supprimer ${name}"]`);
  }

  /** Ouvre le dialog d'ajout */
  async openCreateModal(): Promise<void> {
    await this.createButton.click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Remplit le formulaire du dialog */
  async fillStaffForm(data: StaffFormData): Promise<void> {
    const nameInput = this.page.locator('mat-dialog-content input[formcontrolname="name"]');
    const roleInput = this.page.locator('mat-dialog-content input[formcontrolname="role"]');

    await nameInput.fill(data.name);
    await roleInput.fill(data.role);

    if (data.category) {
      const select = this.page.locator('mat-dialog-content mat-select[formcontrolname="category"]');
      await select.click();
      // Le panel mat-select s'affiche en dehors du dialog
      const optionMap: Record<StaffCategory, string> = {
        ADMIN: 'Administration',
        HEADSTAFF: 'Headstaff',
        AMBASSADOR: 'Ambassadeur',
      };
      await this.page
        .locator('mat-option', { hasText: optionMap[data.category] })
        .click();
    }
  }

  /** Soumet le dialog */
  async submitDialog(): Promise<void> {
    const saveBtn = this.page.locator(
      'mat-dialog-actions button[mat-raised-button][color="primary"]',
    );
    await saveBtn.click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 10000 });
  }

  /** Annule le dialog */
  async cancelDialog(): Promise<void> {
    const cancelBtn = this.page.locator('mat-dialog-actions button[mat-button]');
    await cancelBtn.click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'hidden', timeout: 5000 });
  }

  /** Crée un nouveau membre du staff */
  async createStaff(data: StaffFormData): Promise<void> {
    await this.openCreateModal();
    await this.fillStaffForm(data);
    await this.submitDialog();
  }

  /** Modifie un membre du staff par son nom */
  async editStaff(name: string, data: Partial<StaffFormData>): Promise<void> {
    await this.getEditButton(name).click();
    await this.page.locator('mat-dialog-container').waitFor({ state: 'visible', timeout: 5000 });
    if (data.name !== undefined) {
      const nameInput = this.page.locator('mat-dialog-content input[formcontrolname="name"]');
      await nameInput.fill(data.name);
    }
    if (data.role !== undefined) {
      const roleInput = this.page.locator('mat-dialog-content input[formcontrolname="role"]');
      await roleInput.fill(data.role);
    }
    await this.submitDialog();
  }

  /** Supprime un membre du staff par son nom (avec confirmation) */
  async deleteStaff(name: string): Promise<void> {
    await this.getDeleteButton(name).click();
    // La suppression du staff est directe (pas de dialog de confirmation dans le template actuel)
    // On attend que la carte disparaisse
    await this.getStaffCard(name).waitFor({ state: 'detached', timeout: 10000 });
  }
}
