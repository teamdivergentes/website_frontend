import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
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
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { createReorder } from '../../shared/use-reorder';
import { ErrorStateComponent } from '../../shared/error-state.component';

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
    PageHeaderComponent,
    ErrorStateComponent],
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
        padding-top: var(--admin-space-2);
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
        <app-error-state [message]="error()!" [retrying]="loading()" (retry)="retryLoad()" />
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

                <button mat-icon-button (click)="openMembers(team)"
                  [attr.aria-label]="'Gérer les membres de ' + team.name"
                  matTooltip="Gérer les membres">
                  <mat-icon>group</mat-icon>
                </button>

                <button mat-icon-button (click)="openCoachingStaff(team)"
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
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  // Computed signal pour toutes les equipes
  readonly teams = this.teamsService.allTeams;

  /**
   * Reordonnancement delegue au helper partage.
   * Declare apres `teams`, dont il depend a l'initialisation.
   */
  private readonly reorder = createReorder<Team>({
    items: this.teams,
    label: (team) => team.name,
    persist: (ordered) => this.teamsService.reorderTeams(ordered.map((team, index) => ({ id: team.id, position: index }))),
    onError: (err) => {
      this.notifier.error('Erreur lors de la réorganisation');
      if (!environment.production) {
        console.error('Reorder error:', err);
      }
      this.loadTeams();
    },
  });

  readonly reordering = this.reorder.reordering;
  readonly liveMessage = this.reorder.liveMessage;

  ngOnInit(): void {
    this.loadTeams();
  }

  /**
   * Charge les equipes depuis l'API
   */
  /** Relance le chargement apres une erreur, sans rechargement de page. */
  retryLoad(): void {
    this.loadTeams();
  }

  loadTeams(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.teamsService.loadTeams().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Impossible de charger les équipes.');
        if (!environment.production) console.error('Load teams error:', err);
      }
    });
  }

  /**
   * Gere le drop pour reordonner les equipes (drag-drop CDK).
   */
  onDrop(event: CdkDragDrop<Team[]>): void {
    this.reorder.onDrop(event);
  }

  /**
   * Logique commune de reorder (appele par drag-drop ET par les boutons Monter/Descendre).
   */
  onReorder(fromIndex: number, toIndex: number): void {
    this.reorder.onReorder(fromIndex, toIndex);
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
        this.notifier.error('Erreur lors du changement de statut');
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
   * Ouvre la page de gestion des membres.
   *
   * C'etait un dialogue `xl` de 1200px. L'URL porte desormais l'equipe, ce qui
   * la rend partageable et compatible avec le retour arriere du navigateur.
   */
  openMembers(team: Team): void {
    void this.router.navigate(['/admin/teams', team.id, 'members']);
  }

  /**
   * Ouvre la page de gestion du staff de coaching.
   *
   * C'etait le dernier dialogue `xl` de 1200px, le palier disparait avec lui.
   */
  openCoachingStaff(team: Team): void {
    void this.router.navigate(['/admin/teams', team.id, 'coaching']);
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
          this.notifier.error('Erreur lors de la suppression');
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
