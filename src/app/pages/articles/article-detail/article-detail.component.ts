import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ArticlesService } from '../../../shared/services/articles.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Article } from '../../../shared/models';
import { EditorBlocksRendererComponent } from '../../../shared/components/editor-blocks-renderer/editor-blocks-renderer.component';

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
  private readonly router = inject(Router);
  private readonly articlesService = inject(ArticlesService);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly article = signal<Article | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/404']);
      return;
    }

    this.articlesService.getArticleBySlug(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (article) => {
        this.article.set(article);
        this.loading.set(false);
        this.updateSeo(article);
      },
      error: () => {
        this.router.navigate(['/404']);
      }
    });
  }

  ngOnDestroy(): void {
    this.seoService.updateMetaTags({});
    this.seoService.clearJsonLd();
  }

  private updateSeo(article: Article): void {
    const description = article.excerpt ?? 'Retrouvez cet article sur Team Divergentes.';

    this.seoService.updateMetaTags({
      title: article.title,
      description,
      image: article.imageUrl,
      url: `/articles/${article.slug}`,
    });

    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description,
      image: article.imageUrl,
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
          url: 'https://teamdivergentes.fr/assets/logos/logoTD.svg',
        },
      },
    });
  }
}
