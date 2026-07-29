import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';
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
import { CoachingStaffDialogComponent } from './coaching-staff-dialog/coaching-staff-dialog.component';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { buildReorderMessage, buildReorderErrorMessage } from '../../../shared/utils/a11y-announce';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { PageHeaderComponent } from '../../shared/page-header.component';

/**
 * Page d'administration des equipes avec drag & drop pour reordonner.
 * Accessible au clavier via boutons Monter / Descendre (WCAG 2.1.1).
 */
@Component({
  selector: 'app-teams-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DragDropModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule
  ,
    SkeletonComponent,
    EmptyStateComponent,
    PageHeaderComponent],
  styles: [`
    
    @media (max-width: 768px) {
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
      <app-page-header title="Gestion des Équipes">
        <button actions mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouvelle équipe
        </button>
      </app-page-header>

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      <!-- Region aria-live pour les annonces de reorder -->
      <div class="visually-hidden" aria-live="polite" aria-atomic="true" role="status">{{ liveMessage() }}</div>

      @if (loading()) {
        <app-skeleton variant="list" [rows]="4" [hasThumb]="true" [hasHandle]="true" />
      } @else if (teams().length === 0) {
        <app-empty-state entity="équipe" gender="f" icon="groups" />
      } @else {
        <div class="teams-list" cdkDropList (cdkDropListDropped)="onDrop($event)" aria-label="Liste des equipes, reordonnables">
          @for (team of teams(); track trackByTeam($index, team); let i = $index) {
            <div class="team-item" cdkDrag>
              <div class="drag-handle" cdkDragHandle matTooltip="Glisser pour réordonner" aria-hidden="true">
                <mat-icon aria-hidden="true">drag_indicator</mat-icon>
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
                <button
                  mat-icon-button
                  [disabled]="reordering() || i === 0"
                  (click)="onReorder(i, i - 1)"
                  [attr.aria-label]="'Deplacer ' + team.name + ' vers le haut'"
                  matTooltip="Monter"
                >
                  <mat-icon aria-hidden="true">arrow_upward</mat-icon>
                </button>
                <button
                  mat-icon-button
                  [disabled]="reordering() || i === teams().length - 1"
                  (click)="onReorder(i, i + 1)"
                  [attr.aria-label]="'Deplacer ' + team.name + ' vers le bas'"
                  matTooltip="Descendre"
                >
                  <mat-icon aria-hidden="true">arrow_downward</mat-icon>
                </button>

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

                <button mat-icon-button (click)="openCoachingStaffDialog(team)"
                  [attr.aria-label]="'Gérer le coaching staff de ' + team.name"
                  matTooltip="Coaching staff">
                  <mat-icon>sports</mat-icon>
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
  private readonly adminDialog = inject(AdminDialogService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  /** Message annonce par la region aria-live apres chaque reorder. */
  readonly liveMessage = signal('');
  /** Guard anti-double-clic : bloque les appels API de reorder concurrents (SEC-PR206-001). */
  protected readonly reordering = signal(false);

  // Computed signal pour toutes les equipes
  readonly teams = this.teamsService.allTeams;

  ngOnInit(): void {
    this.loadTeams();
  }

  /**
   * Charge les equipes depuis l'API
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
        if (!environment.production) console.error('Load teams error:', err);
      }
    });
  }

  /**
   * Gere le drop pour reordonner les equipes (drag-drop CDK).
   */
  onDrop(event: CdkDragDrop<Team[]>): void {
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

    const teams = [...this.teams()];
    moveItemInArray(teams, fromIndex, toIndex);
    const movedTeam = teams[toIndex];

    const reorderData = teams.map((team, index) => ({
      id: team.id,
      position: index
    }));

    this.teamsService.reorderTeams(reorderData).pipe(
      finalize(() => this.reordering.set(false))
    ).subscribe({
      next: () => {
        if (movedTeam) {
          this.liveMessage.set(buildReorderMessage(movedTeam.name, toIndex + 1, teams.length));
        }
      },
      error: (err) => {
        this.error.set('Erreur lors de la réorganisation');
        if (!environment.production) console.error('Reorder error:', err);
        if (movedTeam) {
          this.liveMessage.set(buildReorderErrorMessage(movedTeam.name));
        }
        this.loadTeams();
      }
    });
  }

  /**
   * Toggle actif/inactif d'une equipe
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
        if (!environment.production) console.error('Toggle error:', err);
        this.loadTeams();
      }
    });
  }

  /**
   * Ouvre le modal de creation d'equipe
   */
  openCreateDialog(): void {
    const dialogRef = this.adminDialog.open(TeamFormDialogComponent, 'md', { team: undefined });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeams();
      }
    });
  }

  /**
   * Ouvre le modal d'edition d'equipe
   */
  openEditDialog(team: Team): void {
    const dialogRef = this.adminDialog.open(TeamFormDialogComponent, 'md', { team });

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
    const dialogRef = this.adminDialog.open(TeamMembersDialogComponent, 'xl', { team });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeams();
      }
    });
  }

  /**
   * Ouvre le dialog de gestion du coaching staff
   */
  openCoachingStaffDialog(team: Team): void {
    const dialogRef = this.adminDialog.open(CoachingStaffDialogComponent, 'xl', { team });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTeams();
      }
    });
  }

  /**
   * Supprime une equipe
   */
  deleteTeam(team: Team, event: Event): void {
    event.stopPropagation();

    this.confirm.delete("l'équipe", team.name).subscribe(confirmed => {
      if (!confirmed) return;

      this.teamsService.deleteTeam(team.id).subscribe({
        next: () => {
          this.notifier.deleted('Équipe', 'f');
        },
        error: (err) => {
          this.error.set('Erreur lors de la suppression');
          if (!environment.production) console.error('Delete error:', err);
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
