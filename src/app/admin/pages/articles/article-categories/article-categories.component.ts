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
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { ArticleCategoryDialogComponent } from './article-category-dialog.component';

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
  ],
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
        <div class="skeleton-table" role="status" aria-label="Chargement des catégories">
          @for (i of [1, 2, 3]; track i) {
            <div class="skeleton-row">
              <div class="skeleton-block skeleton-name"></div>
              <div class="skeleton-block skeleton-date"></div>
              <div class="skeleton-block skeleton-actions"></div>
            </div>
          }
        </div>
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
    @keyframes skeleton-pulse {
      0%, 100% { background-position: 200% 0; }
      50% { background-position: 0 0; }
    }

    .categories-content {
      min-width: 520px;
      padding-bottom: 0.5rem;
    }

    .categories-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .categories-subtitle {
      margin: 0;
      color: var(--gray, #999);
      font-size: 0.875rem;
    }

    .categories-table {
      width: 100%;
    }

    .col-actions {
      text-align: right;
      white-space: nowrap;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 0;
      gap: 0.5rem;
      color: var(--gray, #999);

      mat-icon {
        font-size: 2.5rem;
        width: 2.5rem;
        height: 2.5rem;
      }

      p {
        margin: 0;
      }
    }

    /* Skeleton */
    .skeleton-table {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(50, 210, 153, 0.1);
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

    .skeleton-name { flex: 1; height: 14px; }
    .skeleton-date { width: 100px; height: 14px; }
    .skeleton-actions { width: 80px; height: 32px; border-radius: 8px; }
  `]
})
export class ArticleCategoriesComponent implements OnInit {
  private readonly typesService = inject(ArticleTypesService);
  private readonly dialog = inject(MatDialog);
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
    const ref = this.dialog.open(ArticleCategoryDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      data: { category: undefined }
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Catégorie créée', 'Fermer', { duration: 3000 });
        }
      });
  }

  openEditDialog(category: ArticleType): void {
    const ref = this.dialog.open(ArticleCategoryDialogComponent, {
      width: '440px',
      maxWidth: '95vw',
      data: { category }
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Catégorie mise à jour', 'Fermer', { duration: 3000 });
        }
      });
  }

  confirmDelete(category: ArticleType): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer la catégorie "${category.name}" ?`
      }
    });

    ref.afterClosed()
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
