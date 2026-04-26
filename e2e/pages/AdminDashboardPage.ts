/**
 * Page Object Model — Dashboard Admin
 *
 * Sélecteurs basés sur admin-layout.component.ts et admin-sidebar.component.ts :
 *
 * Layout :
 * - .admin-layout.mat-app              → conteneur principal (wrapper)
 * - aside.sidebar                      → barre latérale
 * - nav.sidebar-nav                    → navigation sidebar
 * - a.nav-item                         → lien de navigation sidebar
 * - a.nav-item.active                  → lien actif
 * - .main-content                      → zone principale
 * - main.content-area                  → zone de contenu (router-outlet)
 * - button.collapse-btn                → bouton réduire/agrandir sidebar
 *
 * Menu sidebar (labels définis dans ADMIN_MENU) :
 * - Dashboard → /admin
 * - Utilisateurs → /admin/users
 * - Roles → /admin/roles
 * - Staff → /admin/staff
 * - Equipes → /admin/teams
 * - Jeux → /admin/games
 * - Sponsors → /admin/sponsors
 * - Articles → /admin/articles
 * - Recrutement → /admin/recruitment
 * - Configuration → /admin/config
 * - Analytics → /admin/analytics
 */

import { Page, Locator } from '@playwright/test';

export type AdminSection =
  | 'Dashboard'
  | 'Utilisateurs'
  | 'Roles'
  | 'Staff'
  | 'Equipes'
  | 'Jeux'
  | 'Sponsors'
  | 'Articles'
  | 'Recrutement'
  | 'Configuration'
  | 'Analytics';

export class AdminDashboardPage {
  readonly page: Page;

  readonly adminLayout: Locator;
  readonly sidebar: Locator;
  readonly sidebarNav: Locator;
  readonly navItems: Locator;
  readonly mainContent: Locator;
  readonly contentArea: Locator;
  readonly collapseBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.adminLayout = page.locator('.admin-layout.mat-app');
    this.sidebar = page.locator('aside.sidebar');
    this.sidebarNav = page.locator('nav.sidebar-nav');
    this.navItems = page.locator('a.nav-item');
    this.mainContent = page.locator('.main-content');
    this.contentArea = page.locator('main.content-area');
    this.collapseBtn = page.locator('button.collapse-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await this.adminLayout.waitFor({ state: 'visible', timeout: 15000 });
  }

  /** Retourne le lien sidebar correspondant au label de section */
  getSidebarLink(section: AdminSection): Locator {
    return this.navItems.filter({ hasText: section });
  }

  /** Navigue vers une section admin via la sidebar */
  async navigateToSection(section: AdminSection): Promise<void> {
    const link = this.getSidebarLink(section);
    await link.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Attend que le contenu admin soit rendu */
  async waitForContent(): Promise<void> {
    await this.adminLayout.waitFor({ state: 'visible', timeout: 15000 });
    await this.contentArea.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Retourne le lien actif dans la sidebar */
  getActiveNavItem(): Locator {
    return this.navItems.filter({ has: this.page.locator('.active') });
  }
}
