import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ArticleType,
  CreateArticleTypeDto,
  UpdateArticleTypeDto
} from '../models';

/**
 * Service de gestion des types d'articles (catégories)
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class ArticleTypesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/article-types`;

  private readonly typesSignal = signal<ArticleType[]>([]);

  readonly allTypes = computed(() => this.typesSignal());

  /**
   * Récupère tous les types d'articles
   */
  getArticleTypes(): Observable<ArticleType[]> {
    return this.http.get<ArticleType[]>(this.apiUrl).pipe(
      tap(types => this.typesSignal.set(types))
    );
  }

  /**
   * Crée un nouveau type d'article
   */
  createArticleType(data: CreateArticleTypeDto): Observable<ArticleType> {
    return this.http.post<ArticleType>(this.apiUrl, data).pipe(
      tap(newType => {
        this.typesSignal.set([...this.typesSignal(), newType]);
      })
    );
  }

  /**
   * Met à jour un type d'article
   */
  updateArticleType(id: number, data: UpdateArticleTypeDto): Observable<ArticleType> {
    return this.http.patch<ArticleType>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updatedType => {
        const types = this.typesSignal();
        const index = types.findIndex(t => t.id === id);
        if (index !== -1) {
          const updated = [...types];
          updated[index] = updatedType;
          this.typesSignal.set(updated);
        }
      })
    );
  }

  /**
   * Supprime un type d'article
   */
  deleteArticleType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.typesSignal.set(this.typesSignal().filter(t => t.id !== id));
      })
    );
  }
}
