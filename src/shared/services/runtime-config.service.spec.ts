import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), RuntimeConfigService]
    });
    service = TestBed.inject(RuntimeConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('defaults', () => {
    it('should expose empty googleAnalyticsId by default', () => {
      expect(service.googleAnalyticsId).toBe('');
    });

    it('should expose empty matomoUrl by default', () => {
      expect(service.matomoUrl).toBe('');
    });

    it('should expose empty matomoSiteId by default', () => {
      expect(service.matomoSiteId).toBe('');
    });
  });

  describe('load()', () => {
    it('should merge fetched config into defaults', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify({
              googleAnalyticsId: 'G-TEST',
              matomoUrl: 'https://matomo.example.com/',
              matomoSiteId: '42'
            }),
            { status: 200 }
          )
        )
      );

      await service.load();

      expect(service.googleAnalyticsId).toBe('G-TEST');
      expect(service.matomoUrl).toBe('https://matomo.example.com/');
      expect(service.matomoSiteId).toBe('42');
    });

    it('should keep defaults when fetch fails', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.reject(new Error('network error')));

      await service.load();

      expect(service.matomoUrl).toBe('');
      expect(service.matomoSiteId).toBe('');
    });

    it('should keep defaults when response is not ok', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response('', { status: 404 }))
      );

      await service.load();

      expect(service.matomoUrl).toBe('');
      expect(service.matomoSiteId).toBe('');
    });
  });
});
