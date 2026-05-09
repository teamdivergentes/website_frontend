import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { catchError, of, switchMap } from 'rxjs';
import { ArticlesService } from '../../../shared/services/articles.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Article } from '../../../shared/models';
import { EditorBlocksRendererComponent } from '../../../shared/components/editor-blocks-renderer/editor-blocks-renderer.component';

const SITE_URL = 'https://teamdivergentes.fr';
const DEFAULT_OG_IMAGE = '/assets/img/banniere-charte-graphique/images4k.jpg';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, EditorBlocksRendererComponent],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly articlesService = inject(ArticlesService);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly article = signal<Article | null>(null);
  readonly loading = signal(true);
  readonly similarArticles = signal<Article[]>([]);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');
        if (!slug) {
          this.markNotFound();
          return of(null);
        }
        this.loading.set(true);
        this.article.set(null);
        this.similarArticles.set([]);
        return this.articlesService.getArticleBySlug(slug).pipe(
          catchError(() => {
            this.markNotFound();
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(article => {
      if (!article) return;
      this.article.set(article);
      this.loading.set(false);
      this.updateSeo(article);
      this.loadSimilarArticles(article);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  private markNotFound(): void {
    this.loading.set(false);
    this.article.set(null);
    // Reste sur l'URL originale avec noindex — laisse Google déréférencer l'URL
    // proprement au lieu de masquer le 404 derrière un redirect.
    this.seoService.updateMetaTags({
      title: 'Article introuvable',
      description: "Cet article n'existe plus ou a été déplacé.",
      noIndex: true,
    });
    this.seoService.clearJsonLd();
  }

  ngOnDestroy(): void {
    this.seoService.updateMetaTags({});
    this.seoService.clearJsonLd();
  }

  private loadSimilarArticles(article: Article): void {
    if (!article.typeId) return;

    this.articlesService
      .getArticles({ typeId: article.typeId, limit: 4, published: true })
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        if (!response) return;
        const similar = response.data.filter(a => a.id !== article.id).slice(0, 3);
        this.similarArticles.set(similar);
      });
  }

  private updateSeo(article: Article): void {
    const description = article.excerpt ?? 'Retrouvez cet article sur Team Divergentes.';
    const ogImage = article.imageUrl ?? DEFAULT_OG_IMAGE;

    this.seoService.updateMetaTags({
      title: article.title,
      description,
      image: ogImage,
      url: `/articles/${article.slug}`,
      type: 'article',
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
    });

    this.seoService.setJsonLd([
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description,
        image: ogImage,
        datePublished: article.createdAt,
        dateModified: article.updatedAt,
        author: {
          '@type': 'Organization',
          name: 'Team Divergentes',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Team Divergentes',
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/assets/logos/logoTD.svg`,
          },
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Articles', item: `${SITE_URL}/articles` },
          { '@type': 'ListItem', position: 3, name: article.title },
        ],
      },
    ]);
  }
}
