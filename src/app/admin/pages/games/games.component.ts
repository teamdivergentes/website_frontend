import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GamesService } from '../../../shared/services/games.service';
import { Game } from '../../../shared/models';
import { GameFormDialogComponent } from './game-form-dialog.component';

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
    MatTooltipModule
  ],
  template: `
    <div class="games-admin-page">
      <div class="page-header">
        <h1>Gestion des Jeux</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouveau jeu
        </button>
      </div>

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="loading">Chargement...</div>
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
          @for (game of games(); track trackByGame($index, game)) {
            <div class="game-item" cdkDrag>
              <div class="drag-handle" cdkDragHandle>
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
                  matTooltip="Activer/Désactiver">
                </mat-slide-toggle>

                <button mat-icon-button (click)="openEditDialog(game)" matTooltip="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>

                <button mat-icon-button color="warn" (click)="deleteGame(game, $event)" matTooltip="Supprimer">
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
    .games-admin-page {
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        margin: 0;
        color: var(--white, #fff);
      }
    }

    .error-message {
      padding: 1rem;
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--gray, #999);

      button {
        margin-top: 1rem;
      }
    }

    .games-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .game-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--card-bg, #1e1e1e);
      border-radius: 8px;
      border: 1px solid var(--border, #333);
      transition: all 0.2s;

      &:hover {
        border-color: var(--primary, #32D299);
      }
    }

    .drag-handle {
      cursor: move;
      color: var(--gray, #999);
    }

    .game-image {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-dark, #121212);
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        color: var(--gray, #999);
      }
    }

    .game-info {
      flex: 1;

      h3 {
        margin: 0 0 0.25rem 0;
        color: var(--white, #fff);
      }

      p {
        margin: 0.25rem 0;
        color: var(--gray, #999);
        font-size: 0.875rem;
      }
    }

    .game-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cdk-drag-preview {
      opacity: 0.8;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class GamesComponent implements OnInit {
  private readonly gamesService = inject(GamesService);
  private readonly dialog = inject(MatDialog);

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

    if (!window.confirm(`Voulez-vous vraiment supprimer le jeu "${game.name}" ?`)) {
      return;
    }

    this.gamesService.deleteGame(game.id).subscribe({
      next: () => {
        // La suppression est gérée par le signal dans le service
      },
      error: (err) => {
        this.error.set('Erreur lors de la suppression');
        console.error('Delete error:', err);
      }
    });
  }

  /**
   * TrackBy pour optimiser le rendu
   */
  trackByGame(index: number, game: Game): number {
    return game.id;
  }
}
