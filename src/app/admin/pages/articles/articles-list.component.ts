import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ArticlesService } from '../../../shared/services/articles.service';
import { ArticleTypesService } from '../../../shared/services/article-types.service';
import { Article, ArticleType } from '../../../shared/models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { ArticleCategoriesComponent } from './article-categories/article-categories.component';

/**
 * Page d'administration — liste des articles avec tableau trié,
 * toggles publié/featured inline et suppression par dialog de confirmation.
 */
@Component({
  selector: 'app-articles-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss']
})
export class ArticlesListComponent implements OnInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly typesService = inject(ArticleTypesService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  readonly sortColumn = signal<'title' | 'createdAt' | 'type'>('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly articles = this.articlesService.allArticles;
  readonly types = this.typesService.allTypes;

  readonly displayedColumns = ['image', 'title', 'type', 'published', 'featured', 'createdAt', 'actions'];

  /** Map pré-calculée typeId → name pour éviter les lookups linéaires */
  private readonly typeMap = computed(() =>
    new Map(this.types().map((t: ArticleType) => [t.id, t.name]))
  );

  readonly sortedArticles = computed(() => {
    const list = [...this.articles()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const map = this.typeMap();

    list.sort((a, b) => {
      let comparison = 0;
      if (col === 'title') {
        comparison = a.title.localeCompare(b.title, 'fr');
      } else if (col === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (col === 'type') {
        const nameA = map.get(a.typeId) ?? '—';
        const nameB = map.get(b.typeId) ?? '—';
        comparison = nameA.localeCompare(nameB, 'fr');
      }
      return dir === 'asc' ? comparison : -comparison;
    });
    return list;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(undefined);
    // Reset des données avant rechargement (pattern EPIC-9)

    forkJoin({
      articles: this.articlesService.getArticles({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
      types: this.typesService.getArticleTypes()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.error.set('Erreur lors du chargement des articles');
        }
      });
  }

  onSort(sort: Sort): void {
    if (!sort.active || !sort.direction) {
      this.sortColumn.set('createdAt');
      this.sortDirection.set('desc');
    } else {
      this.sortColumn.set(sort.active as 'title' | 'createdAt' | 'type');
      this.sortDirection.set(sort.direction as 'asc' | 'desc');
    }
  }

  getTypeName(typeId: number): string {
    return this.typeMap().get(typeId) ?? '—';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  togglePublished(article: Article): void {
    this.articlesService.togglePublished(article.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.snackBar.open(
            `"${updated.title}" ${updated.published ? 'publié' : 'dépublié'}`,
            'Fermer',
            { duration: 3000 }
          );
        },
        error: () => {
          this.snackBar.open('Erreur lors du changement de statut', 'Fermer', { duration: 3000 });
          this.loadData();
        }
      });
  }

  toggleFeatured(article: Article): void {
    this.articlesService.toggleFeatured(article.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.snackBar.open(
            `"${updated.title}" ${updated.featured ? 'mis en avant' : 'retiré de la une'}`,
            'Fermer',
            { duration: 3000 }
          );
        },
        error: () => {
          this.snackBar.open('Erreur lors du changement de statut', 'Fermer', { duration: 3000 });
          this.loadData();
        }
      });
  }

  editArticle(article: Article): void {
    this.router.navigate(['/admin/articles/edit', article.id]);
  }

  confirmDelete(article: Article): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Voulez-vous vraiment supprimer l'article "${article.title}" ? Cette action est irréversible.`
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.articlesService.deleteArticle(article.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open('Article supprimé', 'Fermer', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
            }
          });
      });
  }

  openCategoriesDialog(): void {
    this.dialog.open(ArticleCategoriesComponent, {
      width: '600px',
      maxWidth: '95vw'
    });
  }

  trackByArticle(_index: number, article: Article): number {
    return article.id;
  }
}
