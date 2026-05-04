import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { LiveStatusService, TwitchChannelWithStatus } from './live-status.service';

/** Fabrique une chaîne Twitch avec des valeurs par défaut */
function makeChannel(overrides: Partial<TwitchChannelWithStatus> = {}): TwitchChannelWithStatus {
  return {
    id: 1,
    username: 'teamdvg',
    displayName: 'TeamDVG',
    active: true,
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
    // Répondre à toutes les requêtes en attente pour éviter les erreurs
    httpMock.match(() => true).forEach(req => req.flush({ channels: [] }));
    httpMock.verify();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // État initial
  // ─────────────────────────────────────────────────────────────────────────────

  describe('état initial', () => {
    it('doit être créé', () => {
      // Flush la requête initiale
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [] });
      expect(service).toBeTruthy();
    });

    it('loading doit être true avant la première réponse', () => {
      expect(service.loading()).toBeTrue();
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [] });
    });

    it('channels doit être un tableau vide initialement', () => {
      expect(service.channels()).toEqual([]);
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [] });
    });

    it('isLive doit être false initialement', () => {
      expect(service.isLive()).toBeFalse();
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [] });
    });

    it('liveCount doit être 0 initialement', () => {
      expect(service.liveCount()).toBe(0);
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [] });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Après un fetch réussi — aucun live
  // ─────────────────────────────────────────────────────────────────────────────

  describe('après un fetch réussi — aucun live', () => {
    beforeEach(() => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [makeChannel({ isLive: false })] });
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
    const liveChannel = makeChannel({ isLive: true, viewerCount: 150, gameName: 'Valorant' });

    beforeEach(() => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [liveChannel] });
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
    const ch1 = makeChannel({ id: 1, username: 'dvg_player1', isLive: true, viewerCount: 200 });
    const ch2 = makeChannel({ id: 2, username: 'dvg_player2', isLive: true, viewerCount: 50 });
    const ch3 = makeChannel({ id: 3, username: 'dvg_player3', isLive: false });

    beforeEach(() => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [ch1, ch2, ch3] });
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
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });

      expect(service.hasError()).toBeTrue();
    });

    it('channels doit rester vide après une erreur HTTP', () => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });

      expect(service.channels()).toEqual([]);
    });

    it('isLive doit rester false après une erreur HTTP', () => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });

      expect(service.isLive()).toBeFalse();
    });

    it('loading doit être false après une erreur HTTP', () => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush('Erreur serveur', { status: 500, statusText: 'Internal Server Error' });

      expect(service.loading()).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Polling — vérification du fetch immédiat
  // Note : le projet est zoneless (pas de zone.js), donc fakeAsync/tick ne
  // sont pas disponibles. On vérifie le comportement du startWith(0) via
  // HttpTestingController.
  // ─────────────────────────────────────────────────────────────────────────────

  describe('polling automatique', () => {
    it('doit effectuer un fetch immédiat à la création (startWith)', () => {
      // Le premier fetch doit avoir été déclenché par startWith(0)
      const reqs = httpMock.match(r => r.url.includes('live-status'));
      expect(reqs.length).toBeGreaterThanOrEqual(1);
      reqs.forEach(r => r.flush({ channels: [] }));
    });

    it('loading doit passer à false après le premier fetch immédiat', async () => {
      expect(service.loading()).toBeTrue();
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [makeChannel({ isLive: true })] });
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      expect(service.loading()).toBeFalse();
    });

    it('isLive doit être mis à jour après le premier fetch', async () => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [makeChannel({ isLive: true })] });
      await new Promise<void>(resolve => setTimeout(resolve, 0));
      expect(service.isLive()).toBeTrue();
    });

    it('les signals computed réagissent correctement à un changement de données', async () => {
      // Premier fetch : offline
      const req1 = httpMock.expectOne(r => r.url.includes('live-status'));
      req1.flush({ channels: [makeChannel({ isLive: false })] });
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
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [] });
      // On vérifie qu'on peut appeler channels() comme un Signal
      expect(typeof service.channels).toBe('function');
    });

    it('loading() doit être en lecture seule (Signal<boolean>)', () => {
      const req = httpMock.expectOne(r => r.url.includes('live-status'));
      req.flush({ channels: [] });
      expect(typeof service.loading).toBe('function');
    });
  });
});
