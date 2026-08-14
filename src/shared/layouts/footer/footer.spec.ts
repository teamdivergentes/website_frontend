import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Footer } from './footer';
import { sharedTestProvider } from '../../tests/shared-test-provider';
import { PageVisibilityService } from '../../services/page-visibility.service';
import { mobileNavigationPages } from '../../navigation-pages';

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

    function pagesOf() {
      return (
        component as unknown as { footerNavigationPages: () => { path: string; label: string }[] }
      ).footerNavigationPages();
    }

    it('doit afficher les sous-pages de structure visibles', async () => {
      await setupWithVisibility(() => true);
      const paths = pagesOf().map(p => p.path);
      expect(paths).toContain('/structure/palmares');
      expect(paths).toContain('/structure/equipes');
      expect(paths).toContain('/structure/sponsors');
      expect(paths).toContain('/structure/recrutement');
    });

    it('ne doit lister que des sous-pages de structure', async () => {
      await setupWithVisibility(() => true);
      const paths = pagesOf().map(p => p.path);
      // Accueil, articles, boutique, contact et EN LIVE sont portés par le header
      for (const horsPerimetre of ['/', '/articles', '/boutique', '/contact', '/twitch']) {
        expect(paths).not.toContain(horsPerimetre);
      }
    });

    it('doit masquer /structure/equipes quand pageEquipesVisible est false', async () => {
      await setupWithVisibility((path: string) => path !== '/structure/equipes');
      expect(pagesOf().find(p => p.path === '/structure/equipes')).toBeUndefined();
    });

    it('doit masquer /structure/palmares quand pagePalmaresVisible est false', async () => {
      await setupWithVisibility((path: string) => path !== '/structure/palmares');
      expect(pagesOf().find(p => p.path === '/structure/palmares')).toBeUndefined();
    });

    it('structure entièrement masquée — la nav est vide', async () => {
      await setupWithVisibility(() => false, () => false);
      expect(pagesOf().length).toBe(0);
    });

    it('au moins une sous-page visible — la nav est affichée', async () => {
      await setupWithVisibility((path: string) => path === '/structure/equipes', () => true);
      const pages = pagesOf();
      expect(pages.length).toBe(1);
      expect(pages[0].path).toBe('/structure/equipes');
    });

    it('doit raccourcir les libellés trop longs pour la colonne du footer', async () => {
      await setupWithVisibility(() => true);
      const pages = pagesOf();
      expect(pages.find(p => p.path === '/structure/equipes')?.label).toBe('équipes');
      expect(pages.find(p => p.path === '/structure/sponsors')?.label).toBe('sponsors');
    });

    it('ne doit pas muter la source mobileNavigationPages', async () => {
      await setupWithVisibility(() => true);
      pagesOf();
      const source = mobileNavigationPages.find(p => p.path === '/structure/equipes');
      expect(source?.label).toBe('équipes/ambassadeurs');
    });

    it('plusieurs sous-pages masquées simultanément', async () => {
      const masquees = ['/structure/sponsors', '/structure/recrutement'];
      await setupWithVisibility((path: string) => !masquees.includes(path));
      const paths = pagesOf().map(p => p.path);
      for (const masquee of masquees) {
        expect(paths).not.toContain(masquee);
      }
      expect(paths).toContain('/structure/equipes');
    });
  });
});
