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
import { ArticleCategoriesComponent } from './article-categories/article-categories.component';
import type { ArticleQueryParams, ArticleSortField } from '../../../shared/models/article.model';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { EmptyStateComponent } from '../../shared/empty-state.component';
import { AdminDialogService } from '../../shared/admin-dialog.service';

/**
 * Page d'administration — liste des articles avec tableau trié,
 * toggles publié/featured inline et suppression par dialog de confirmation.
 */
/** Taille de page par defaut, alignee sur la liste des utilisateurs. */
const DEFAULT_PAGE_SIZE = 20;

/** Choix proposes dans le paginateur. */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

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
  ,
    MatPaginatorModule,
    MatSelectModule,
    MatFormFieldModule,
    SkeletonComponent,
    EmptyStateComponent],
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss']
})
export class ArticlesListComponent implements OnInit {
  private readonly articlesService = inject(ArticlesService);
  private readonly typesService = inject(ArticleTypesService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  /**
   * Colonnes triables cote serveur. Le backend contraint la valeur par une
   * liste blanche : `type` en est absent, trier par nom de categorie exigerait
   * une jointure. La colonne reste affichee mais n'est plus triable.
   */
  readonly sortColumn = signal<ArticleSortField>('createdAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly totalArticles = signal<number>(0);
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly pageIndex = signal<number>(0);
  readonly pageSize = signal<number>(DEFAULT_PAGE_SIZE);
  readonly publishedFilter = signal<boolean | null>(null);
  readonly typeFilter = signal<number | null>(null);

  readonly articles = this.articlesService.allArticles;
  readonly types = this.typesService.allTypes;

  readonly displayedColumns = ['image', 'title', 'type', 'published', 'featured', 'createdAt', 'actions'];

  /** Map pré-calculée typeId → name pour éviter les lookups linéaires */
  private readonly typeMap = computed(() =>
    new Map(this.types().map((t: ArticleType) => [t.id, t.name]))
  );

  /**
   * La liste vient telle quelle du serveur : la trier ici ne trierait que la
   * page visible tout en ayant l'air de trier l'ensemble.
   */
  readonly sortedArticles = this.articles;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(undefined);
    // Reset des données avant rechargement (pattern EPIC-9)

    forkJoin({
      articles: this.articlesService.getArticles(this.buildQuery()),
      types: this.typesService.getArticleTypes()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ articles }) => {
          this.totalArticles.set(articles.meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Erreur lors du chargement des articles');
        }
      });
  }

  /** Recharge la seule liste, sans reprendre les categories. */
  private reload(): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.articlesService.getArticles(this.buildQuery())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.totalArticles.set(response.meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Erreur lors du chargement des articles');
        }
      });
  }

  /** Assemble pagination, tri et filtres en une requete serveur. */
  private buildQuery(): ArticleQueryParams {
    const query: ArticleQueryParams = {
      page: this.pageIndex() + 1,
      limit: this.pageSize(),
      sortBy: this.sortColumn(),
      sortOrder: this.sortDirection(),
    };
    const published = this.publishedFilter();
    if (published !== null) query.published = published;
    const typeId = this.typeFilter();
    if (typeId !== null) query.typeId = typeId;
    return query;
  }

  onPageChange(event: { pageIndex: number; pageSize: number; length: number }): void {
    // Changer la taille de page reindexe tout : rester sur l'index courant
    // pointerait vers un autre contenu, voire au-dela du dernier element.
    if (event.pageSize !== this.pageSize()) {
      this.pageSize.set(event.pageSize);
      this.pageIndex.set(0);
    } else {
      this.pageIndex.set(event.pageIndex);
    }
    this.reload();
  }

  onPublishedFilterChange(published: boolean | null): void {
    this.publishedFilter.set(published);
    this.pageIndex.set(0);
    this.reload();
  }

  onTypeFilterChange(typeId: number | null): void {
    this.typeFilter.set(typeId);
    this.pageIndex.set(0);
    this.reload();
  }

  onSort(sort: Sort): void {
    if (!sort.active || !sort.direction) {
      this.sortColumn.set('createdAt');
      this.sortDirection.set('desc');
    } else {
      this.sortColumn.set(sort.active as ArticleSortField);
      this.sortDirection.set(sort.direction as 'asc' | 'desc');
    }
    // Un tri change l'ordre global : rester a la page courante afficherait une
    // tranche arbitraire du nouvel ordre.
    this.pageIndex.set(0);
    this.reload();
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


  /** L'etat vide emet une action plutot qu'un routerLink : on navigue ici. */
  goToNewArticle(): void {
    void this.router.navigate(['/admin/articles/new']);
  }

  confirmDelete(article: Article): void {
    this.confirm.delete("l'article", article.title)
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
    this.adminDialog.open(ArticleCategoriesComponent, 'md');
  }

  trackByArticle(_index: number, article: Article): number {
    return article.id;
  }
}
