import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { finalize } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TwitchChannelsService } from '../../../shared/services/twitch-channels.service';
import { TwitchChannel } from '../../../shared/models/twitch-channel.model';
import { TwitchChannelDialogComponent } from './twitch-channel-dialog.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { buildReorderMessage, buildReorderErrorMessage } from '../../../shared/utils/a11y-announce';

/** Intervalle de rafraichissement du statut live (60 s) */
const LIVE_REFRESH_INTERVAL_MS = 60_000;

@Component({
  selector: 'app-twitch-channels',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DragDropModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    ErrorStateComponent
  ],
  template: `
    <div class="twitch-channels-page">

      <!-- Header -->
      <div class="page-header">
        <h1>Chaînes Twitch</h1>
        <div class="header-actions">
          <button mat-stroked-button (click)="refreshLive()" [disabled]="refreshingLive()"
            aria-label="Rafraîchir le statut live">
            <mat-icon aria-hidden="true">refresh</mat-icon>
            Rafraîchir
          </button>
          <button mat-raised-button color="primary" (click)="openCreate()">
            <mat-icon aria-hidden="true">add</mat-icon>
            Nouvelle chaîne
          </button>
        </div>
      </div>

      <!-- Region aria-live pour les annonces de reorder -->
      <div class="visually-hidden" aria-live="polite" aria-atomic="true" role="status">{{ liveMessage() }}</div>

      <!-- Skeleton table -->
      @if (loading()) {
        <div class="skeleton-table" role="status" aria-label="Chargement en cours">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row">
              <div class="skeleton-block sk-handle"></div>
              <div class="skeleton-block sk-text sk-w-20"></div>
              <div class="skeleton-block sk-text sk-w-30"></div>
              <div class="skeleton-block sk-text sk-w-25"></div>
              <div class="skeleton-block sk-text sk-w-35"></div>
              <div class="skeleton-block sk-badge"></div>
              <div class="skeleton-block sk-icon"></div>
              <div class="skeleton-block sk-actions"></div>
            </div>
          }
        </div>
      } @else if (error()) {
        <app-error-state [message]="error()!" (retry)="retryLoad()" />
      } @else if (channels().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">live_tv</mat-icon>
          <p>Aucune chaîne Twitch configurée.</p>
          <button mat-stroked-button (click)="openCreate()">
            <mat-icon aria-hidden="true">add</mat-icon>
            Ajouter la première chaîne
          </button>
        </div>
      } @else {
        <!-- Table avec drag-drop -->
        <div class="table-wrapper">
          <table class="channels-table" aria-label="Liste des chaînes Twitch">
            <thead>
              <tr>
                <th class="col-drag" aria-label="Réordonner"></th>
                <th class="col-kb" aria-label="Contrôles clavier"></th>
                <th class="col-pseudo">Pseudo</th>
                <th class="col-display">Nom affiché</th>
                <th class="col-game">Jeu</th>
                <th class="col-member">Joueur lié</th>
                <th class="col-live">Statut</th>
                <th class="col-active">Actif</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody cdkDropList (cdkDropListDropped)="onDrop($event)" aria-label="Liste des chaînes, réordonnable">
              @for (channel of channels(); track channel.id; let i = $index) {
                <tr cdkDrag class="channel-row" [class.inactive]="!channel.isActive">
                  <!-- Drag handle -->
                  <td class="col-drag">
                    <span cdkDragHandle class="drag-handle" matTooltip="Glisser pour réordonner"
                      aria-hidden="true">
                      <mat-icon aria-hidden="true">drag_indicator</mat-icon>
                    </span>
                    <!-- Preview CDK drag -->
                    <div *cdkDragPlaceholder class="drag-placeholder"></div>
                  </td>

                  <!-- Boutons monter/descendre -->
                  <td class="col-kb">
                    <div class="kb-actions">
                      <button mat-icon-button
                        [disabled]="reordering() || i === 0"
                        (click)="onReorder(i, i - 1)"
                        [attr.aria-label]="'Deplacer ' + channel.twitchUsername + ' vers le haut'"
                        matTooltip="Monter">
                        <mat-icon aria-hidden="true">arrow_upward</mat-icon>
                      </button>
                      <button mat-icon-button
                        [disabled]="reordering() || i === channels().length - 1"
                        (click)="onReorder(i, i + 1)"
                        [attr.aria-label]="'Deplacer ' + channel.twitchUsername + ' vers le bas'"
                        matTooltip="Descendre">
                        <mat-icon aria-hidden="true">arrow_downward</mat-icon>
                      </button>
                    </div>
                  </td>

                  <!-- Pseudo -->
                  <td class="col-pseudo">
                    <strong class="username">{{ channel.twitchUsername }}</strong>
                  </td>

                  <!-- Display name -->
                  <td class="col-display">
                    {{ channel.displayName || channel.twitchUsername }}
                  </td>

                  <!-- Jeu -->
                  <td class="col-game">
                    {{ channel.gameLabel || '—' }}
                  </td>

                  <!-- Joueur lie -->
                  <td class="col-member">
                    @if (channel.teamMember) {
                      <span class="member-label">
                        {{ channel.teamMember.team.name }} · {{ channel.teamMember.role }} — {{ channel.teamMember.name }}
                      </span>
                    } @else {
                      <span class="no-member">Aucun (ambassadeur)</span>
                    }
                  </td>

                  <!-- Statut LIVE -->
                  <td class="col-live">
                    @if (isLive(channel.twitchUsername)) {
                      <span class="badge badge-live" role="status" aria-label="En direct">
                        <span class="led led-live" aria-hidden="true"></span>
                        EN LIVE
                      </span>
                    } @else {
                      <span class="badge badge-offline" role="status" aria-label="Hors ligne">
                        <span class="led led-offline" aria-hidden="true"></span>
                        OFFLINE
                      </span>
                    }
                  </td>

                  <!-- Actif -->
                  <td class="col-active">
                    @if (channel.isActive) {
                      <mat-icon class="icon-active" aria-label="Chaîne active">check_circle</mat-icon>
                    } @else {
                      <mat-icon class="icon-inactive" aria-label="Chaîne inactive">cancel</mat-icon>
                    }
                  </td>

                  <!-- Actions -->
                  <td class="col-actions">
                    <button mat-icon-button (click)="openEdit(channel)"
                      [attr.aria-label]="'Modifier ' + channel.twitchUsername"
                      matTooltip="Modifier">
                      <mat-icon aria-hidden="true">edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="confirmDelete(channel)"
                      [attr.aria-label]="'Supprimer ' + channel.twitchUsername"
                      matTooltip="Supprimer">
                      <mat-icon aria-hidden="true">delete</mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Footer info -->
      <p class="footer-info">
        <mat-icon aria-hidden="true" class="info-icon">info_outline</mat-icon>
        Le statut LIVE se rafraîchit automatiquement toutes les 60 s via l'API Twitch Helix.
      </p>

    </div>
  `,
  styles: [`
    /* ===== Layout ===== */
    .header-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    /* ===== Skeleton ===== */
    @keyframes skeleton-pulse {
      0%, 100% { background-position: 200% 0; }
      50% { background-position: 0 0; }
    }

    .skeleton-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--darkBackground, #0C0D0C);
      border: 1px solid var(--darkGreen, #28413B);
      border-radius: 8px;
    }

    .skeleton-block {
      background: linear-gradient(
        90deg,
        rgba(40, 65, 59, 0.3) 0%,
        rgba(50, 210, 153, 0.08) 50%,
        rgba(40, 65, 59, 0.3) 100%
      );
      background-size: 200% 100%;
      border-radius: 4px;
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .sk-handle { width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; }
    .sk-text { height: 14px; }
    .sk-w-20 { width: 20%; }
    .sk-w-25 { width: 25%; }
    .sk-w-30 { width: 30%; }
    .sk-w-35 { width: 35%; }
    .sk-badge { width: 70px; height: 22px; border-radius: 11px; }
    .sk-icon { width: 24px; height: 24px; border-radius: 50%; }
    .sk-actions { width: 80px; height: 32px; border-radius: 6px; }

    /* ===== Table ===== */
    .table-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--darkGreen, #28413B);
    }

    .channels-table {
      width: 100%;
      border-collapse: collapse;

      thead tr {
        background: rgba(40, 65, 59, 0.3);
      }

      th, td {
        padding: 0.75rem 1rem;
        text-align: left;
        font-size: 0.875rem;
        border-bottom: 1px solid rgba(40, 65, 59, 0.4);
        vertical-align: middle;
        white-space: nowrap;
      }

      th {
        font-weight: 600;
        color: var(--gray, #999);
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
      }
    }

    .channel-row {
      transition: background 0.15s;

      &:hover {
        background: rgba(40, 65, 59, 0.15);
      }

      &.inactive {
        opacity: 0.55;
      }
    }

    .col-drag { width: 40px; }
    .col-kb { width: 88px; }
    .col-pseudo { min-width: 140px; }
    .col-display { min-width: 140px; }
    .col-game { min-width: 160px; }
    .col-member { min-width: 240px; }
    .col-live { width: 110px; }
    .col-active { width: 60px; text-align: center; }
    .col-actions { width: 100px; }

    /* ===== Boutons monter/descendre ===== */
    .kb-actions {
      display: flex;
      flex-direction: row;
      gap: 0;
    }

    /* ===== Drag handle ===== */
    .drag-handle {
      display: inline-flex;
      align-items: center;
      cursor: move;
      color: var(--gray, #999);
      padding: 2px;
      border-radius: 4px;
      transition: color 0.15s;

      &:hover, &:focus {
        color: var(--green, #32D299);
        outline: 2px solid var(--green, #32D299);
        outline-offset: 2px;
      }
    }

    .drag-placeholder {
      height: 48px;
      background: rgba(50, 210, 153, 0.05);
      border: 2px dashed var(--green, #32D299);
      border-radius: 4px;
    }

    /* ===== Username ===== */
    .username {
      color: var(--white, #fff);
    }

    /* ===== Member label ===== */
    .member-label {
      font-size: 0.8125rem;
      color: var(--gray, #aaa);
    }

    .no-member {
      font-size: 0.8125rem;
      color: rgba(153, 153, 153, 0.5);
      font-style: italic;
    }

    /* ===== Badges LIVE / OFFLINE ===== */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .badge-live {
      background: rgba(220, 38, 38, 0.15);
      color: #ef4444;
      border: 1px solid rgba(220, 38, 38, 0.4);
    }

    .badge-offline {
      background: rgba(100, 100, 100, 0.15);
      color: #888;
      border: 1px solid rgba(100, 100, 100, 0.3);
    }

    /* LED indicator */
    .led {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .led-live {
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
      animation: led-pulse 1.2s ease-in-out infinite;
    }

    .led-offline {
      background: #666;
    }

    @keyframes led-pulse {
      0%, 100% { box-shadow: 0 0 4px #ef4444; }
      50% { box-shadow: 0 0 10px #ef4444, 0 0 20px rgba(239, 68, 68, 0.4); }
    }

    /* ===== Active icons ===== */
    .icon-active {
      color: var(--green, #32D299);
      font-size: 1.25rem;
    }

    .icon-inactive {
      color: var(--gray, #666);
      font-size: 1.25rem;
    }

    /* ===== Empty state ===== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 4rem 2rem;
      text-align: center;
      color: var(--gray, #999);

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: var(--darkGreen, #28413B);
      }

      p {
        margin: 0;
        font-size: 1rem;
      }
    }

    /* ===== Footer ===== */
    .footer-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.25rem;
      font-size: 0.8125rem;
      color: var(--gray, #888);
    }

    .info-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }

    /* ===== CDK drag ===== */
    .cdk-drag-preview {
      display: flex;
      align-items: center;
      background: var(--lightBlack, #101111);
      border: 1px solid var(--green, #32D299);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      opacity: 0.95;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .channels-table tbody.cdk-drop-list-dragging .channel-row:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .col-game, .col-member {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .col-display {
        display: none;
      }
    }
  `]
})
export class TwitchChannelsComponent implements OnInit, OnDestroy {
  private readonly channelsService = inject(TwitchChannelsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal<boolean>(false);
  /** Erreur de chargement persistante, exclusive de l'etat vide (EPIC-41). */
  readonly error = signal<string | null>(null);
  readonly refreshingLive = signal<boolean>(false);
  /** Message annonce par la region aria-live apres chaque reorder. */
  readonly liveMessage = signal('');
  /** Guard anti-double-clic : bloque les appels API de reorder concurrents (SEC-PR206-001). */
  protected readonly reordering = signal(false);

  /** Reactive signal expose depuis le service */
  readonly channels = this.channelsService.channels;

  private liveRefreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.loadChannels();
    this.scheduleLiveRefresh();
  }

  ngOnDestroy(): void {
    if (this.liveRefreshTimer) {
      clearInterval(this.liveRefreshTimer);
    }
  }

  private loadChannels(): void {
    this.loading.set(true);
    this.error.set(null);
    this.channelsService.loadChannels().subscribe({
      next: () => {
        this.loading.set(false);
        this.loadLiveStatus();
      },
      error: () => {
        this.loading.set(false);
        // Pas de snackbar : il disparaissait en laissant "Aucune chaine Twitch
        // configuree." a l'ecran, ce qui laissait croire a une base vide.
        this.error.set('Impossible de charger les chaînes Twitch.');
      }
    });
  }

  /** Relance le chargement apres une erreur, sans rechargement de page. */
  retryLoad(): void {
    this.loadChannels();
  }

  private loadLiveStatus(): void {
    this.channelsService.loadLiveStatus().subscribe({
      error: (err) => console.warn('Live status unavailable:', err)
    });
  }

  private scheduleLiveRefresh(): void {
    this.liveRefreshTimer = setInterval(() => this.loadLiveStatus(), LIVE_REFRESH_INTERVAL_MS);
  }

  /** Forcer le rafraichissement du statut live */
  refreshLive(): void {
    this.refreshingLive.set(true);
    this.channelsService.loadLiveStatus().subscribe({
      next: () => this.refreshingLive.set(false),
      error: () => {
        this.refreshingLive.set(false);
        this.snackBar.open('Impossible de rafraîchir le statut live', 'OK', { duration: 3000 });
      }
    });
  }

  /** Verifie si un username est actuellement live */
  isLive(username: string): boolean {
    return this.channelsService.isLive(username);
  }

  /**
   * Gere le drop CDK (drag-drop souris).
   */
  onDrop(event: CdkDragDrop<TwitchChannel[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.onReorder(event.previousIndex, event.currentIndex);
  }

  /**
   * Logique commune de reorder (appele par drag-drop ET par les boutons Monter/Descendre).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    if (this.reordering()) return;
    this.reordering.set(true);

    const channels = [...this.channels()];
    moveItemInArray(channels, fromIndex, toIndex);
    const movedChannel = channels[toIndex];

    const orderedIds = channels.map(c => c.id);
    // Optimistic update
    this.channelsService.applyOptimisticReorder(orderedIds);

    this.channelsService.reorderChannels(orderedIds).pipe(
      finalize(() => this.reordering.set(false))
    ).subscribe({
      next: () => {
        this.snackBar.open('Ordre mis à jour', 'OK', { duration: 2000 });
        if (movedChannel) {
          this.liveMessage.set(buildReorderMessage(movedChannel.twitchUsername, toIndex + 1, channels.length));
        }
      },
      error: () => {
        // Rollback
        this.loadChannels();
        this.snackBar.open('Erreur lors de la réorganisation', 'OK', { duration: 3000 });
        if (movedChannel) {
          this.liveMessage.set(buildReorderErrorMessage(movedChannel.twitchUsername));
        }
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(TwitchChannelDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {}
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Chaîne créée avec succès', 'OK', { duration: 2500 });
        this.loadChannels();
      }
    });
  }

  openEdit(channel: TwitchChannel): void {
    const ref = this.dialog.open(TwitchChannelDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { channel }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Chaîne mise à jour', 'OK', { duration: 2500 });
        this.loadChannels();
      }
    });
  }

  confirmDelete(channel: TwitchChannel): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer la chaîne "${channel.twitchUsername}" ?`
      }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.channelsService.deleteChannel(channel.id).subscribe({
        next: () => {
          this.snackBar.open('Chaîne supprimée', 'OK', { duration: 2500 });
        },
        error: () => {
          this.snackBar.open('Erreur lors de la suppression', 'OK', { duration: 3000 });
        }
      });
    });
  }
}
