import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { TwitchChannelsService } from './twitch-channels.service';
import type {
  TwitchChannel,
  TwitchLiveStream,
} from '../models/twitch-channel.model';

const BASE = 'http://localhost:3000';

const mockChannel = (
  overrides: Partial<TwitchChannel> = {}
): TwitchChannel => ({
  id: 1,
  twitchUsername: 'StreamerA',
  displayName: 'Streamer A',
  gameLabel: 'Valorant',
  description: undefined,
  teamMemberId: undefined,
  teamMember: undefined,
  position: 0,
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('TwitchChannelsService', () => {
  let service: TwitchChannelsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TwitchChannelsService,
      ],
    });
    service = TestBed.inject(TwitchChannelsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ── reorderChannels ──────────────────────────────────────────────────

  it('reorderChannels doit envoyer PATCH /api/admin/twitch-channels/reorder avec { items: [{id, position}] }', () => {
    const orderedIds = [3, 1, 2];

    service.reorderChannels(orderedIds).subscribe();

    const req = http.expectOne(
      `${BASE}/api/admin/twitch-channels/reorder`
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      items: [
        { id: 3, position: 0 },
        { id: 1, position: 1 },
        { id: 2, position: 2 },
      ],
    });
    req.flush(null);
  });

  // ── loadLiveStatus ───────────────────────────────────────────────────

  it('loadLiveStatus doit appeler GET /api/twitch-channels/live', () => {
    const mockStreams: TwitchLiveStream[] = [
      {
        twitchUsername: 'StreamerA',
        isLive: true,
        title: 'Live!',
        viewerCount: 42,
      },
    ];

    service.loadLiveStatus().subscribe((streams) => {
      expect(streams).toEqual(mockStreams);
    });

    const req = http.expectOne(`${BASE}/api/twitch-channels/live`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStreams);
  });

  it('loadLiveStatus doit mettre a jour le signal liveUsernames', () => {
    const mockStreams: TwitchLiveStream[] = [
      { twitchUsername: 'StreamerA', isLive: true },
      { twitchUsername: 'StreamerB', isLive: false },
    ];

    service.loadLiveStatus().subscribe();
    http
      .expectOne(`${BASE}/api/twitch-channels/live`)
      .flush(mockStreams);

    expect(service.isLive('StreamerA')).toBeTrue();
    expect(service.isLive('StreamerB')).toBeFalse();
  });

  // ── applyOptimisticReorder ───────────────────────────────────────────

  it('applyOptimisticReorder doit reordonner le signal channels', () => {
    const channels = [
      mockChannel({ id: 1, position: 0 }),
      mockChannel({ id: 2, position: 1 }),
      mockChannel({ id: 3, position: 2 }),
    ];

    // seed the signal via loadChannels
    service.loadChannels().subscribe();
    http
      .expectOne(`${BASE}/api/admin/twitch-channels`)
      .flush(channels);

    service.applyOptimisticReorder([3, 1, 2]);

    const result = service.channels();
    expect(result.map((c) => c.id)).toEqual([3, 1, 2]);
    expect(result[0].position).toBe(0);
    expect(result[1].position).toBe(1);
    expect(result[2].position).toBe(2);
  });
});
