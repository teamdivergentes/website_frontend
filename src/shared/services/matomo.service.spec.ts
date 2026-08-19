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
  let appendSpy: jasmine.Spy;

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

  beforeEach(() => {
    appendSpy = spyOn(document.head, 'appendChild').and.callFake(<T extends Node>(node: T): T => {
      if (node instanceof HTMLScriptElement && node.src.includes('matomo.js')) {
        return node;
      }
      return Element.prototype.appendChild.call(document.head, node) as T;
    });
  });

  afterEach(() => {
    delete (window as Partial<WindowWithPaq>)._paq;
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

    it('should normalize matomo url without trailing slash', async () => {
      setup('https://matomo.tellebma.fr', '5');
      await service.init();
      const paq = (window as WindowWithPaq)._paq;
      const setTrackerCall = paq.find(c => Array.isArray(c) && c[0] === 'setTrackerUrl') as unknown[] | undefined;
      expect(setTrackerCall).toBeDefined();
      expect(setTrackerCall![1]).toBe('https://matomo.tellebma.fr/matomo.php');
    });

    it('should append matomo.js script tag when initialized', async () => {
      setup('https://matomo.tellebma.fr/', '5');
      await service.init();
      const scriptCalls = appendSpy.calls.all().filter(c => {
        const node = c.args[0];
        return node instanceof HTMLScriptElement && node.src.includes('matomo.js');
      });
      expect(scriptCalls).toHaveSize(1);
      expect((scriptCalls[0].args[0] as HTMLScriptElement).async).toBeTrue();
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
