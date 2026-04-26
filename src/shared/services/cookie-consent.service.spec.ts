import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CookieConsentService } from './cookie-consent.service';

describe('CookieConsentService', () => {
  let service: CookieConsentService;

  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=; max-age=0; path=/`;
      }
    });

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    service = TestBed.inject(CookieConsentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for hasResponded when no cookie is set', () => {
    expect(service.hasResponded()).toBeFalse();
  });

  it('should return false for hasConsent when no cookie is set', () => {
    expect(service.hasConsent()).toBeFalse();
  });

  it('should return false for hasDeclined when no cookie is set', () => {
    expect(service.hasDeclined()).toBeFalse();
  });

  it('should set consent to accepted and hide banner on accept()', () => {
    service.showBanner.set(true);
    service.accept();
    expect(service.hasConsent()).toBeTrue();
    expect(service.hasDeclined()).toBeFalse();
    expect(service.hasResponded()).toBeTrue();
    expect(service.showBanner()).toBeFalse();
  });

  it('should set consent to declined and hide banner on decline()', () => {
    service.showBanner.set(true);
    service.decline();
    expect(service.hasConsent()).toBeFalse();
    expect(service.hasDeclined()).toBeTrue();
    expect(service.hasResponded()).toBeTrue();
    expect(service.showBanner()).toBeFalse();
  });

  it('should show banner on reopen()', () => {
    service.showBanner.set(false);
    service.reopen();
    expect(service.showBanner()).toBeTrue();
  });

  it('should initialize showBanner to false', () => {
    expect(service.showBanner()).toBeFalse();
  });

  it('should allow reopening banner after accept', () => {
    service.accept();
    service.reopen();
    expect(service.showBanner()).toBeTrue();
    expect(service.hasConsent()).toBeTrue();
  });
});
