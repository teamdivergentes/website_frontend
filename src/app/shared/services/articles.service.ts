import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Article,
  CreateArticleDto,
  UpdateArticleDto,
  ArticleQueryParams,
  PaginatedArticles
} from '../models';

/**
 * Service de gestion des articles
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/articles`;

  private readonly articlesSignal = signal<Article[]>([]);
  private readonly homepageArticlesSignal = signal<Article[]>([]);

  readonly allArticles = computed(() => this.articlesSignal());
  readonly homepageArticles = computed(() => this.homepageArticlesSignal());
  readonly publishedArticles = computed(() =>
    this.articlesSignal().filter(a => a.published)
  );
  readonly featuredArticles = computed(() =>
    this.articlesSignal().filter(a => a.featured && a.published)
  );

  /**
   * Récupère les articles avec pagination et filtres
   */
  getArticles(params?: ArticleQueryParams): Observable<PaginatedArticles> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedArticles>(this.apiUrl, { params: httpParams }).pipe(
      tap(response => this.articlesSignal.set(response.data))
    );
  }

  /**
   * Récupère les articles pour la page d'accueil (publiés, en vedette)
   */
  getHomepageArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/homepage`).pipe(
      tap(articles => this.homepageArticlesSignal.set(articles))
    );
  }

  /**
   * Récupère un article par son ID
   */
  getArticleById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère un article par son slug
   */
  getArticleBySlug(slug: string): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/by-slug/${slug}`);
  }

  /**
   * Crée un nouvel article
   */
  createArticle(data: CreateArticleDto): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, data).pipe(
      tap(newArticle => {
        this.articlesSignal.set([newArticle, ...this.articlesSignal()]);
      })
    );
  }

  /**
   * Met à jour un article
   */
  updateArticle(id: number, data: UpdateArticleDto): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updatedArticle => {
        const articles = this.articlesSignal();
        const index = articles.findIndex(a => a.id === id);
        if (index !== -1) {
          const updated = [...articles];
          updated[index] = updatedArticle;
          this.articlesSignal.set(updated);
        }
      })
    );
  }

  /**
   * Supprime un article
   */
  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.articlesSignal.set(this.articlesSignal().filter(a => a.id !== id));
      })
    );
  }

  /**
   * Bascule l'état publié d'un article
   */
  togglePublished(id: number): Observable<Article> {
    return this.http.patch<Article>(`${this.apiUrl}/${id}/toggle-published`, {}).pipe(
      tap(updatedArticle => {
        const articles = this.articlesSignal();
        const index = articles.findIndex(a => a.id === id);
        if (index !== -1) {
          const updated = [...articles];
          updated[index] = updatedArticle;
          this.articlesSignal.set(updated);
        }
      })
    );
  }

  /**
   * Bascule l'état mis en avant d'un article
   */
  toggleFeatured(id: number): Observable<Article> {
    return this.http.patch<Article>(`${this.apiUrl}/${id}/toggle-featured`, {}).pipe(
      tap(updatedArticle => {
        const articles = this.articlesSignal();
        const index = articles.findIndex(a => a.id === id);
        if (index !== -1) {
          const updated = [...articles];
          updated[index] = updatedArticle;
          this.articlesSignal.set(updated);
        }
      })
    );
  }
}
