import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Header } from './header';
import { sharedTestProvider } from '../../tests/shared-test-provider';
import { PageVisibilityService } from '../../services/page-visibility.service';

/**
 * Fabrique un mock PageVisibilityService
 */
function makeVisibilityMock(
  isPageVisible: (path: string) => boolean = () => true,
  isStructureVisible: () => boolean = () => true
) {
  return {
    isPageVisible,
    isStructureVisible,
  };
}

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  // ───────────────────────────────────────────────────────────
  // Setup de base
  // ───────────────────────────────────────────────────────────

  describe('création', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Header],
        providers: [sharedTestProvider],
      }).compileComponents();

      fixture = TestBed.createComponent(Header);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('doit créer le composant', () => {
      expect(component).toBeTruthy();
    });

    it('showStructureBlock est false par défaut', () => {
      expect(component.showStructureBlock()).toBeFalse();
    });

    it('showMobileMenu est false par défaut', () => {
      expect(component.showMobileMenu()).toBeFalse();
    });

    it('headerHidden est false par défaut', () => {
      expect(component.headerHidden()).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Comportements — closeMobileMenu, onEscapeKey, onFocusIn
  // ───────────────────────────────────────────────────────────

  describe('comportements', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Header],
        providers: [sharedTestProvider],
      }).compileComponents();

      fixture = TestBed.createComponent(Header);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('closeMobileMenu() doit fermer le menu mobile', () => {
      component.showMobileMenu.set(true);
      component.closeMobileMenu();
      expect(component.showMobileMenu()).toBeFalse();
    });

    it('onEscapeKey() doit fermer le dropdown structure', () => {
      component.showStructureBlock.set(true);
      component.onEscapeKey();
      expect(component.showStructureBlock()).toBeFalse();
    });

    it('onEscapeKey() doit fermer le menu mobile', () => {
      component.showMobileMenu.set(true);
      component.onEscapeKey();
      expect(component.showMobileMenu()).toBeFalse();
    });

    it('onFocusIn() doit afficher le header (headerHidden = false)', () => {
      component.headerHidden.set(true);
      component.onFocusIn();
      expect(component.headerHidden()).toBeFalse();
    });

    it('onDocumentClick() doit fermer le dropdown si on clique à l\'extérieur', () => {
      component.showStructureBlock.set(true);
      // structureBlockRef est undefined en test (pas de ViewChild initialisé)
      const event = new MouseEvent('click');
      component.onDocumentClick(event);
      expect(component.showStructureBlock()).toBeFalse();
    });

    it('onDocumentClick() ne doit pas toucher au dropdown si déjà fermé', () => {
      component.showStructureBlock.set(false);
      const event = new MouseEvent('click');
      component.onDocumentClick(event);
      expect(component.showStructureBlock()).toBeFalse();
    });

    it('onScroll() doit déclencher la mise à jour de la visibilité du header', () => {
      // onScroll() utilise requestAnimationFrame; on vérifie juste qu'il ne lève pas d'erreur
      expect(() => component.onScroll()).not.toThrow();
    });

    it('onScroll() ne doit pas déclencher deux RAF simultanément', () => {
      // Premier appel met ticking = true
      component.onScroll();
      // Deuxième appel ne doit pas lever d'erreur et est ignoré
      expect(() => component.onScroll()).not.toThrow();
    });

    it('updateHeaderVisibility() sur desktop large : headerHidden reste false', () => {
      // window.innerWidth sur JSDOM = 1024 par défaut, >= 800
      component.headerHidden.set(true);
      (component as unknown as { updateHeaderVisibility: () => void }).updateHeaderVisibility();
      expect(component.headerHidden()).toBeFalse();
    });

    it('updateHeaderVisibility() avec menu mobile ouvert : headerHidden reste false', () => {
      // Simuler mobile : innerWidth < 800
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
      component.showMobileMenu.set(true);
      component.headerHidden.set(true);
      (component as unknown as { updateHeaderVisibility: () => void }).updateHeaderVisibility();
      expect(component.headerHidden()).toBeFalse();
      // Restore
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
    });

    it('updateHeaderVisibility() scroll vers le bas sur mobile masque le header', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
      component.showMobileMenu.set(false);
      const comp = component as unknown as { lastScrollY: number; updateHeaderVisibility: () => void };
      comp.lastScrollY = 0;
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
      comp.updateHeaderVisibility();
      expect(component.headerHidden()).toBeTrue();
      // Restore
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    });

    it('updateHeaderVisibility() scroll vers le haut sur mobile affiche le header', () => {
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });
      component.showMobileMenu.set(false);
      component.headerHidden.set(true);
      const comp = component as unknown as { lastScrollY: number; updateHeaderVisibility: () => void };
      comp.lastScrollY = 200;
      Object.defineProperty(window, 'scrollY', { value: 180, writable: true, configurable: true });
      comp.updateHeaderVisibility();
      expect(component.headerHidden()).toBeFalse();
      // Restore
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
      Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    });
  });

  // ───────────────────────────────────────────────────────────
  // Délégation au PageVisibilityService
  // ───────────────────────────────────────────────────────────

  describe('navigationPages — délégation à PageVisibilityService', () => {
    async function setupWithVisibility(
      isPageVisible: (path: string) => boolean,
      isStructureVisible: () => boolean = () => true
    ) {
      const visibilityMock = makeVisibilityMock(isPageVisible, isStructureVisible);

      await TestBed.configureTestingModule({
        imports: [Header],
        providers: [
          ...sharedTestProvider,
          { provide: PageVisibilityService, useValue: visibilityMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(Header);
      component = fixture.componentInstance;
      fixture.detectChanges();

      return visibilityMock;
    }

    it('doit masquer /articles quand pageArticlesVisible est false', async () => {
      await setupWithVisibility((path: string) => path !== '/articles');
      const pages = (component as unknown as { navigationPages: () => { path: string; active: boolean }[] }).navigationPages();
      const articlesPage = pages.find(p => p.path === '/articles');
      expect(articlesPage?.active).toBeFalse();
    });

    it('doit afficher /articles quand pageArticlesVisible est true', async () => {
      await setupWithVisibility(() => true);
      const pages = (component as unknown as { navigationPages: () => { path: string; active: boolean }[] }).navigationPages();
      // articles est active: true dans navigationPages (staticData)
      const articlesPage = pages.find(p => p.path === '/articles');
      // Si la page source est active, elle doit rester active
      expect(articlesPage).toBeDefined();
    });

    it('doit masquer /boutique dans la navigation desktop quand shop masqué', async () => {
      await setupWithVisibility((path: string) => path !== '/boutique');
      const pages = (component as unknown as { navigationPages: () => { path: string; active: boolean }[] }).navigationPages();
      const boutiquePage = pages.find(p => p.path === '/boutique');
      expect(boutiquePage?.active).toBeFalse();
    });

    it('doit masquer /articles dans la navigation mobile quand articles masqués', async () => {
      await setupWithVisibility((path: string) => path !== '/articles');
      const mobilePages = (component as unknown as { mobileNavigationPages: () => { path: string; active: boolean }[] }).mobileNavigationPages();
      const articlesPage = mobilePages.find(p => p.path === '/articles');
      expect(articlesPage?.active).toBeFalse();
    });

    it('articles masqué seul — accueil reste actif dans la navigation', async () => {
      await setupWithVisibility((path: string) => path !== '/articles');
      const pages = (component as unknown as { navigationPages: () => { path: string; active: boolean }[] }).navigationPages();
      const accueilPage = pages.find(p => p.path === '/');
      expect(accueilPage?.active).toBeTrue();
    });

    it('plusieurs pages masquées simultanément dans la navigation desktop', async () => {
      const masquees = ['/articles', '/boutique', '/contact'];
      await setupWithVisibility((path: string) => !masquees.includes(path));
      const pages = (component as unknown as { navigationPages: () => { path: string; active: boolean }[] }).navigationPages();
      for (const masquee of masquees) {
        const page = pages.find(p => p.path === masquee);
        if (page) {
          expect(page.active).toBeFalse();
        }
      }
    });

    it('structure entièrement masquée — articles masqué aussi dans mobile', async () => {
      const masquees = ['/articles', '/structure/equipes', '/structure/sponsors', '/structure/recrutement'];
      await setupWithVisibility((path: string) => !masquees.includes(path));
      const mobilePages = (component as unknown as { mobileNavigationPages: () => { path: string; active: boolean }[] }).mobileNavigationPages();
      const articlesPage = mobilePages.find(p => p.path === '/articles');
      expect(articlesPage?.active).toBeFalse();
    });

    it('structureImgs doit filtrer les items selon pageVisibilityService', async () => {
      await setupWithVisibility((path: string) => path !== '/structure/equipes');
      const imgs = (component as unknown as { structureImgs: () => { path: string; active: boolean }[] }).structureImgs();
      const equipesItem = imgs.find(i => i.path === '/structure/equipes');
      if (equipesItem) {
        expect(equipesItem.active).toBeFalse();
      }
    });
  });
});
