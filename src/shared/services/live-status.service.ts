import { Injectable, DestroyRef, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, switchMap, catchError, of, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';

/** Représentation d'une chaîne Twitch avec son statut de diffusion */
export interface TwitchChannelWithStatus {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  isLive: boolean;
  viewerCount?: number;
  gameName?: string;
  thumbnailUrl?: string;
}

/** Format brut retourné par GET /api/twitch-channels/live */
interface BackendLiveDto {
  id: number;
  twitchUsername: string;
  displayName: string | null;
  gameLabel: string | null;
  isActive: boolean;
  isLive: boolean;
  viewerCount?: number;
  streamGameLabel?: string;
  streamThumbnailUrl?: string;
}

/** Intervalle de polling en millisecondes (60 secondes) */
const POLL_INTERVAL_MS = 60_000;

/**
 * Service singleton de statut live Twitch.
 *
 * Responsabilités :
 * - Interroger GET /api/twitch-channels/live toutes les 60 secondes
 * - Exposer des Signals réactifs pour le header LED et la page /twitch
 * - Polling unique partagé entre tous les consommateurs (singleton root)
 *
 * Usage :
 *   const liveStatus = inject(LiveStatusService);
 *   liveStatus.isLive()       // boolean
 *   liveStatus.liveCount()    // number
 *   liveStatus.channels()     // TwitchChannelWithStatus[]
 *   liveStatus.liveChannels() // TwitchChannelWithStatus[] (filtrés isLive)
 */
@Injectable({
  providedIn: 'root',
})
export class LiveStatusService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly apiUrl = `${environment.apiUrl}/api/twitch-channels/live`;

  // ── Signals privés ──────────────────────────────────────────────────────────

  private readonly channelsSignal = signal<TwitchChannelWithStatus[]>([]);
  private readonly loadingSignal = signal<boolean>(true);
  private readonly errorSignal = signal<boolean>(false);

  // ── Signals publics ─────────────────────────────────────────────────────────

  /** Toutes les chaînes actives avec leur statut */
  readonly channels = this.channelsSignal.asReadonly();

  /** true si au moins un streamer est en direct */
  readonly isLive = computed(() => this.channelsSignal().some(c => c.isLive));

  /** Nombre de streamers actuellement en direct */
  readonly liveCount = computed(() => this.channelsSignal().filter(c => c.isLive).length);

  /** Chaînes actuellement en direct */
  readonly liveChannels = computed(() => this.channelsSignal().filter(c => c.isLive));

  /** Chaînes actives non en direct */
  readonly offlineChannels = computed(() => this.channelsSignal().filter(c => !c.isLive));

  /** true pendant le premier chargement */
  readonly loading = this.loadingSignal.asReadonly();

  /** true si l'API a retourné une erreur */
  readonly hasError = this.errorSignal.asReadonly();

  // ── Polling ─────────────────────────────────────────────────────────────────

  constructor() {
    this.startPolling();
  }

  /**
   * Démarre le polling automatique.
   * Déclenche immédiatement un premier fetch (startWith), puis toutes les 60 s.
   * La désinscription est gérée automatiquement par takeUntilDestroyed.
   */
  private startPolling(): void {
    interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.http.get<BackendLiveDto[]>(this.apiUrl).pipe(
            map(items => items.map(this.mapToStatus)),
            catchError(() => {
              this.errorSignal.set(true);
              return of<TwitchChannelWithStatus[]>([]);
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(channels => {
        this.channelsSignal.set(channels);
        this.loadingSignal.set(false);
        if (channels.length > 0 || !this.errorSignal()) {
          this.errorSignal.set(false);
        }
      });
  }

  /** Convertit le DTO backend vers le modèle interne du frontend */
  private readonly mapToStatus = (dto: BackendLiveDto): TwitchChannelWithStatus => ({
    id: dto.id,
    username: dto.twitchUsername,
    displayName: dto.displayName ?? dto.twitchUsername,
    active: dto.isActive,
    isLive: dto.isLive,
    viewerCount: dto.viewerCount,
    gameName: dto.streamGameLabel ?? dto.gameLabel ?? undefined,
    thumbnailUrl: dto.streamThumbnailUrl,
  });
}
