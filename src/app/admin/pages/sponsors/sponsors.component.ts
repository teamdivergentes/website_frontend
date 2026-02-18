import { Component, OnInit, inject, signal } from '@angular/core';
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

      <app-sponsors-list
        [sponsors]="sponsors()"
        (edit)="openEditDialog($event)"
        (delete)="confirmDelete($event)"
        (toggle)="toggleActive($event)"
        (reorder)="onReorder($event)"
        (manageImages)="openImagesDialog($event)"
        (manageLinks)="openLinksDialog($event)" />
    </div>
  `,
  styles: [`
    
  `]
})
export class SponsorsComponent implements OnInit {
  private readonly sponsorsService = inject(SponsorsService);
  private readonly dialog = inject(MatDialog);

  readonly error = signal<string | undefined>(undefined);

  // Liste des sponsors
  readonly sponsors = this.sponsorsService.sponsors;

  ngOnInit(): void {
    this.loadSponsors();
  }

  /**
   * Charge tous les sponsors (actifs et inactifs) pour l'admin
   */
  loadSponsors(): void {
    this.sponsorsService.loadAllSponsors().subscribe({
      error: (err) => {
        this.error.set('Erreur lors du chargement des sponsors');
        console.error('Load sponsors error:', err);
      }
    });
  }

  /**
   * Ouvre le dialog de création
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SponsorFormDialogComponent, {
      width: '600px',
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
    if (!window.confirm(`Voulez-vous vraiment supprimer le sponsor "${sponsor.name}" ?`)) {
      return;
    }

    this.sponsorsService.deleteSponsor(sponsor.id).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la suppression');
        console.error('Delete error:', err);
      }
    });
  }

  /**
   * Toggle actif/inactif
   */
  toggleActive(sponsor: Sponsor): void {
    this.sponsorsService.toggleSponsorActive(sponsor.id).subscribe({
      error: (err) => {
        this.error.set('Erreur lors du changement de statut');
        console.error('Toggle error:', err);
        this.loadSponsors();
      }
    });
  }

  /**
   * Gère le réordonnancement
   */
  onReorder(orderedIds: number[]): void {
    this.sponsorsService.reorder(orderedIds).subscribe({
      error: (err) => {
        this.error.set('Erreur lors de la reorganisation');
        console.error('Reorder error:', err);
        this.loadSponsors();
      }
    });
  }
}
