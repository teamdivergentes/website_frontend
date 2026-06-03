import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { Trophy } from '../../../shared/models/trophy.model';
import { TrophyDialogComponent } from './trophy-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-trophies-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="trophies-admin-page">
      <!-- Header -->
      <div class="page-header">
        <h1>Palmarès</h1>
        <button mat-raised-button color="primary" (click)="openCreate()">
          <mat-icon aria-hidden="true">add</mat-icon>
          Nouveau trophée
        </button>
      </div>

      <!-- Skeleton -->
      @if (loading()) {
        <div class="skeleton-table" role="status" aria-label="Chargement en cours">
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="skeleton-row">
              <div class="skeleton-block sk-text sk-w-30"></div>
              <div class="skeleton-block sk-text sk-w-10"></div>
              <div class="skeleton-block sk-text sk-w-20"></div>
              <div class="skeleton-block sk-text sk-w-15"></div>
              <div class="skeleton-block sk-badge"></div>
              <div class="skeleton-block sk-icon"></div>
              <div class="skeleton-block sk-actions"></div>
            </div>
          }
        </div>
      } @else if (trophies().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">emoji_events</mat-icon>
          <p>Aucun trophée pour l'instant. Ajoutez le premier titre de la structure !</p>
          <button mat-stroked-button (click)="openCreate()">
            <mat-icon aria-hidden="true">add</mat-icon>
            Ajouter un trophée
          </button>
        </div>
      } @else {
        <div class="table-wrapper">
          <table class="trophies-table" aria-label="Liste des trophées">
            <thead>
              <tr>
                <th>Compétition</th>
                <th>Placement</th>
                <th>Équipe</th>
                <th>Date</th>
                <th>À la une</th>
                <th class="col-active">Actif</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (trophy of trophies(); track trophy.id) {
                <tr [class.inactive]="!trophy.active">
                  <td><strong>{{ trophy.competition }}</strong></td>
                  <td>{{ placementLabel(trophy.placement) }}</td>
                  <td>{{ trophy.teamName || '—' }}</td>
                  <td>{{ trophy.date | date: 'dd/MM/yyyy' }}</td>
                  <td>
                    <mat-slide-toggle
                      [checked]="trophy.featured"
                      (change)="toggleFeatured(trophy)"
                      [attr.aria-label]="'Mettre à la une ' + trophy.competition"
                    />
                  </td>
                  <td class="col-active">
                    @if (trophy.active) {
                      <mat-icon class="icon-active" aria-label="Trophée actif">check_circle</mat-icon>
                    } @else {
                      <mat-icon class="icon-inactive" aria-label="Trophée inactif">cancel</mat-icon>
                    }
                  </td>
                  <td class="col-actions">
                    <button mat-icon-button (click)="openEdit(trophy)"
                      [attr.aria-label]="'Modifier ' + trophy.competition"
                      matTooltip="Modifier">
                      <mat-icon aria-hidden="true">edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="confirmDelete(trophy)"
                      [attr.aria-label]="'Supprimer ' + trophy.competition"
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
    </div>
  `,
  styles: [`
    /* ===== Layout ===== */
    .trophies-admin-page {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;

      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
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

    .sk-text { height: 14px; }
    .sk-w-10 { width: 10%; }
    .sk-w-15 { width: 15%; }
    .sk-w-20 { width: 20%; }
    .sk-w-30 { width: 30%; }
    .sk-badge { width: 70px; height: 22px; border-radius: 11px; }
    .sk-icon { width: 24px; height: 24px; border-radius: 50%; }
    .sk-actions { width: 80px; height: 32px; border-radius: 6px; }

    /* ===== Table ===== */
    .table-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid var(--darkGreen, #28413B);
    }

    .trophies-table {
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

    tr {
      transition: background 0.15s;

      &:hover {
        background: rgba(40, 65, 59, 0.15);
      }

      &.inactive {
        opacity: 0.55;
      }
    }

    .col-active {
      width: 60px;
      text-align: center;
    }

    .col-actions {
      width: 100px;
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

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `],
})
export class TrophiesAdminComponent implements OnInit {
  private readonly trophiesService = inject(TrophiesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly trophies = this.trophiesService.adminTrophies;

  ngOnInit(): void {
    this.loadTrophies();
  }

  placementLabel(placement: number): string {
    if (placement === 1) return '🥇 1er';
    if (placement === 2) return '🥈 2e';
    if (placement === 3) return '🥉 3e';
    return `Top ${placement}`;
  }

  loadTrophies(): void {
    this.loading.set(true);
    this.trophiesService.loadAdminTrophies().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement', 'OK', { duration: 3000 });
      },
    });
  }

  toggleFeatured(trophy: Trophy): void {
    this.trophiesService.updateTrophy(trophy.id, { featured: !trophy.featured }).subscribe({
      next: () =>
        this.snackBar.open(
          trophy.featured ? 'Retiré de la une' : 'Mis à la une',
          'OK',
          { duration: 2000 },
        ),
      error: () => this.snackBar.open('Erreur', 'OK', { duration: 3000 }),
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(TrophyDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {},
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Trophée créé', 'OK', { duration: 2500 });
        this.loadTrophies();
      }
    });
  }

  openEdit(trophy: Trophy): void {
    const ref = this.dialog.open(TrophyDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { trophy },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Trophée mis à jour', 'OK', { duration: 2500 });
        this.loadTrophies();
      }
    });
  }

  confirmDelete(trophy: Trophy): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Supprimer le trophée « ${trophy.competition} » ?`,
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.trophiesService.deleteTrophy(trophy.id).subscribe({
          next: () => this.snackBar.open('Trophée supprimé', 'OK', { duration: 2500 }),
          error: () => this.snackBar.open('Erreur', 'OK', { duration: 3000 }),
        });
      }
    });
  }
}
