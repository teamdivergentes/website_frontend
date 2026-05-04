import { ChangeDetectionStrategy, Component, OnInit, inject, DOCUMENT } from '@angular/core';
import { SeoService } from '../../shared/services/seo.service';
import { LiveStatusService } from '../../../shared/services/live-status.service';
import { SafePipe } from '../../shared/pipes/safe.pipe';

@Component({
  selector: 'app-twitch',
  standalone: true,
  imports: [SafePipe],
  templateUrl: './twitch.component.html',
  styleUrls: ['./twitch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TwitchComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  readonly liveStatus = inject(LiveStatusService);
  private readonly document = inject(DOCUMENT);

  // ── Signals exposés au template ────────────────────────────────────────────

  /** Chaînes en direct */
  readonly liveChannels = this.liveStatus.liveChannels;

  /** Chaînes hors-ligne */
  readonly offlineChannels = this.liveStatus.offlineChannels;

  /** Toutes les chaînes */
  readonly channels = this.liveStatus.channels;

  /** Nombre de streamers en direct */
  readonly liveCount = this.liveStatus.liveCount;

  /** Chargement initial */
  readonly loading = this.liveStatus.loading;

  /** Erreur de fetch */
  readonly hasError = this.liveStatus.hasError;

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'En live',
      description: 'Suivez Team Divergentes en direct sur Twitch.',
      url: '/twitch',
    });
  }

  // ── Helpers template ────────────────────────────────────────────────────────

  /**
   * Génère l'URL de l'embed Twitch pour un streamer.
   * Le parent doit correspondre au hostname pour respecter la politique Twitch.
   */
  getTwitchEmbedUrl(username: string): string {
    const parent = this.document.location.hostname;
    return `https://player.twitch.tv/?channel=${username}&parent=${parent}&autoplay=false`;
  }

  /**
   * Génère un lien direct vers la chaîne Twitch.
   */
  getTwitchChannelUrl(username: string): string {
    return `https://www.twitch.tv/${username}`;
  }

  /**
   * Formate le nombre de viewers pour l'affichage.
   * Au-dessus de 1000 : "1.2k", en dessous : valeur brute.
   */
  formatViewers(count?: number): string {
    if (count === undefined || count === null) return '0';
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  }

  /**
   * Génère l'URL de la miniature Twitch avec les dimensions demandées.
   * Format Twitch : {width}x{height} substitution dans l'URL.
   */
  getThumbnailUrl(thumbnailUrl?: string, width = 440, height = 248): string {
    if (!thumbnailUrl) return '';
    return thumbnailUrl.replace('{width}', width.toString()).replace('{height}', height.toString());
  }

  /** TrackBy pour les boucles de chaînes */
  trackByChannelId(_index: number, channel: { id: number }): number {
    return channel.id;
  }
}
