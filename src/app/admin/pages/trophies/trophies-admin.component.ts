import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { TrophyAdmin } from '../../../shared/models/trophy.model';
import { placementLabel as _placementLabel } from '../../../shared/utils/trophy-placement';
import { TrophyDialogComponent } from './trophy-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { openOnCreateParam } from '../../shared/open-on-create-param';

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
  templateUrl: './trophies-admin.component.html',
  styleUrls: ['./trophies-admin.component.scss'],
})
export class TrophiesAdminComponent implements OnInit {
  /**
   * Ouvre le formulaire de creation quand la palette de commandes le
   * demande par l'URL : cette creation n'a pas de route propre.
   */
  private readonly createOnDemand = openOnCreateParam(() => this.openCreate());

  private readonly trophiesService = inject(TrophiesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly trophies = this.trophiesService.adminTrophies;

  ngOnInit(): void {
    this.loadTrophies();
  }

  placementLabel(placement: number): string { return _placementLabel(placement, true); }

  private loadTrophies(): void {
    this.loading.set(true);
    this.trophiesService.loadAdminTrophies().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement', 'OK', { duration: 3000 });
      },
    });
  }

  toggleFeatured(trophy: TrophyAdmin): void {
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

  openEdit(trophy: TrophyAdmin): void {
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

  confirmDelete(trophy: TrophyAdmin): void {
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
