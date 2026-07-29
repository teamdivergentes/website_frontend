import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { HttpErrorResponse } from '@angular/common/http';
import { ArticleTypesService } from '../../../../shared/services/article-types.service';
import { ArticleType } from '../../../../shared/models';
import { ArticleCategoryDialogComponent } from './article-category-dialog.component';
import { SkeletonComponent } from '../../../shared/skeleton.component';
import { AdminDialogService } from '../../../shared/admin-dialog.service';
import { AdminConfirmService } from '../../../shared/admin-confirm.service';

/**
 * Composant de gestion des catégories d'articles (ArticleType).
 * Ouvert depuis la liste des articles via MatDialog.
 */
@Component({
  selector: 'app-article-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTableModule
  ,
    SkeletonComponent],
  template: `
    <h2 mat-dialog-title>Gestion des catégories</h2>

    <mat-dialog-content class="categories-content">
      <div class="categories-header">
        <p class="categories-subtitle">
          {{ categories().length }} catégorie{{ categories().length !== 1 ? 's' : '' }}
        </p>
        <button
          mat-raised-button
          color="primary"
          (click)="openCreateDialog()"
          [disabled]="loading()"
        >
          <mat-icon aria-hidden="true">add</mat-icon>
          Nouvelle catégorie
        </button>
      </div>

      @if (loading()) {
        <app-skeleton variant="table" [rows]="3" [columns]="3" />
      } @else if (categories().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">label_off</mat-icon>
          <p>Aucune catégorie créée.</p>
        </div>
      } @else {
        <table mat-table [dataSource]="categories()" class="categories-table" aria-label="Tableau des catégories">
          <!-- Colonne Nom -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let cat">{{ cat.name }}</td>
          </ng-container>

          <!-- Colonne Date de création -->
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Créée le</th>
            <td mat-cell *matCellDef="let cat">{{ formatDate(cat.createdAt) }}</td>
          </ng-container>

          <!-- Colonne Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
            <td mat-cell *matCellDef="let cat" class="col-actions">
              <button
                mat-icon-button
                (click)="openEditDialog(cat)"
                [attr.aria-label]="'Modifier ' + cat.name"
                matTooltip="Modifier"
              >
                <mat-icon aria-hidden="true">edit</mat-icon>
              </button>
              <button
                mat-icon-button
                color="warn"
                (click)="confirmDelete(cat)"
                [attr.aria-label]="'Supprimer ' + cat.name"
                matTooltip="Supprimer"
              >
                <mat-icon aria-hidden="true">delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" [attr.data-id]="row.id"></tr>
        </table>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
      `]
})
export class ArticleCategoriesComponent implements OnInit {
  private readonly typesService = inject(ArticleTypesService);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(AdminConfirmService);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(false);
  readonly displayedColumns = ['name', 'createdAt', 'actions'];

  readonly categories = this.typesService.allTypes;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.typesService.getArticleTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Erreur lors du chargement des catégories', 'Fermer', { duration: 3000 });
        }
      });
  }

  openCreateDialog(): void {
    const ref = this.adminDialog.open(ArticleCategoryDialogComponent, 'sm', { category: undefined });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Catégorie créée', 'Fermer', { duration: 3000 });
        }
      });
  }

  openEditDialog(category: ArticleType): void {
    const ref = this.adminDialog.open(ArticleCategoryDialogComponent, 'sm', { category });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Catégorie mise à jour', 'Fermer', { duration: 3000 });
        }
      });
  }

  confirmDelete(category: ArticleType): void {
    this.confirm.delete('la catégorie', category.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.typesService.deleteArticleType(category.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Catégorie supprimée', 'Fermer', { duration: 3000 });
            },
            error: (err: HttpErrorResponse) => {
              if (err.status === 409) {
                this.snackBar.open(
                  'Impossible de supprimer : des articles utilisent cette catégorie',
                  'Fermer',
                  { duration: 5000 }
                );
              } else {
                this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
              }
            }
          });
      });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
