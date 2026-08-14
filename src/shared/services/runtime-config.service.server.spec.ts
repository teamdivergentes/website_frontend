import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

import { RuntimeConfigService, readConfigFromEnv } from './runtime-config.service';

type ProcessLike = { env?: Record<string, string | undefined> };

/**
 * EPIC-29 — cote Node, `fetch('/assets/config.json')` echoue faute d'origine.
 * Les memes valeurs sont lues dans l'environnement du conteneur, sans quoi
 * `siteUrl` retomberait sur la prod et la preprod emettrait des `og:url` faux.
 */
describe('RuntimeConfigService — rendu serveur', () => {
  let originalProcess: ProcessLike | undefined;

  function setup(platform: 'server' | 'browser'): RuntimeConfigService {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: platform }],
    });
    return TestBed.inject(RuntimeConfigService);
  }

  beforeEach(() => {
    originalProcess = (globalThis as { process?: ProcessLike }).process;
  });

  afterEach(() => {
    if (originalProcess === undefined) {
      delete (globalThis as { process?: ProcessLike }).process;
    } else {
      (globalThis as { process?: ProcessLike }).process = originalProcess;
    }
  });

  it("lit la config dans l'environnement sans appeler fetch", async () => {
    (globalThis as { process?: ProcessLike }).process = {
      env: {
        SITE_URL: 'https://preprod.teamdivergentes.fr',
        GOOGLE_ANALYTICS_ID: 'G-PREPROD123',
        MATOMO_URL: 'https://matomo.example.com',
        MATOMO_SITE_ID: '7',
      },
    };
    const fetchSpy = spyOn(globalThis, 'fetch');
    const service = setup('server');

    await service.load();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(service.siteUrl).toBe('https://preprod.teamdivergentes.fr');
    expect(service.googleAnalyticsId).toBe('G-PREPROD123');
    expect(service.matomoUrl).toBe('https://matomo.example.com');
    expect(service.matomoSiteId).toBe('7');
  });

  it('retombe sur le domaine de production quand SITE_URL est absente', async () => {
    (globalThis as { process?: ProcessLike }).process = { env: {} };
    const service = setup('server');

    await service.load();

    expect(service.siteUrl).toBe('https://teamdivergentes.fr');
  });

  it('passe toujours par fetch cote navigateur — branche nominale', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(
      new Response(JSON.stringify({ siteUrl: 'https://teamdivergentes.fr' }), { status: 200 })
    );
    const service = setup('browser');

    await service.load();

    expect(fetchSpy).toHaveBeenCalledWith('/assets/config.json');
  });

  describe('readConfigFromEnv', () => {
    it('retourne un objet vide quand process est absent', () => {
      delete (globalThis as { process?: ProcessLike }).process;

      expect(readConfigFromEnv()).toEqual({});
    });

    it('ignore les variables vides pour ne pas ecraser les valeurs par defaut', () => {
      (globalThis as { process?: ProcessLike }).process = {
        env: { SITE_URL: '', MATOMO_URL: 'https://matomo.example.com' },
      };

      expect(readConfigFromEnv()).toEqual({ matomoUrl: 'https://matomo.example.com' });
    });
  });
});
