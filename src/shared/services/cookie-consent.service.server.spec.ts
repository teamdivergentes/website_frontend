import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

import { CookieConsentService } from './cookie-consent.service';

/**
 * EPIC-29 — au rendu serveur, aucun cookie n'est lisible : le repli explicite
 * est « consentement non accorde ». La decision reelle est prise a l'hydratation.
 */
describe('CookieConsentService — rendu serveur', () => {
  function setup(platform: 'server' | 'browser'): CookieConsentService {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(CookieConsentService);
  }

  beforeEach(() => {
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=; max-age=0; path=/`;
      }
    });
  });

  it('rapporte un consentement non accorde meme si un cookie existe', () => {
    document.cookie = 'dvg_cookie_consent=accepted; path=/';
    const service = setup('server');

    expect(service.hasConsent()).toBeFalse();
    expect(service.hasDeclined()).toBeFalse();
    expect(service.hasResponded()).toBeFalse();
  });

  it("n'ecrit aucun cookie depuis accept() ni decline()", () => {
    const service = setup('server');

    service.accept();
    service.decline();

    expect(document.cookie).not.toContain('dvg_cookie_consent');
  });

  it('lit et ecrit normalement cote navigateur — branche nominale', () => {
    const service = setup('browser');

    service.accept();

    expect(document.cookie).toContain('dvg_cookie_consent=accepted');
    expect(service.hasConsent()).toBeTrue();
  });
});
