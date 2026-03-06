import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TeamsService } from '../../../shared/services';
import { Team } from '../../../shared/models';
import { TeamFormDialogComponent } from './team-form-dialog.component';
import { TeamMembersDialogComponent } from './team-members-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

/**
 * Page d'administration des équipes avec drag & drop pour réordonner
 * Permet de créer, modifier, supprimer et activer/désactiver des équipes
 */
@Component({
  selector: 'app-teams-admin',
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
    .skeleton-actions-bar { width: 180px; height: 32px; border-radius: 8px; flex-shrink: 0; }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .page-header button {
        width: 100%;
      }

      .team-item {
        flex-wrap: wrap;
      }

      .team-info {
        min-width: 0;
        flex-basis: calc(100% - 100px);
      }

      .team-actions {
        width: 100%;
        justify-content: flex-end;
        padding-top: 0.5rem;
        border-top: 1px solid var(--darkGreen);
        margin-top: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .drag-handle {
        display: none;
      }
    }
  `],
  template: `
    <div class="teams-admin-page">
      <div class="page-header">
        <h1>Gestion des Équipes</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouvelle équipe
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
                <div class="skeleton-block skeleton-subtitle-bar" style="width:25%"></div>
              </div>
              <div class="skeleton-block skeleton-actions-bar"></div>
            </div>
          }
        </div>
      } @else if (teams().length === 0) {
        <div class="empty-state">
          <p>Aucune équipe créée. Commencez par en ajouter une !</p>
        </div>
      } @else {
        <div class="teams-list" cdkDropList (cdkDropListDropped)="onDrop($event)">
          @for (team of teams(); track trackByTeam($index, team)) {
            <div class="team-item" cdkDrag>
              <div class="drag-handle" cdkDragHandle matTooltip="Glisser pour réordonner">
                <mat-icon>drag_indicator</mat-icon>
              </div>

              <div class="team-image">
                @if (team.image) {
                  <img [src]="team.image" [alt]="team.name" />
                } @else {
                  <div class="no-image">
                    <mat-icon>image</mat-icon>
                  </div>
                }
              </div>

              <div class="team-info">
                <h3>{{ team.name }}</h3>
                <p class="team-game">{{ team.game }}</p>
                <p class="team-members">{{ team.membersCount || 0 }} membre(s)</p>
              </div>

              <div class="team-actions">
                <mat-slide-toggle
                  [checked]="team.active"
                  (change)="toggleActive(team, $event)"
                  [attr.aria-label]="(team.active ? 'Désactiver ' : 'Activer ') + team.name"
                  matTooltip="Activer/Désactiver">
                </mat-slide-toggle>

                <button mat-icon-button (click)="openMembersDialog(team)"
                  [attr.aria-label]="'Gérer les membres de ' + team.name"
                  matTooltip="Gérer les membres">
                  <mat-icon>group</mat-icon>
                </button>

                <button mat-icon-button (click)="openEditDialog(team)"
                  [attr.aria-label]="'Modifier ' + team.name"
                  matTooltip="Modifier">
                  <mat-icon>edit</mat-icon>
                </button>

                <button mat-icon-button color="warn" (click)="deleteTeam(team, $event)"
                  [attr.aria-label]="'Supprimer ' + team.name"
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
})
export class TeamsComponent implements OnInit {
  private readonly teamsService = inject(TeamsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  // Computed signal pour toutes les équipes
  readonly teams = this.teamsService.allTeams;

  ngOnInit(): void {
    this.loadTeams();
  }

  /**
   * Charge les équipes depuis l'API
   */
  loadTeams(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.teamsService.loadTeams().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des équipes');
        console.error('Load teams error:', err);
      }
    });
  }

  /**
   * Gère le drop pour réordonner les équipes
   */
  onDrop(event: CdkDragDrop<Team[]>): void {
    const teams = [...this.teams()];
    moveItemInArray(teams, event.previousIndex, event.currentIndex);

    // Met à jour les positions
    const reorderData = teams.map((team, index) => ({
      id: team.id,
      position: index
    }));

    this.teamsService.reorderTeams(reorderData).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        console.error('Reorder error:', err);
        this.loadTeams();
      }
    });
  }

  /**
   * Toggle actif/inactif d'une équipe
   */
  toggleActive(team: Team, _event: unknown): void {
    this.teamsService.toggleTeamActive(team.id).subscribe({
      next: () => {
        this.snackBar.open(
          `Équipe "${team.name}" ${team.active ? 'désactivée' : 'activée'}`,
          'Fermer',
          { duration: 3000 }
        );
      },
      error: (err) => {
        this.error.set('Erreur lors du changement de statut');
        console.error('Toggle error:', err);
        this.loadTeams();
      }
    });
  }

  /**
   * Ouvre le modal de création d'équipe
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(TeamFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { team: undefined }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeams();
      }
    });
  }

  /**
   * Ouvre le modal d'édition d'équipe
   */
  openEditDialog(team: Team): void {
    const dialogRef = this.dialog.open(TeamFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { team }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeams();
      }
    });
  }

  /**
   * Ouvre le modal de gestion des membres
   */
  openMembersDialog(team: Team): void {
    const dialogRef = this.dialog.open(TeamMembersDialogComponent, {
      width: '95vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: { team }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeams();
      }
    });
  }

  /**
   * Supprime une équipe
   */
  deleteTeam(team: Team, event: Event): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer l'équipe "${team.name}" ?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.teamsService.deleteTeam(team.id).subscribe({
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
  trackByTeam(index: number, team: Team): number {
    return team.id;
  }
}
