import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
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
import { RuntimeConfigService } from '../../../shared/services/runtime-config.service';
import { Article, ArticleType } from '../../shared/models/article.model';
import { PageHeaderComponent } from '../../shared/components/layout/page-header.component';
import { PageComponent } from '../../shared/components/layout/page.component';

@Component({
  selector: 'app-articles-page',
  standalone: true,
  imports: [DatePipe, RouterLink, PageHeaderComponent, PageComponent],
  templateUrl: './articles-page.component.html',
  styleUrl: './articles-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticlesPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly articlesService = inject(ArticlesService);
  private readonly articleTypesService = inject(ArticleTypesService);
  private readonly seoService = inject(SeoService);
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | undefined>(undefined);

  protected readonly featuredArticles = signal<Article[]>([]);
  protected readonly articles = signal<Article[]>([]);
  protected readonly articleTypes = signal<ArticleType[]>([]);

  /** Initial articles snapshot (all types) — used for stable filter buttons */
  private readonly initialArticles = signal<Article[]>([]);

  protected readonly selectedTypeId = signal<number | null>(null);

  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalItems = signal(0);
  protected readonly limit = 9;

  protected readonly skeletonItems = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  @ViewChild('editorialSection') private editorialSection?: ElementRef<HTMLElement>;

  // Featured articles filtered by the currently selected type
  protected readonly visibleFeatured = computed(() => {
    const typeId = this.selectedTypeId();
    const featured = this.featuredArticles();
    if (typeId === null) return featured;
    return featured.filter(a => a.typeId === typeId);
  });

  // Regular articles: exclude featured IDs from the API response
  protected readonly regularArticles = computed(() => {
    const featuredIds = new Set(this.featuredArticles().map(a => a.id));
    return this.articles().filter(a => !featuredIds.has(a.id));
  });

  // Deduplicated union of featured + initial articles — used for stable filter/counts
  private readonly allKnownArticles = computed(() => {
    const featured = this.featuredArticles();
    const initial = this.initialArticles();
    const unique = new Map<number, Article>();
    [...featured, ...initial].forEach(a => unique.set(a.id, a));
    return Array.from(unique.values());
  });

  // Hero article: first visible featured article
  protected readonly heroArticle = computed(() => {
    const featured = this.visibleFeatured();
    const typeId = this.selectedTypeId();
    // On "Tous" view: always show hero if featured exist
    if (typeId === null && featured.length >= 1) return featured[0];
    // On filtered view: show hero only if exactly 1 featured or 3+ featured
    if (featured.length === 1 || featured.length >= 3) return featured[0];
    return null;
  });

  // Duo articles: featured #2 and #3 (on "Tous") or both when exactly 2
  protected readonly duoArticles = computed(() => {
    const featured = this.visibleFeatured();
    const typeId = this.selectedTypeId();
    if (typeId === null) return featured.slice(1, 3);
    if (featured.length === 2) return featured;
    if (featured.length >= 3) return featured.slice(1, 3);
    return [];
  });

  // Active types: based on INITIAL data (stable — doesn't change when filtering)
  protected readonly activeTypes = computed(() => {
    const activeIds = new Set(this.allKnownArticles().map(a => a.typeId));
    return this.articleTypes().filter(t => activeIds.has(t.id));
  });

  // Article count per type (from initial data — stable across filter changes)
  protected readonly typeArticleCounts = computed(() => {
    const counts = new Map<number, number>();
    this.allKnownArticles().forEach(a => counts.set(a.typeId, (counts.get(a.typeId) ?? 0) + 1));
    return counts;
  });

  // Has any content to show
  protected readonly hasContent = computed(() => {
    return this.visibleFeatured().length > 0 || this.regularArticles().length > 0;
  });

  protected readonly pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Actualités',
      description:
        "Retrouvez toutes les actualités de Team Divergentes : résultats de compétitions esport, annonces, recrutement et vie de l'équipe. Restez informés !",
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
      types: this.articleTypesService.getArticleTypes().pipe(catchError(() => of(null))),
      articles: this.articlesService
        .getArticles({ published: true, limit: this.limit, page: 1 })
        .pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: results => {
          if (results.featured) {
            this.featuredArticles.set(results.featured.data);
          }
          if (results.types) {
            this.articleTypes.set(results.types);
          }
          if (results.articles) {
            this.articles.set(results.articles.data);
            this.initialArticles.set(results.articles.data);
            this.totalPages.set(results.articles.meta.totalPages);
            this.totalItems.set(results.articles.meta.total);
            this.updateJsonLd([...(results.featured?.data ?? []), ...results.articles.data]);
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
        next: response => {
          this.articles.set(response.data);
          this.totalPages.set(response.meta.totalPages);
          this.totalItems.set(response.meta.total);
          this.loading.set(false);
          // Restore focus after filter/page change for a11y
          setTimeout(() => {
            this.editorialSection?.nativeElement?.focus({ preventScroll: true });
          }, 0);
        },
        error: () => {
          this.error.set('Erreur lors du chargement des articles.');
          this.loading.set(false);
        },
      });
  }

  private updateJsonLd(articleList: Article[]): void {
    // Deduplicate by ID before building the JSON-LD list
    const unique = new Map<number, Article>();
    articleList.forEach(a => unique.set(a.id, a));
    const deduped = Array.from(unique.values());

    const siteUrl = this.runtimeConfig.siteUrl;

    const breadcrumbList = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Actualités',
          item: `${siteUrl}/articles`,
        },
      ],
    };

    const itemList = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Articles Team Divergentes',
      itemListElement: deduped.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Article',
          url: `${siteUrl}/articles/${article.slug}`,
          name: article.title,
          ...(article.excerpt ? { description: article.excerpt } : {}),
          ...(article.imageUrl ? { image: article.imageUrl } : {}),
          datePublished: article.createdAt,
        },
      })),
    };

    this.seoService.setJsonLd([breadcrumbList, itemList]);
  }

  protected getImageUrl(article: Article): string {
    return article.imageUrl ?? 'assets/img/home/img1.png';
  }

  protected getTypeCount(typeId: number): number {
    return this.typeArticleCounts().get(typeId) ?? 0;
  }
}
