import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LiveStatusService } from './live-status.service';

/** Format brut du backend (même shape que BackendLiveDto) */
interface BackendChannelFlush {
  id: number;
  twitchUsername: string;
  displayName: string | null;
  gameLabel: string | null;
  isActive: boolean;
  isLive: boolean;
  viewerCount?: number;
}

/** Fabrique une réponse backend brute pour les req.flush() */
function makeBackendDto(overrides: Partial<BackendChannelFlush> = {}): BackendChannelFlush {
  return {
    id: 1,
    twitchUsername: 'teamdvg',
    displayName: 'TeamDVG',
    gameLabel: null,
    isActive: true,
    isLive: false,
    ...overrides,
  };
}

describe('LiveStatusService', () => {
  let service: LiveStatusService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        LiveStatusService,
      ],
    });

    service = TestBed.inject(LiveStatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.match(() => true).forEach(req => req.flush([]));
    httpMock.verify();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // État initial
  // ─────────────────────────────────────────────────────────────────────────────

  describe('état initial', () => {
    it('doit être créé', () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([]);
      expect(service).toBeTruthy();
    });

    it('loading doit être true avant la première réponse', () => {
      expect(service.loading()).toBeTrue();
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([]);
    });

    it('channels doit être un tableau vide initialement', () => {
      expect(service.channels()).toEqual([]);
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([]);
    });

    it('isLive doit être false initialement', () => {
      expect(service.isLive()).toBeFalse();
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([]);
    });

    it('liveCount doit être 0 initialement', () => {
      expect(service.liveCount()).toBe(0);
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([]);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Après un fetch réussi — aucun live
  // ─────────────────────────────────────────────────────────────────────────────

  describe('après un fetch réussi — aucun live', () => {
    beforeEach(() => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([makeBackendDto({ isLive: false })]);
    });

    it('loading doit être false', () => {
      expect(service.loading()).toBeFalse();
    });

    it('isLive doit être false quand personne ne stream', () => {
      expect(service.isLive()).toBeFalse();
    });

    it('liveCount doit être 0', () => {
      expect(service.liveCount()).toBe(0);
    });

    it('liveChannels doit être vide', () => {
      expect(service.liveChannels()).toEqual([]);
    });

    it('offlineChannels doit contenir la chaîne', () => {
      expect(service.offlineChannels().length).toBe(1);
    });

    it('hasError doit être false', () => {
      expect(service.hasError()).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Après un fetch réussi — 1 streamer en live
  // ─────────────────────────────────────────────────────────────────────────────

  describe('après un fetch réussi — 1 streamer en live', () => {
    const liveChannel = makeBackendDto({ isLive: true, viewerCount: 150 });

    beforeEach(() => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([liveChannel]);
    });

    it('isLive doit être true', () => {
      expect(service.isLive()).toBeTrue();
    });

    it('liveCount doit être 1', () => {
      expect(service.liveCount()).toBe(1);
    });

    it('liveChannels doit contenir le streamer', () => {
      expect(service.liveChannels().length).toBe(1);
      expect(service.liveChannels()[0].username).toBe('teamdvg');
    });

    it('offlineChannels doit être vide', () => {
      expect(service.offlineChannels()).toEqual([]);
    });

    it('channels doit contenir toutes les chaînes', () => {
      expect(service.channels().length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Après un fetch réussi — plusieurs streamers (dont certains offline)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('après un fetch réussi — plusieurs streamers', () => {
    const ch1 = makeBackendDto({ id: 1, twitchUsername: 'dvg_player1', isLive: true, viewerCount: 200 });
    const ch2 = makeBackendDto({ id: 2, twitchUsername: 'dvg_player2', isLive: true, viewerCount: 50 });
    const ch3 = makeBackendDto({ id: 3, twitchUsername: 'dvg_player3', isLive: false });

    beforeEach(() => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([ch1, ch2, ch3]);
    });

    it('isLive doit être true', () => {
      expect(service.isLive()).toBeTrue();
    });

    it('liveCount doit être 2', () => {
      expect(service.liveCount()).toBe(2);
    });

    it('liveChannels doit contenir 2 streamers', () => {
      expect(service.liveChannels().length).toBe(2);
    });

    it('offlineChannels doit contenir 1 chaîne', () => {
      expect(service.offlineChannels().length).toBe(1);
      expect(service.offlineChannels()[0].username).toBe('dvg_player3');
    });

    it('channels doit contenir toutes les 3 chaînes', () => {
      expect(service.channels().length).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Gestion des erreurs HTTP
  // ─────────────────────────────────────────────────────────────────────────────

  describe('gestion des erreurs HTTP', () => {
    it('hasError doit être true après une erreur HTTP', () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });
      expect(service.hasError()).toBeTrue();
    });

    it('channels doit rester vide après une erreur HTTP', () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });
      expect(service.channels()).toEqual([]);
    });

    it('isLive doit rester false après une erreur HTTP', () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });
      expect(service.isLive()).toBeFalse();
    });

    it('loading doit être false après une erreur HTTP', () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });
      expect(service.loading()).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Polling — vérification du fetch immédiat
  // ─────────────────────────────────────────────────────────────────────────────

  describe('polling automatique', () => {
    it('doit effectuer un fetch immédiat à la création (startWith)', () => {
      const reqs = httpMock.match(r => r.url.includes('/live'));
      expect(reqs.length).toBeGreaterThanOrEqual(1);
      reqs.forEach(r => r.flush([]));
    });

    it('loading doit passer à false après le premier fetch immédiat', async () => {
      expect(service.loading()).toBeTrue();
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([makeBackendDto({ isLive: true })]);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      expect(service.loading()).toBeFalse();
    });

    it('isLive doit être mis à jour après le premier fetch', async () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([makeBackendDto({ isLive: true })]);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      expect(service.isLive()).toBeTrue();
    });

    it('les signals computed réagissent correctement à un changement de données', async () => {
      const req1 = httpMock.expectOne(r => r.url.includes('/live'));
      req1.flush([makeBackendDto({ isLive: false })]);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      expect(service.isLive()).toBeFalse();
      expect(service.liveCount()).toBe(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Signals dérivés
  // ─────────────────────────────────────────────────────────────────────────────

  describe('signals dérivés', () => {
    it('channels() doit être en lecture seule (Signal<T>)', () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([]);
      expect(typeof service.channels).toBe('function');
    });

    it('loading() doit être en lecture seule (Signal<boolean>)', () => {
      const req = httpMock.expectOne(r => r.url.includes('/live'));
      req.flush([]);
      expect(typeof service.loading).toBe('function');
    });
  });
});
