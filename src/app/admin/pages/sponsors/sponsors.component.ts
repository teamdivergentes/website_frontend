import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { Sponsor } from '../../../shared/models';
import { SponsorsListComponent } from './sponsors-list.component';
import { SponsorFormDialogComponent } from './sponsor-form-dialog.component';
import { SponsorImagesDialogComponent } from './sponsor-images-dialog.component';
import { SponsorLinksDialogComponent } from './sponsor-links-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

/**
 * Page d'administration des sponsors
 */
@Component({
  selector: 'app-sponsors-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    SponsorsListComponent
  ],
  template: `
    <div class="admin-page">
      <header class="page-header">
        <h1>Gestion des Sponsors</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nouveau sponsor
        </button>
      </header>

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="skeleton-list" role="status" aria-label="Chargement en cours">
          @for (i of [1,2,3]; track i) {
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
      } @else {
        <app-sponsors-list
          #sponsorList
          [sponsors]="sponsors()"
          (edit)="openEditDialog($event)"
          (delete)="confirmDelete($event)"
          (toggle)="toggleActive($event)"
          (reorder)="onReorder($event)"
          (manageImages)="openImagesDialog($event)"
          (manageLinks)="openLinksDialog($event)" />
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
    .skeleton-actions-bar { width: 200px; height: 32px; border-radius: 8px; flex-shrink: 0; }
  `]
})
export class SponsorsComponent implements OnInit {
  private readonly sponsorsService = inject(SponsorsService);
  private readonly dialog = inject(MatDialog);

  readonly error = signal<string | undefined>(undefined);
  readonly loading = signal<boolean>(false);

  // Liste des sponsors
  readonly sponsors = this.sponsorsService.sponsors;

  /** Reference au composant liste pour reset le guard reordering (SEC-PR206-001). */
  readonly sponsorListRef = viewChild<SponsorsListComponent>('sponsorList');

  ngOnInit(): void {
    this.loadSponsors();
  }

  /**
   * Charge tous les sponsors (actifs et inactifs) pour l'admin
   */
  loadSponsors(): void {
    this.loading.set(true);
    this.sponsorsService.loadAllSponsors().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des sponsors');
        if (!environment.production) console.error('Load sponsors error:', err);
      }
    });
  }

  /**
   * Ouvre le dialog de création
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SponsorFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { sponsor: undefined }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSponsors();
      }
    });
  }

  /**
   * Ouvre le dialog d'édition
   */
  openEditDialog(sponsor: Sponsor): void {
    const dialogRef = this.dialog.open(SponsorFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { sponsor }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSponsors();
      }
    });
  }

  /**
   * Ouvre le dialog de gestion des images
   */
  openImagesDialog(sponsor: Sponsor): void {
    const dialogRef = this.dialog.open(SponsorImagesDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { sponsor }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSponsors();
      }
    });
  }

  /**
   * Ouvre le dialog de gestion des liens
   */
  openLinksDialog(sponsor: Sponsor): void {
    const dialogRef = this.dialog.open(SponsorLinksDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { sponsor }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSponsors();
      }
    });
  }

  /**
   * Confirme et supprime un sponsor
   */
  confirmDelete(sponsor: Sponsor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer le sponsor "${sponsor.name}" ?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;

      this.sponsorsService.deleteSponsor(sponsor.id).subscribe({
        error: (err) => {
          this.error.set('Erreur lors de la suppression');
          if (!environment.production) console.error('Delete error:', err);
        }
      });
    });
  }

  /**
   * Toggle actif/inactif
   */
  toggleActive(sponsor: Sponsor): void {
    this.sponsorsService.toggleSponsorActive(sponsor.id).subscribe({
      error: (err) => {
        this.error.set('Erreur lors du changement de statut');
        if (!environment.production) console.error('Toggle error:', err);
        this.loadSponsors();
      }
    });
  }

  /**
   * Gère le réordonnancement
   */
  onReorder(orderedIds: number[]): void {
    this.sponsorsService.reorder(orderedIds).pipe(
      finalize(() => this.sponsorListRef()?.resetReordering())
    ).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la reorganisation');
        if (!environment.production) console.error('Reorder error:', err);
        this.loadSponsors();
      }
    });
  }
}
