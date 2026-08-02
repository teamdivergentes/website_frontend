import { Component, OnInit, inject, signal, viewChild } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { Sponsor } from '../../../shared/models';
import { SponsorsListComponent } from './sponsors-list.component';
import { SponsorFormDialogComponent } from './sponsor-form-dialog.component';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { openOnCreateParam } from '../../shared/open-on-create-param';
import { navigateAway } from '../../shared/navigate-away';

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
  ,
    SkeletonComponent,
    ErrorStateComponent],
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
        <app-error-state [message]="error()!" [retrying]="loading()" (retry)="retryLoad()" />
      }

      @if (loading()) {
        <app-skeleton variant="list" [rows]="3" [hasThumb]="true" [hasHandle]="true" />
      } @else {
        <app-sponsors-list
          #sponsorList
          [sponsors]="sponsors()"
          (edit)="openEditDialog($event)"
          (delete)="confirmDelete($event)"
          (toggle)="toggleActive($event)"
          (reorder)="onReorder($event)"
          (manageImages)="openImagesPage($event)"
          (manageLinks)="openLinksPage($event)" />
      }
    </div>
  `,
  styles: [`
      `]
})
export class SponsorsComponent implements OnInit {
  /**
   * Ouvre le formulaire de creation quand la palette de commandes le
   * demande par l'URL : cette creation n'a pas de route propre.
   */
  private readonly createOnDemand = openOnCreateParam(() => this.openCreateDialog());

  private readonly sponsorsService = inject(SponsorsService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(AdminConfirmService);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly notifier = inject(AdminNotifier);

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
  /** Relance le chargement apres une erreur, sans rechargement de page. */
  retryLoad(): void {
    this.loadSponsors();
  }

  loadSponsors(): void {
    this.loading.set(true);
    this.sponsorsService.loadAllSponsors().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Impossible de charger les sponsors.');
        if (!environment.production) console.error('Load sponsors error:', err);
      }
    });
  }

  /**
   * Ouvre le dialog de création
   */
  openCreateDialog(): void {
    const dialogRef = this.adminDialog.open(SponsorFormDialogComponent, 'md', { sponsor: undefined });

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
    const dialogRef = this.adminDialog.open(SponsorFormDialogComponent, 'md', { sponsor });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSponsors();
      }
    });
  }

  /**
   * Ouvre la page de gestion des images.
   *
   * C'etait un dialogue au palier `lg` : une collection editable dans une
   * modale, ce que la regle du panel interdit (EPIC-41, feature 3).
   */
  openImagesPage(sponsor: Sponsor): void {
    navigateAway(this.router, ['/admin/sponsors', sponsor.id, 'images']);
  }

  /**
   * Ouvre la page de gestion des liens.
   *
   * C'etait le dernier dialogue au palier `lg` : une liste enfant et son
   * formulaire dans une meme modale, ce que la regle du panel interdit
   * (EPIC-41, feature 3). Le palier est parti avec lui.
   */
  openLinksPage(sponsor: Sponsor): void {
    navigateAway(this.router, ['/admin/sponsors', sponsor.id, 'liens']);
  }

  /**
   * Confirme et supprime un sponsor
   */
  confirmDelete(sponsor: Sponsor): void {
    this.confirm.delete('le sponsor', sponsor.name).subscribe(confirmed => {
      if (!confirmed) return;

      this.sponsorsService.deleteSponsor(sponsor.id).subscribe({
        next: () => {
          this.notifier.deleted('Sponsor');
        },
        error: (err) => {
          this.notifier.error('Erreur lors de la suppression');
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
        this.notifier.error('Erreur lors du changement de statut');
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
