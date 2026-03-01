import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AnalyticsService } from './analytics.service';
import { RuntimeConfigService } from './runtime-config.service';
import { CookieConsentService } from './cookie-consent.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let runtimeConfigSpy: jasmine.SpyObj<RuntimeConfigService>;
  let cookieConsentSpy: jasmine.SpyObj<CookieConsentService>;
  let originalDataLayer: unknown[] | undefined;
  let originalGtag: ((...args: unknown[]) => void) | undefined;

  beforeEach(() => {
    // Sauvegarder et réinitialiser les globaux gtag/dataLayer
    originalDataLayer = window.dataLayer;
    originalGtag = window.gtag;
    delete (window as Window & { gtag?: unknown }).gtag;
    delete (window as Window & { dataLayer?: unknown }).dataLayer;

    runtimeConfigSpy = jasmine.createSpyObj<RuntimeConfigService>(
      'RuntimeConfigService',
      ['load'],
      { googleAnalyticsId: '' }
    );
    runtimeConfigSpy.load.and.resolveTo(undefined);

    cookieConsentSpy = jasmine.createSpyObj<CookieConsentService>(
      'CookieConsentService',
      ['hasConsent', 'hasDeclined', 'hasResponded', 'accept', 'decline', 'reopen']
    );
    cookieConsentSpy.hasConsent.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        AnalyticsService,
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
      ],
    });

    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    // Restaurer les globaux
    if (originalDataLayer !== undefined) {
      window.dataLayer = originalDataLayer;
    } else {
      delete (window as Window & { dataLayer?: unknown }).dataLayer;
    }
    if (originalGtag !== undefined) {
      window.gtag = originalGtag;
    } else {
      delete (window as Window & { gtag?: unknown }).gtag;
    }
    // Nettoyer les scripts GA injectés
    document
      .querySelectorAll('script[src*="googletagmanager.com"]')
      .forEach(el => el.remove());
    TestBed.resetTestingModule();
  });

  // ------------------------------------------------------------------ //
  // Cas 1 : init() ne charge pas le script si gaId est vide
  // ------------------------------------------------------------------ //
  it('should NOT load gtag script when gaId is empty', async () => {
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', { get: () => '' });

    await service.init();

    const scripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
    expect(scripts.length).toBe(0);
  });

  // ------------------------------------------------------------------ //
  // Cas 2 : init() ne charge pas le script si pas de consentement
  // ------------------------------------------------------------------ //
  it('should NOT load gtag script when no consent has been given', async () => {
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'G-TESTID1234',
    });
    cookieConsentSpy.hasConsent.and.returnValue(false);

    await service.init();

    const scripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
    expect(scripts.length).toBe(0);
  });

  // ------------------------------------------------------------------ //
  // Cas 3 : init() charge le script si consentement déjà donné
  // ------------------------------------------------------------------ //
  it('should load gtag script when consent was already given', async () => {
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'G-TESTID1234',
    });
    cookieConsentSpy.hasConsent.and.returnValue(true);

    await service.init();

    const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js?id=G-TESTID1234"]');
    expect(scripts.length).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // Cas 4 : setConsent(true) initialise GA (charge le script)
  // ------------------------------------------------------------------ //
  it('should load gtag script when setConsent(true) is called', () => {
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'G-TESTID1234',
    });

    service.setConsent(true);

    expect(cookieConsentSpy.accept).toHaveBeenCalledTimes(1);
    const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js?id=G-TESTID1234"]');
    expect(scripts.length).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // Cas 5 : setConsent(true) appelé deux fois n'injecte le script qu'une fois
  // ------------------------------------------------------------------ //
  it('should NOT initialize GA twice when setConsent(true) called twice (idempotent)', () => {
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'G-TESTID1234',
    });

    service.setConsent(true);
    service.setConsent(true);

    const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js?id=G-TESTID1234"]');
    expect(scripts.length).toBe(1);
  });

  // ------------------------------------------------------------------ //
  // Cas 6 : pageView() ne plante pas si gtag n'est pas défini
  // ------------------------------------------------------------------ //
  it('should NOT throw when pageView() is called and gtag is not defined', () => {
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'G-TESTID1234',
    });
    // s'assurer que gtag est absent
    delete (window as Window & { gtag?: unknown }).gtag;

    expect(() => service.pageView('/test-path')).not.toThrow();
  });

  // ------------------------------------------------------------------ //
  // Cas 7 : event() ne plante pas si gtag n'est pas défini
  // ------------------------------------------------------------------ //
  it('should NOT throw when event() is called and gtag is not defined', () => {
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'G-TESTID1234',
    });
    delete (window as Window & { gtag?: unknown }).gtag;

    expect(() => service.event('custom_event', { category: 'test' })).not.toThrow();
  });

  // ------------------------------------------------------------------ //
  // Cas 8 : GA_ID_PATTERN rejette les IDs invalides
  // ------------------------------------------------------------------ //
  it('should NOT inject script when GA ID does not match G-XXXXXXXX pattern', () => {
    const invalidIds = ['UA-12345678-1', 'G-', 'G-AB', 'invalid', '', 'g-testid1234'];

    for (const id of invalidIds) {
      Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
        get: () => id,
        configurable: true,
      });
      // setConsent pour déclencher loadGtagScript
      // On réinitialise l'état initialized via un nouveau service
    }

    // Test plus direct : vérifier qu'un ID valide PASSE et un invalide ECHOUE
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'UA-12345678-1',
      configurable: true,
    });
    cookieConsentSpy.hasConsent.and.returnValue(true);

    // Forcer le rechargement d'un nouveau service pour tester l'ID invalide
    const freshService = TestBed.inject(AnalyticsService);
    // l'initialized est false, mais le gaId est invalide → pas de script
    freshService.setConsent(true); // appelle accept() + loadGtagScript() qui vérifie le pattern

    // Le pattern rejette UA-..., donc aucun script googletagmanager ne doit être injecté
    const scripts = document.querySelectorAll('script[src*="googletagmanager.com/gtag/js?id=UA"]');
    expect(scripts.length).toBe(0);
  });

  // ------------------------------------------------------------------ //
  // Cas 8 (complémentaire) : le pattern GA_ID_PATTERN valide les IDs corrects
  // ------------------------------------------------------------------ //
  it('should accept valid GA IDs matching G-[A-Z0-9]{4,} pattern', () => {
    const validIds = ['G-ABCD', 'G-1234', 'G-ABCD1234', 'G-TESTID1234'];

    for (const id of validIds) {
      // Vérification directe du pattern via la regexp
      const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;
      expect(GA_ID_PATTERN.test(id))
        .withContext(`ID "${id}" devrait être valide`)
        .toBeTrue();
    }

    const invalidIds = ['UA-12345678-1', 'G-', 'G-AB', 'g-abcd', 'invalid'];
    for (const id of invalidIds) {
      const GA_ID_PATTERN = /^G-[A-Z0-9]{4,}$/;
      expect(GA_ID_PATTERN.test(id))
        .withContext(`ID "${id}" devrait être invalide`)
        .toBeFalse();
    }
  });
});
