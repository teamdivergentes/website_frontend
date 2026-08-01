import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
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
import { SkeletonComponent } from '../../shared/skeleton.component';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { createReorder } from '../../shared/use-reorder';
import { AdminNotifier } from '../../shared/admin-notifier.service';

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
  ,
    SkeletonComponent,
    EmptyStateComponent],
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
        <app-skeleton variant="table" [rows]="5" [columns]="8" />
      } @else if (error()) {
        <app-error-state [message]="error()!" (retry)="retryLoad()" />
      } @else if (channels().length === 0) {
        <app-empty-state
          entity="chaîne Twitch"
          gender="f"
          icon="live_tv"
          actionLabel="Ajouter la première chaîne"
          (action)="openCreate()"
        />
      } @else {
        <!-- Table avec drag-drop -->
        <div class="table-wrapper">
          <table class="channels-table" aria-label="Liste des chaînes Twitch">
            <thead>
              <tr>
                <th class="col-drag" aria-label="Réordonner"></th>
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
                  <!-- Drag handle (souris + clavier grab & move) -->
                  <td class="col-drag">
                    <span cdkDragHandle class="drag-handle"
                      [class.grabbed]="grabbedIndex() === i"
                      tabindex="0"
                      role="button"
                      aria-roledescription="element reordonnable"
                      [attr.aria-label]="'Reordonner ' + channel.twitchUsername + ', position ' + (i + 1) + ' sur ' + channels().length"
                      matTooltip="Glisser ou Espace pour réordonner"
                      (keydown)="onHandleKeydown($event, i)">
                      <mat-icon aria-hidden="true">drag_indicator</mat-icon>
                    </span>
                    <!-- Preview CDK drag -->
                    <div *cdkDragPlaceholder class="drag-placeholder"></div>
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
      gap: var(--admin-space-3);
      align-items: center;
    }

    
    /* ===== Table ===== */
    .table-wrapper {
      overflow-x: auto;
      border-radius: var(--admin-radius-md);
      border: 1px solid var(--admin-border-strong);
    }

    .channels-table {
      width: 100%;
      border-collapse: collapse;

      thead tr {
        background: rgba(40, 65, 59, 0.3);
      }

      th, td {
        padding: var(--admin-space-3) var(--admin-space-4);
        text-align: left;
        font-size: var(--admin-font-md);
        border-bottom: 1px solid rgba(40, 65, 59, 0.4);
        vertical-align: middle;
        white-space: nowrap;
      }

      th {
        font-weight: 600;
        color: var(--gray, #999);
        text-transform: uppercase;
        font-size: var(--admin-font-xs);
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
    .col-pseudo { min-width: 140px; }
    .col-display { min-width: 140px; }
    .col-game { min-width: 160px; }
    .col-member { min-width: 240px; }
    .col-live { width: 110px; }
    .col-active { width: 60px; text-align: center; }
    .col-actions { width: 100px; }

    /* ===== Drag handle ===== */
    .drag-handle {
      display: inline-flex;
      align-items: center;
      cursor: move;
      color: var(--gray, #999);
      padding: var(--admin-space-05);
      border-radius: var(--admin-radius-xs);
      transition: color 0.15s;

      &:hover, &:focus {
        color: var(--admin-accent);
        outline: 2px solid var(--admin-accent);
        outline-offset: 2px;
      }

      &.grabbed {
        color: var(--admin-accent);
        outline: 2px solid var(--admin-accent);
        outline-offset: 2px;
        background: rgba(50, 210, 153, 0.12);
      }
    }

    .drag-placeholder {
      height: 48px;
      background: rgba(50, 210, 153, 0.05);
      border: 2px dashed var(--admin-accent);
      border-radius: var(--admin-radius-xs);
    }

    /* ===== Username ===== */
    .username {
      color: var(--admin-text);
    }

    /* ===== Member label ===== */
    .member-label {
      font-size: var(--admin-font-sm);
      color: var(--gray, #aaa);
    }

    .no-member {
      font-size: var(--admin-font-sm);
      color: rgba(153, 153, 153, 0.5);
      font-style: italic;
    }

    /* ===== Badges LIVE / OFFLINE ===== */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: var(--admin-space-2);
      padding: var(--admin-space-1) var(--admin-space-3);
      border-radius: var(--admin-radius-lg);
      font-size: var(--admin-font-xs);
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
      color: var(--admin-accent);
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
      gap: var(--admin-space-4);
      padding: var(--admin-space-9) var(--admin-space-7);
      text-align: center;
      color: var(--gray, #999);

      mat-icon {
        font-size: 3rem;
        width: 3rem;
        height: 3rem;
        color: var(--admin-border-strong);
      }

      p {
        margin: 0;
        font-size: var(--admin-font-lg);
      }
    }

    /* ===== Footer ===== */
    .footer-info {
      display: flex;
      align-items: center;
      gap: var(--admin-space-2);
      margin-top: 1.25rem;
      font-size: var(--admin-font-sm);
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
      background: var(--admin-surface);
      border: 1px solid var(--admin-accent);
      border-radius: var(--admin-radius-sm);
      padding: var(--admin-space-3) var(--admin-space-4);
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
  private readonly notifier = inject(AdminNotifier);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(AdminConfirmService);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal<boolean>(false);
  /** Erreur de chargement persistante, exclusive de l'etat vide (EPIC-41). */
  readonly error = signal<string | null>(null);
  readonly refreshingLive = signal<boolean>(false);

  /** Reactive signal expose depuis le service */
  readonly channels = this.channelsService.channels;

  /**
   * Reordonnancement delegue au helper partage.
   * Contrat different des autres services : un tableau d'identifiants, et
   * une mise a jour optimiste avant l'appel reseau — indispensable au
   * deplacement au clavier, dont les fleches n'affichent rien sans elle.
   */
  private readonly reorder = createReorder<TwitchChannel>({
    items: this.channels,
    label: (channel) => channel.twitchUsername,
    applyOptimistic: (ordered) =>
      this.channelsService.applyOptimisticReorder(ordered.map((channel) => channel.id)),
    persist: (ordered) =>
      this.channelsService.reorderChannels(ordered.map((channel) => channel.id)),
    onSuccess: () => this.notifier.success('Ordre mis à jour'),
    onError: () => {
      // Annule la mise a jour optimiste.
      this.loadChannels();
      this.notifier.error('Erreur lors de la réorganisation');
    },
  });

  readonly reordering = this.reorder.reordering;
  readonly liveMessage = this.reorder.liveMessage;
  readonly grabbedIndex = this.reorder.grabbedIndex;

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
    this.reorder.onDrop(event);
  }

  /**
   * Logique commune de reorder (appele par drag-drop souris).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    this.reorder.onReorder(fromIndex, toIndex);
  }

  /**
   * Deplacement au clavier (grab & move ARIA) sur la poignee de glissement.
   */
  onHandleKeydown(event: KeyboardEvent, currentIndex: number): void {
    this.reorder.onHandleKeydown(event, currentIndex);
  }

  openCreate(): void {
    const ref = this.adminDialog.open(TwitchChannelDialogComponent, 'md');
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Chaîne créée avec succès', 'OK', { duration: 2500 });
        this.loadChannels();
      }
    });
  }

  openEdit(channel: TwitchChannel): void {
    const ref = this.adminDialog.open(TwitchChannelDialogComponent, 'md', { channel });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Chaîne mise à jour', 'OK', { duration: 2500 });
        this.loadChannels();
      }
    });
  }

  confirmDelete(channel: TwitchChannel): void {
    this.confirm.delete('la chaîne', channel.twitchUsername).subscribe(confirmed => {
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
