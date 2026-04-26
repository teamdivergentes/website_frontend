import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GamesService } from '../../../shared/services/games.service';
import { Game } from '../../../shared/models';
import { GameFormDialogComponent } from './game-form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

/**
 * Page d'administration des jeux avec drag & drop pour réordonner
 * Permet de créer, modifier, supprimer et activer/désactiver des jeux
 */
@Component({
  selector: 'app-games-admin',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="games-admin-page">
      <div class="page-header">
        <h1>Gestion des Jeux</h1>
        <button mat-raised-button color="primary" data-testid="games-create-btn" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouveau jeu
        </button>
      </div>

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="skeleton-list" role="status" aria-label="Chargement en cours">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton-item">
              <div class="skeleton-block skeleton-handle"></div>
              <div class="skeleton-block skeleton-thumb"></div>
              <div class="skeleton-info">
                <div class="skeleton-block skeleton-title-bar"></div>
                <div class="skeleton-block skeleton-subtitle-bar"></div>
              </div>
              <div class="skeleton-block skeleton-actions-bar"></div>
            </div>
          }
        </div>
      } @else if (games().length === 0) {
        <div class="empty-state">
          <p>Aucun jeu créé. Commencez par en ajouter un !</p>
          <button mat-stroked-button (click)="seedGames()">
            <mat-icon>auto_fix_high</mat-icon>
            Initialiser les jeux par défaut
          </button>
        </div>
      } @else {
        <div class="games-list" cdkDropList (cdkDropListDropped)="onDrop($event)">
          @for (game of games(); track trackByGame($index, game); let i = $index) {
            <div class="game-item" cdkDrag [attr.data-testid]="'game-row-' + i">
              <div class="drag-handle" cdkDragHandle matTooltip="Glisser pour réordonner">
                <mat-icon>drag_indicator</mat-icon>
              </div>

              <div class="game-image">
                @if (game.image) {
                  <img [src]="game.image" [alt]="game.name" />
                } @else {
                  <div class="no-image">
                    <mat-icon>sports_esports</mat-icon>
                  </div>
                }
              </div>

              <div class="game-info">
                <h3>{{ game.name }}</h3>
                <p class="game-key">Clé : {{ game.key }}</p>
              </div>

              <div class="game-actions">
                <mat-slide-toggle
                  [checked]="game.active"
                  (change)="toggleActive(game)"
                  [attr.aria-label]="(game.active ? 'Désactiver ' : 'Activer ') + game.name"
                  matTooltip="Activer/Désactiver">
                </mat-slide-toggle>

                <button mat-icon-button (click)="openEditDialog(game)"
                  [attr.aria-label]="'Modifier ' + game.name"
                  [attr.data-testid]="'game-edit-' + i"
                  matTooltip="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>

                <button mat-icon-button color="warn" (click)="deleteGame(game, $event)"
                  [attr.aria-label]="'Supprimer ' + game.name"
                  [attr.data-testid]="'game-delete-' + i"
                  matTooltip="Supprimer">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes skeleton-pulse {
      0%, 100% { background-position: 200% 0; }
      50% { background-position: 0 0; }
    }

    .skeleton-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--darkBackground);
      border: 1px solid var(--darkGreen);
      border-radius: 10px;
    }

    .skeleton-block {
      background: linear-gradient(90deg, rgba(40, 65, 59, 0.3) 0%, rgba(50, 210, 153, 0.08) 50%, rgba(40, 65, 59, 0.3) 100%);
      background-size: 200% 100%;
      border-radius: 6px;
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-handle { width: 24px; height: 24px; flex-shrink: 0; }
    .skeleton-thumb { width: 52px; height: 52px; border-radius: 8px; flex-shrink: 0; }
    .skeleton-info { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .skeleton-title-bar { width: 55%; height: 16px; }
    .skeleton-subtitle-bar { width: 35%; height: 12px; }
    .skeleton-actions-bar { width: 140px; height: 32px; border-radius: 8px; flex-shrink: 0; }

    .game-key {
      text-transform: lowercase;
    }
  `]
})
export class GamesComponent implements OnInit {
  private readonly gamesService = inject(GamesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  // Computed signal pour tous les jeux
  readonly games = this.gamesService.allGames;

  ngOnInit(): void {
    this.loadGames();
  }

  /**
   * Charge les jeux depuis l'API
   */
  loadGames(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.gamesService.loadGames().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des jeux');
        console.error('Load games error:', err);
      }
    });
  }

  /**
   * Seed les jeux par défaut
   */
  seedGames(): void {
    this.loading.set(true);
    this.gamesService.seedGames().subscribe({
      next: () => {
        this.loadGames();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors de l\'initialisation des jeux');
        console.error('Seed games error:', err);
      }
    });
  }

  /**
   * Gère le drop pour réordonner les jeux
   */
  onDrop(event: CdkDragDrop<Game[]>): void {
    const games = [...this.games()];
    moveItemInArray(games, event.previousIndex, event.currentIndex);

    // Met à jour les positions
    const reorderData = games.map((game, index) => ({
      id: game.id,
      position: index
    }));

    this.gamesService.reorderGames(reorderData).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        this.loadGames();
      }
    });
  }

  /**
   * Toggle actif/inactif d'un jeu
   */
  toggleActive(game: Game): void {
    this.gamesService.toggleGameActive(game.id).subscribe({
      next: () => {
        this.snackBar.open(
          `Jeu "${game.name}" ${game.active ? 'désactivé' : 'activé'}`,
          'Fermer',
          { duration: 3000 }
        );
      },
      error: (err) => {
        this.error.set('Erreur lors du changement de statut');
        console.error('Toggle error:', err);
        this.loadGames();
      }
    });
  }

  /**
   * Ouvre le modal de création de jeu
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(GameFormDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: { game: undefined }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGames();
      }
    });
  }

  /**
   * Ouvre le modal d'édition de jeu
   */
  openEditDialog(game: Game): void {
    const dialogRef = this.dialog.open(GameFormDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: { game }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadGames();
      }
    });
  }

  /**
   * Supprime un jeu
   */
  deleteGame(game: Game, event: Event): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer le jeu "${game.name}" ?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.gamesService.deleteGame(game.id).subscribe({
        next: () => {
          // La suppression est gérée par le signal dans le service
        },
        error: (err) => {
          this.error.set('Erreur lors de la suppression');
          console.error('Delete error:', err);
        }
      });
    });
  }

  /**
   * TrackBy pour optimiser le rendu
   */
  trackByGame(index: number, game: Game): number {
    return game.id;
  }
}
