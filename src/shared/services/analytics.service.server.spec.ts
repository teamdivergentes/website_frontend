import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { AnalyticsService } from './analytics.service';
import { RuntimeConfigService } from './runtime-config.service';
import { CookieConsentService } from './cookie-consent.service';

/**
 * EPIC-29 — Google Analytics n'a aucun sens au rendu serveur, et son injection
 * de script ferait echouer le SSR.
 */
describe('AnalyticsService — rendu serveur', () => {
  let runtimeConfigSpy: jasmine.SpyObj<RuntimeConfigService>;
  let cookieConsentSpy: jasmine.SpyObj<CookieConsentService>;
  let appendSpy: jasmine.Spy;

  function setup(platform: 'server' | 'browser'): AnalyticsService {
    runtimeConfigSpy = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']);
    runtimeConfigSpy.load.and.resolveTo(undefined);
    Object.defineProperty(runtimeConfigSpy, 'googleAnalyticsId', {
      get: () => 'G-TESTID1234',
      configurable: true,
    });

    cookieConsentSpy = jasmine.createSpyObj<CookieConsentService>('CookieConsentService', [
      'hasConsent',
      'hasDeclined',
      'hasResponded',
      'accept',
      'decline',
      'reopen',
    ]);
    cookieConsentSpy.hasConsent.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        AnalyticsService,
        { provide: PLATFORM_ID, useValue: platform },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
        { provide: CookieConsentService, useValue: cookieConsentSpy },
      ],
    });

    return TestBed.inject(AnalyticsService);
  }

  beforeEach(() => {
    appendSpy = spyOn(document.head, 'appendChild').and.callFake(<T extends Node>(node: T): T => {
      if (node instanceof HTMLScriptElement && node.src.includes('googletagmanager.com')) {
        return node;
      }
      return Element.prototype.appendChild.call(document.head, node) as T;
    });
  });

  it("n'injecte pas gtag et ne lit pas la config", async () => {
    const service = setup('server');

    await service.init();

    expect(runtimeConfigSpy.load).not.toHaveBeenCalled();
    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('ignore setConsent() sans toucher au service de consentement', () => {
    const service = setup('server');

    service.setConsent(true);
    service.setConsent(false);

    expect(cookieConsentSpy.accept).not.toHaveBeenCalled();
    expect(cookieConsentSpy.decline).not.toHaveBeenCalled();
  });

  it('ignore pageView() et event() sans lever d erreur', () => {
    const service = setup('server');

    expect(() => service.pageView('/articles')).not.toThrow();
    expect(() => service.event('add_to_cart')).not.toThrow();
  });

  it('charge bien gtag cote navigateur — branche nominale', async () => {
    const service = setup('browser');

    await service.init();

    expect(runtimeConfigSpy.load).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
  });
});
