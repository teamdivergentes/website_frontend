import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        RuntimeConfigService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ]
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

  describe('siteUrl getter', () => {
    it('should return the configured siteUrl when set in config.json', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify({ siteUrl: 'https://preprod.teamdivergentes.fr' }),
            { status: 200 }
          )
        )
      );

      await service.load();

      expect(service.siteUrl).toBe('https://preprod.teamdivergentes.fr');
    });

    it('should fall back to window.location.origin in browser when siteUrl is empty', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(JSON.stringify({ siteUrl: '' }), { status: 200 })
        )
      );

      await service.load();

      expect(service.siteUrl).toBe(window.location.origin);
    });

    it('should fall back to https://teamdivergentes.fr in SSR context (non-browser)', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          RuntimeConfigService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ]
      });
      const ssrService = TestBed.inject(RuntimeConfigService);

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(JSON.stringify({ siteUrl: '' }), { status: 200 })
        )
      );

      await ssrService.load();

      expect(ssrService.siteUrl).toBe('https://teamdivergentes.fr');
    });

    it('should return configured siteUrl without calling window.location.origin', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(
          new Response(
            JSON.stringify({ siteUrl: 'https://teamdivergentes.fr' }),
            { status: 200 }
          )
        )
      );

      await service.load();

      // Should not fall through to window.location.origin (already set)
      expect(service.siteUrl).toBe('https://teamdivergentes.fr');
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
