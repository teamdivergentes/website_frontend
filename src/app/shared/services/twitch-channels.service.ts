import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../../shared/services/api/api.service';
import {
  TwitchChannel,
  CreateTwitchChannelDto,
  UpdateTwitchChannelDto,
  TwitchLiveStream
} from '../models/twitch-channel.model';

/**
 * Service de gestion des chaînes Twitch (admin CRUD + statut live)
 */
@Injectable({
  providedIn: 'root'
})
export class TwitchChannelsService {
  private readonly api = inject(ApiService);

  private readonly channelsSignal = signal<TwitchChannel[]>([]);
  private readonly liveStreamsSignal = signal<TwitchLiveStream[]>([]);

  /** Liste des chaînes triée par position */
  readonly channels = computed(() =>
    [...this.channelsSignal()].sort((a, b) => a.position - b.position)
  );

  /** Ensemble des usernames actuellement live */
  readonly liveUsernames = computed(
    () => new Set(this.liveStreamsSignal().filter(s => s.isLive).map(s => s.twitchUsername.toLowerCase()))
  );

  /** Vérifie si un username est live */
  isLive(username: string): boolean {
    return this.liveUsernames().has(username.toLowerCase());
  }

  // ========== Admin CRUD ==========

  /**
   * Charge toutes les chaînes depuis l'admin API
   */
  loadChannels(): Observable<TwitchChannel[]> {
    return this.api.get<TwitchChannel[]>('/api/admin/twitch-channels').pipe(
      tap(channels => this.channelsSignal.set(channels))
    );
  }

  /**
   * Crée une nouvelle chaîne Twitch
   */
  createChannel(dto: CreateTwitchChannelDto): Observable<TwitchChannel> {
    return this.api.post<TwitchChannel>('/api/admin/twitch-channels', dto).pipe(
      tap(channel => this.channelsSignal.set([...this.channelsSignal(), channel]))
    );
  }

  /**
   * Met à jour une chaîne Twitch (PATCH partiel)
   */
  updateChannel(id: number, dto: UpdateTwitchChannelDto): Observable<TwitchChannel> {
    return this.api.patch<TwitchChannel>(`/api/admin/twitch-channels/${id}`, dto).pipe(
      tap(updated => {
        const list = this.channelsSignal();
        const idx = list.findIndex(c => c.id === id);
        if (idx !== -1) {
          const next = [...list];
          next[idx] = updated;
          this.channelsSignal.set(next);
        }
      })
    );
  }

  /**
   * Supprime une chaîne Twitch
   */
  deleteChannel(id: number): Observable<void> {
    return this.api.delete<void>(`/api/admin/twitch-channels/${id}`).pipe(
      tap(() => this.channelsSignal.set(this.channelsSignal().filter(c => c.id !== id)))
    );
  }

  /**
   * Réordonne les chaînes
   * @param orderedIds - Tableau d'IDs dans le nouvel ordre
   */
  reorderChannels(orderedIds: number[]): Observable<void> {
    return this.api.patch<void>('/api/admin/twitch-channels/reorder', { orderedIds });
  }

  // ========== Live status ==========

  /**
   * Charge les statuts live depuis le cache backend (60s)
   */
  loadLiveStatus(): Observable<TwitchLiveStream[]> {
    return this.api.get<TwitchLiveStream[]>('/api/twitch/live').pipe(
      tap(streams => this.liveStreamsSignal.set(streams))
    );
  }

  /**
   * Met à jour l'ordre optimiste du signal local
   */
  applyOptimisticReorder(orderedIds: number[]): void {
    const map = new Map(this.channelsSignal().map(c => [c.id, c]));
    const reordered = orderedIds
      .map((id, index) => {
        const channel = map.get(id);
        return channel ? { ...channel, position: index } : null;
      })
      .filter((c): c is TwitchChannel => c !== null);
    this.channelsSignal.set(reordered);
  }
}
