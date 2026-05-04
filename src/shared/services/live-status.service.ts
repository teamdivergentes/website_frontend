import { Injectable, DestroyRef, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, switchMap, catchError, of, startWith } from 'rxjs';
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

/** Réponse de l'endpoint /api/twitch-channels/live-status */
interface LiveStatusResponse {
  channels: TwitchChannelWithStatus[];
}

/** Intervalle de polling en millisecondes (60 secondes) */
const POLL_INTERVAL_MS = 60_000;

/**
 * Service singleton de statut live Twitch.
 *
 * Responsabilités :
 * - Interroger GET /api/twitch-channels/live-status toutes les 60 secondes
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

  private readonly apiUrl = `${environment.apiUrl}/api/twitch-channels/live-status`;

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
          this.http.get<LiveStatusResponse>(this.apiUrl).pipe(
            catchError(() => {
              this.errorSignal.set(true);
              return of({ channels: [] });
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        this.channelsSignal.set(response.channels);
        this.loadingSignal.set(false);
        // On réinitialise l'erreur si on a bien reçu des données
        if (response.channels.length > 0 || !this.errorSignal()) {
          this.errorSignal.set(false);
        }
      });
  }
}
