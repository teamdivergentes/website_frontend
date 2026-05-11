import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { MatomoService } from './matomo.service';
import { RuntimeConfigService } from './runtime-config.service';

type WindowWithPaq = Window & { _paq: unknown[][] };

describe('MatomoService', () => {
  let service: MatomoService;
  let runtimeConfigSpy: jasmine.SpyObj<RuntimeConfigService>;
  let routerEventsSubject: Subject<NavigationEnd>;

  function buildSpy(matomoUrl: string, matomoSiteId: string): jasmine.SpyObj<RuntimeConfigService> {
    const spy = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']);
    spy.load.and.returnValue(Promise.resolve());
    Object.defineProperty(spy, 'matomoUrl', { get: () => matomoUrl, configurable: true });
    Object.defineProperty(spy, 'matomoSiteId', { get: () => matomoSiteId, configurable: true });
    Object.defineProperty(spy, 'googleAnalyticsId', { get: () => '', configurable: true });
    return spy;
  }

  function setup(matomoUrl: string = '', matomoSiteId: string = ''): void {
    routerEventsSubject = new Subject<NavigationEnd>();
    runtimeConfigSpy = buildSpy(matomoUrl, matomoSiteId);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MatomoService,
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
        {
          provide: Router,
          useValue: { events: routerEventsSubject.asObservable() }
        }
      ]
    });

    service = TestBed.inject(MatomoService);
  }

  afterEach(() => {
    delete (window as Partial<WindowWithPaq>)._paq;
    document.head.querySelectorAll('script[src*="matomo.js"]').forEach(s => s.remove());
  });

  it('should be created', () => {
    setup();
    expect(service).toBeTruthy();
  });

  describe('init()', () => {
    it('should not initialize when matomoUrl is empty', async () => {
      setup('', '');
      await service.init();
      expect((window as Partial<WindowWithPaq>)._paq).toBeUndefined();
    });

    it('should not initialize when matomoSiteId is empty', async () => {
      setup('https://matomo.tellebma.fr/', '');
      await service.init();
      expect((window as Partial<WindowWithPaq>)._paq).toBeUndefined();
    });

    it('should initialize _paq with CNIL-exempted config when url and siteId are set', async () => {
      setup('https://matomo.tellebma.fr/', '5');
      await service.init();
      const paq = (window as WindowWithPaq)._paq;
      expect(paq).toBeDefined();
      expect(paq).toContain(jasmine.arrayContaining(['disableCookies']));
      expect(paq).toContain(jasmine.arrayContaining(['setDoNotTrack', true]));
      expect(paq).toContain(jasmine.arrayContaining(['setTrackerUrl', 'https://matomo.tellebma.fr/matomo.php']));
      expect(paq).toContain(jasmine.arrayContaining(['setSiteId', '5']));
    });

    it('should append matomo.js script tag when initialized', async () => {
      setup('https://matomo.tellebma.fr/', '5');
      const scriptsBefore = document.head.querySelectorAll('script[src*="matomo.js"]').length;
      await service.init();
      const scriptsAfter = document.head.querySelectorAll('script[src*="matomo.js"]').length;
      expect(scriptsAfter).toBe(scriptsBefore + 1);
    });
  });

  describe('trackPageView()', () => {
    it('should not push to _paq if not initialized', () => {
      setup();
      service.trackPageView('/test');
      expect((window as Partial<WindowWithPaq>)._paq).toBeUndefined();
    });

    it('should push setCustomUrl and trackPageView after init', async () => {
      setup('https://matomo.tellebma.fr/', '5');
      await service.init();

      const paq = (window as WindowWithPaq)._paq;
      const lengthAfterInit = paq.length;

      service.trackPageView('/ma-page');

      expect(paq.length).toBe(lengthAfterInit + 2);
      expect(paq[lengthAfterInit]).toEqual(['setCustomUrl', '/ma-page']);
      expect(paq[lengthAfterInit + 1]).toEqual(['trackPageView']);
    });
  });
});
