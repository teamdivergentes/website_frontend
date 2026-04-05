import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ArticlesService } from '../../shared/services/articles.service';
import { Article } from '../../shared/models/article.model';

@Component({
  selector: 'app-home-articles-section',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './home-articles-section.html',
  styleUrl: './home-articles-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeArticlesSectionComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly articlesService = inject(ArticlesService);

  protected readonly loading = signal(true);
  protected readonly articles = signal<Article[]>([]);

  /** Skeleton placeholders : 3 cartes pendant le chargement */
  protected readonly skeletonItems = [0, 1, 2];

  /** N'affiche la section que si au moins un article est disponible */
  protected readonly hasArticles = computed(() => this.articles().length > 0);

  ngOnInit(): void {
    this.articlesService
      .getHomepageArticles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.articles.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.articles.set([]);
          this.loading.set(false);
        },
      });
  }

  protected getImageUrl(article: Article): string {
    return article.imageUrl ?? 'assets/img/home/img1.png';
  }
}
