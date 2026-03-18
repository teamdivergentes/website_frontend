import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, catchError, of } from 'rxjs';
import { ArticlesService } from '../../shared/services/articles.service';
import { ArticleTypesService } from '../../shared/services/article-types.service';
import { SeoService } from '../../shared/services/seo.service';
import { Article, ArticleType } from '../../shared/models/article.model';

@Component({
  selector: 'app-articles-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './articles-page.component.html',
  styleUrl: './articles-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly articlesService = inject(ArticlesService);
  private readonly articleTypesService = inject(ArticleTypesService);
  private readonly seoService = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | undefined>(undefined);

  protected readonly featuredArticles = signal<Article[]>([]);
  protected readonly articles = signal<Article[]>([]);
  protected readonly articleTypes = signal<ArticleType[]>([]);

  protected readonly selectedTypeId = signal<number | null>(null);

  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);
  protected readonly limit = 9;

  protected readonly skeletonItems = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  protected readonly filteredArticles = computed(() => {
    const featuredIds = new Set(this.featuredArticles().map(a => a.id));
    return this.articles().filter(a => !featuredIds.has(a.id));
  });
  protected readonly hasArticles = computed(() => this.filteredArticles().length > 0);
  protected readonly hasFeaturedArticles = computed(() => this.featuredArticles().length > 0);
  protected readonly pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Actualités',
      description: 'Retrouvez toutes les actualités de Team Divergentes : résultats, annonces, recrutement et vie de l\'équipe.',
      url: '/articles',
    });

    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.seoService.updateMetaTags({});
    this.seoService.clearJsonLd();
  }

  private loadInitialData(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.articles.set([]);
    this.featuredArticles.set([]);
    this.articleTypes.set([]);

    forkJoin({
      featured: this.articlesService
        .getArticles({ published: true, featured: true, limit: 3 })
        .pipe(catchError(() => of(null))),
      types: this.articleTypesService
        .getArticleTypes()
        .pipe(catchError(() => of(null))),
      articles: this.articlesService
        .getArticles({ published: true, limit: this.limit, page: 1 })
        .pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          if (results.featured) {
            this.featuredArticles.set(results.featured.data);
          }
          if (results.types) {
            this.articleTypes.set(results.types);
          }
          if (results.articles) {
            this.articles.set(results.articles.data);
            this.totalPages.set(results.articles.meta.totalPages);
            this.totalItems.set(results.articles.meta.total);
            this.updateJsonLd(results.articles.data);
          }
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Erreur lors du chargement des articles.');
          this.loading.set(false);
        },
      });
  }

  protected selectType(typeId: number | null): void {
    this.selectedTypeId.set(typeId);
    this.currentPage.set(1);
    this.loadArticles();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadArticles();
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private loadArticles(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.articles.set([]);

    const typeId = this.selectedTypeId();
    const params = {
      published: true as const,
      limit: this.limit,
      page: this.currentPage(),
      ...(typeId !== null ? { typeId } : {}),
    };

    this.articlesService
      .getArticles(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.articles.set(response.data);
          this.totalPages.set(response.meta.totalPages);
          this.totalItems.set(response.meta.total);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Erreur lors du chargement des articles.');
          this.loading.set(false);
        },
      });
  }

  private updateJsonLd(articleList: Article[]): void {
    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Articles Team Divergentes',
      itemListElement: articleList.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://teamdivergentes.fr/articles/${article.slug}`,
        name: article.title,
      })),
    });
  }

  protected getImageUrl(article: Article): string {
    return article.imageUrl ?? 'assets/img/home/img1.png';
  }
}
