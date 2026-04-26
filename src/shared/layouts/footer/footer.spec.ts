import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Footer } from './footer';
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

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  // ───────────────────────────────────────────────────────────
  // Setup de base
  // ───────────────────────────────────────────────────────────

  describe('création', () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [Footer],
        providers: [sharedTestProvider],
      }).compileComponents();

      fixture = TestBed.createComponent(Footer);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('doit créer le composant', () => {
      expect(component).toBeTruthy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Délégation au PageVisibilityService
  // ───────────────────────────────────────────────────────────

  describe('footerNavigationPages — délégation à PageVisibilityService', () => {
    async function setupWithVisibility(
      isPageVisible: (path: string) => boolean,
      isStructureVisible: () => boolean = () => true
    ) {
      const visibilityMock = makeVisibilityMock(isPageVisible, isStructureVisible);

      await TestBed.configureTestingModule({
        imports: [Footer],
        providers: [
          ...sharedTestProvider,
          { provide: PageVisibilityService, useValue: visibilityMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(Footer);
      component = fixture.componentInstance;
      fixture.detectChanges();

      return visibilityMock;
    }

    it('doit afficher les pages visibles', async () => {
      await setupWithVisibility(() => true);
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      expect(pages.length).toBeGreaterThan(0);
    });

    it('doit masquer /articles quand pageArticlesVisible est false', async () => {
      await setupWithVisibility((path: string) => path !== '/articles');
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      const articlesPage = pages.find(p => p.path === '/articles');
      expect(articlesPage).toBeUndefined();
    });

    it('doit afficher /articles quand pageArticlesVisible est true', async () => {
      await setupWithVisibility(() => true);
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      const articlesPage = pages.find(p => p.path === '/articles');
      expect(articlesPage).toBeDefined();
    });

    it('doit masquer /boutique quand pageShopVisible est false', async () => {
      await setupWithVisibility((path: string) => path !== '/boutique');
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      const boutiquePage = pages.find(p => p.path === '/boutique');
      expect(boutiquePage).toBeUndefined();
    });

    it('doit masquer le lien /structure quand toutes ses sous-pages sont masquées', async () => {
      await setupWithVisibility(() => false, () => false);
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      const structurePage = pages.find(p => p.path === '/structure');
      expect(structurePage).toBeUndefined();
    });

    it('doit afficher /structure quand au moins une sous-page est visible', async () => {
      await setupWithVisibility(
        (path: string) => path === '/structure/equipes',
        () => true
      );
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      const structurePage = pages.find(p => p.path === '/structure');
      expect(structurePage).toBeDefined();
    });

    it('articles masqué seul — les autres pages restent visibles', async () => {
      await setupWithVisibility((path: string) => path !== '/articles');
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      expect(pages.find(p => p.path === '/articles')).toBeUndefined();
      expect(pages.find(p => p.path === '/')).toBeDefined();
    });

    it('structure entièrement masquée — lien structure absent', async () => {
      await setupWithVisibility(
        (path: string) =>
          path !== '/structure/equipes' &&
          path !== '/structure/sponsors' &&
          path !== '/structure/recrutement',
        () => false
      );
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      const structurePage = pages.find(p => p.path === '/structure');
      expect(structurePage).toBeUndefined();
    });

    it('plusieurs pages masquées simultanément', async () => {
      const masquees = ['/articles', '/boutique', '/contact'];
      await setupWithVisibility((path: string) => !masquees.includes(path));
      const pages = (component as unknown as { footerNavigationPages: () => { path: string }[] }).footerNavigationPages();
      for (const masquee of masquees) {
        expect(pages.find(p => p.path === masquee)).toBeUndefined();
      }
    });
  });
});
