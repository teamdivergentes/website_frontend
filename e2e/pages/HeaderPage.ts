/**
 * Page Object Model — Header de navigation (public)
 *
 * Sélecteurs basés sur header/header.html :
 * - header#visitor_navbar         → barre de navigation principale
 * - nav[aria-label="Navigation principale"] → nav desktop
 * - app-logo-with-hover               → logo DVG
 * - button.mobile-menu-toggle         → bouton menu mobile (hamburger)
 * - button.dropdown-link              → bouton dropdown "Structure"
 * - #structure-dropdown               → menu déroulant Structure (desktop)
 * - .structure-bloc__images__bloc     → liens des sous-pages Structure
 * - .mobile-overlay                   → overlay menu mobile
 * - nav#mobile-menu                   → navigation mobile fullscreen
 * - .mobile-overlay__close            → bouton fermeture menu mobile
 * - .mobile-overlay__menu .mobile-overlay__item a → liens mobile
 */

import { Page, Locator } from '@playwright/test';

export class HeaderPage {
  readonly page: Page;

  readonly navbar: Locator;
  readonly desktopNav: Locator;
  readonly logo: Locator;
  readonly mobileMenuToggle: Locator;
  readonly structureDropdownBtn: Locator;
  readonly structureDropdown: Locator;
  readonly mobileOverlay: Locator;
  readonly mobileMenu: Locator;
  readonly mobileCloseBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.navbar = page.locator('header#visitor_navbar');
    this.desktopNav = page.locator('nav[aria-label="Navigation principale"]');
    this.logo = page.locator('app-logo-with-hover').first();
    this.mobileMenuToggle = page.locator('button.mobile-menu-toggle');
    this.structureDropdownBtn = page.locator('button.dropdown-link');
    this.structureDropdown = page.locator('#structure-dropdown');
    this.mobileOverlay = page.locator('.mobile-overlay');
    this.mobileMenu = page.locator('nav#mobile-menu');
    this.mobileCloseBtn = page.locator('.mobile-overlay__close');
  }

  /** Attend que le header soit visible sur la page courante */
  async waitForVisible(): Promise<void> {
    await this.navbar.waitFor({ state: 'visible', timeout: 10000 });
  }

  /** Retourne un lien de navigation desktop par son texte (insensible à la casse) */
  getDesktopNavLink(label: string): Locator {
    return this.desktopNav.locator('a').filter({ hasText: new RegExp(label, 'i') });
  }

  /** Navigue vers une route via le menu desktop */
  async navigateTo(route: string): Promise<void> {
    await this.page.goto(route, { waitUntil: 'domcontentloaded' });
  }

  /** Ouvre le menu mobile */
  async openMobileMenu(): Promise<void> {
    await this.mobileMenuToggle.click();
    await this.mobileOverlay.waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Ferme le menu mobile via le bouton X */
  async closeMobileMenu(): Promise<void> {
    await this.mobileCloseBtn.click();
    await this.mobileOverlay.waitFor({ state: 'hidden', timeout: 5000 });
  }

  /** Retourne un lien du menu mobile par son texte */
  getMobileNavLink(label: string): Locator {
    return this.mobileMenu.locator('a').filter({ hasText: new RegExp(label, 'i') });
  }

  /** Ouvre le dropdown Structure (desktop) */
  async openStructureDropdown(): Promise<void> {
    await this.structureDropdownBtn.click();
    await this.structureDropdown.waitFor({ state: 'visible', timeout: 5000 });
  }

  /** Retourne un lien dans le dropdown Structure par son texte */
  getStructureDropdownLink(label: string): Locator {
    return this.structureDropdown
      .locator('.structure-bloc__images__bloc')
      .filter({ hasText: new RegExp(label, 'i') });
  }
}
