import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';

import { PageVisibilityService } from './page-visibility.service';
import { ConfigService } from '../../app/shared/services/config.service';

/**
 * Fabrique un mock ConfigService avec des signals contrôlables
 */
function makeConfigServiceMock(overrides: Partial<Record<string, boolean>> = {}) {
  const defaults: Record<string, boolean> = {
    pageShopVisible: true,
    pageContactVisible: true,
    pageEquipesVisible: true,
    pageSponsorsVisible: true,
    pageRecrutementVisible: true,
    pageArticlesVisible: true,
    pageTwitchVisible: true,
  };

  const merged = { ...defaults, ...overrides };

  return {
    pageShopVisible: signal(merged['pageShopVisible']),
    pageContactVisible: signal(merged['pageContactVisible']),
    pageEquipesVisible: signal(merged['pageEquipesVisible']),
    pageSponsorsVisible: signal(merged['pageSponsorsVisible']),
    pageRecrutementVisible: signal(merged['pageRecrutementVisible']),
    pageArticlesVisible: signal(merged['pageArticlesVisible']),
    pageTwitchVisible: signal(merged['pageTwitchVisible']),
  };
}

describe('PageVisibilityService', () => {
  let service: PageVisibilityService;
  let configMock: ReturnType<typeof makeConfigServiceMock>;

  function setup(overrides: Partial<Record<string, boolean>> = {}) {
    configMock = makeConfigServiceMock(overrides);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PageVisibilityService,
        { provide: ConfigService, useValue: configMock },
      ],
    });

    service = TestBed.inject(PageVisibilityService);
  }

  // ───────────────────────────────────────────────────────────
  // Pages non configurables → toujours visible
  // ───────────────────────────────────────────────────────────

  describe('pages non configurables', () => {
    beforeEach(() => setup());

    it('doit retourner true pour la page accueil (/)', () => {
      expect(service.isPageVisible('/')).toBeTrue();
    });

    it('doit retourner true pour la page /structure (hub)', () => {
      expect(service.isPageVisible('/structure')).toBeTrue();
    });

    it('doit retourner true pour une page inconnue (défaut permissif)', () => {
      expect(service.isPageVisible('/une-page-inconnue')).toBeTrue();
    });

    it('doit retourner true pour une chaîne vide (défaut permissif)', () => {
      expect(service.isPageVisible('')).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // /boutique
  // ───────────────────────────────────────────────────────────

  describe('/boutique', () => {
    it('doit retourner true quand pageShopVisible est true', () => {
      setup({ pageShopVisible: true });
      expect(service.isPageVisible('/boutique')).toBeTrue();
    });

    it('doit retourner false quand pageShopVisible est false', () => {
      setup({ pageShopVisible: false });
      expect(service.isPageVisible('/boutique')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // /contact
  // ───────────────────────────────────────────────────────────

  describe('/contact', () => {
    it('doit retourner true quand pageContactVisible est true', () => {
      setup({ pageContactVisible: true });
      expect(service.isPageVisible('/contact')).toBeTrue();
    });

    it('doit retourner false quand pageContactVisible est false', () => {
      setup({ pageContactVisible: false });
      expect(service.isPageVisible('/contact')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // /structure/equipes
  // ───────────────────────────────────────────────────────────

  describe('/structure/equipes', () => {
    it('doit retourner true quand pageEquipesVisible est true', () => {
      setup({ pageEquipesVisible: true });
      expect(service.isPageVisible('/structure/equipes')).toBeTrue();
    });

    it('doit retourner false quand pageEquipesVisible est false', () => {
      setup({ pageEquipesVisible: false });
      expect(service.isPageVisible('/structure/equipes')).toBeFalse();
    });

    it('doit retourner false pour une sous-page /structure/equipes/:id quand équipes masquées', () => {
      setup({ pageEquipesVisible: false });
      expect(service.isPageVisible('/structure/equipes/123')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // /structure/sponsors
  // ───────────────────────────────────────────────────────────

  describe('/structure/sponsors', () => {
    it('doit retourner true quand pageSponsorsVisible est true', () => {
      setup({ pageSponsorsVisible: true });
      expect(service.isPageVisible('/structure/sponsors')).toBeTrue();
    });

    it('doit retourner false quand pageSponsorsVisible est false', () => {
      setup({ pageSponsorsVisible: false });
      expect(service.isPageVisible('/structure/sponsors')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // /structure/recrutement
  // ───────────────────────────────────────────────────────────

  describe('/structure/recrutement', () => {
    it('doit retourner true quand pageRecrutementVisible est true', () => {
      setup({ pageRecrutementVisible: true });
      expect(service.isPageVisible('/structure/recrutement')).toBeTrue();
    });

    it('doit retourner false quand pageRecrutementVisible est false', () => {
      setup({ pageRecrutementVisible: false });
      expect(service.isPageVisible('/structure/recrutement')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // /articles (BUG CORRIGÉ — manquait dans footer)
  // ───────────────────────────────────────────────────────────

  describe('/articles', () => {
    it('doit retourner true quand pageArticlesVisible est true', () => {
      setup({ pageArticlesVisible: true });
      expect(service.isPageVisible('/articles')).toBeTrue();
    });

    it('doit retourner false quand pageArticlesVisible est false', () => {
      setup({ pageArticlesVisible: false });
      expect(service.isPageVisible('/articles')).toBeFalse();
    });

    it('doit retourner false pour une sous-page /articles/:slug quand articles masqués', () => {
      setup({ pageArticlesVisible: false });
      expect(service.isPageVisible('/articles/mon-article')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // /twitch (anticipation EPIC-17)
  // ───────────────────────────────────────────────────────────

  describe('/twitch', () => {
    it('doit retourner true quand pageTwitchVisible est true', () => {
      setup({ pageTwitchVisible: true });
      expect(service.isPageVisible('/twitch')).toBeTrue();
    });

    it('doit retourner false quand pageTwitchVisible est false', () => {
      setup({ pageTwitchVisible: false });
      expect(service.isPageVisible('/twitch')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Combinaisons multiples masquées simultanément
  // ───────────────────────────────────────────────────────────

  describe('combinaisons multiples masquées', () => {
    beforeEach(() =>
      setup({
        pageArticlesVisible: false,
        pageEquipesVisible: false,
        pageSponsorsVisible: false,
        pageRecrutementVisible: false,
      })
    );

    it('articles est masqué', () => {
      expect(service.isPageVisible('/articles')).toBeFalse();
    });

    it('equipes est masqué', () => {
      expect(service.isPageVisible('/structure/equipes')).toBeFalse();
    });

    it('sponsors est masqué', () => {
      expect(service.isPageVisible('/structure/sponsors')).toBeFalse();
    });

    it('recrutement est masqué', () => {
      expect(service.isPageVisible('/structure/recrutement')).toBeFalse();
    });

    it('boutique reste visible car non masquée', () => {
      expect(service.isPageVisible('/boutique')).toBeTrue();
    });

    it('accueil reste visible car non configurable', () => {
      expect(service.isPageVisible('/')).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // isStructureVisible — masquage du lien parent /structure
  // ───────────────────────────────────────────────────────────

  describe('isStructureVisible', () => {
    it('doit retourner true quand au moins une sous-page structure est visible', () => {
      setup({ pageEquipesVisible: true, pageSponsorsVisible: false, pageRecrutementVisible: false });
      expect(service.isStructureVisible()).toBeTrue();
    });

    it('doit retourner false quand toutes les sous-pages structure sont masquées', () => {
      setup({ pageEquipesVisible: false, pageSponsorsVisible: false, pageRecrutementVisible: false });
      expect(service.isStructureVisible()).toBeFalse();
    });

    it('doit retourner true quand sponsors seul est visible', () => {
      setup({ pageEquipesVisible: false, pageSponsorsVisible: true, pageRecrutementVisible: false });
      expect(service.isStructureVisible()).toBeTrue();
    });

    it('doit retourner true quand recrutement seul est visible', () => {
      setup({ pageEquipesVisible: false, pageSponsorsVisible: false, pageRecrutementVisible: true });
      expect(service.isStructureVisible()).toBeTrue();
    });
  });
});
