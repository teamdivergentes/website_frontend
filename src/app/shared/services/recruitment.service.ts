import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RecruitmentPost,
  CreateRecruitmentDto,
  UpdateRecruitmentDto
} from '../models';

/**
 * Service de gestion des offres de recrutement
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class RecruitmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/recruitment`;

  // Signal contenant toutes les offres
  private readonly postsSignal = signal<RecruitmentPost[]>([]);

  // Computed signal pour les offres actives triées par position
  readonly activePosts = computed(() =>
    this.postsSignal()
      .filter(post => post.active)
      .sort((a, b) => a.position - b.position)
  );

  // Computed signal pour toutes les offres triées par position
  readonly allPosts = computed(() =>
    this.postsSignal().sort((a, b) => a.position - b.position)
  );

  /**
   * Charge toutes les offres actives depuis l'API (endpoint public)
   */
  loadActivePosts(): Observable<RecruitmentPost[]> {
    return this.http.get<RecruitmentPost[]>(this.apiUrl).pipe(
      tap(posts => this.postsSignal.set(posts))
    );
  }

  /**
   * Charge toutes les offres (actives et inactives) pour l'admin
   */
  loadAllPosts(): Observable<RecruitmentPost[]> {
    return this.http.get<RecruitmentPost[]>(`${this.apiUrl}/admin/all`).pipe(
      tap(posts => this.postsSignal.set(posts))
    );
  }

  /**
   * Récupère une offre par son ID
   * @param id - ID de l'offre
   */
  getPostById(id: number): Observable<RecruitmentPost> {
    return this.http.get<RecruitmentPost>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupère une offre par son slug
   * @param slug - Slug URL de l'offre
   */
  getPostBySlug(slug: string): Observable<RecruitmentPost> {
    return this.http.get<RecruitmentPost>(`${this.apiUrl}/by-slug/${slug}`);
  }

  /**
   * Crée une nouvelle offre
   * @param data - Données de l'offre
   */
  createPost(data: CreateRecruitmentDto): Observable<RecruitmentPost> {
    return this.http.post<RecruitmentPost>(this.apiUrl, data).pipe(
      tap(newPost => {
        this.postsSignal.set([...this.postsSignal(), newPost]);
      })
    );
  }

  /**
   * Met à jour une offre
   * @param id - ID de l'offre
   * @param data - Données de mise à jour
   */
  updatePost(id: number, data: UpdateRecruitmentDto): Observable<RecruitmentPost> {
    return this.http.put<RecruitmentPost>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updatedPost => {
        const posts = this.postsSignal();
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
          const newPosts = [...posts];
          newPosts[index] = updatedPost;
          this.postsSignal.set(newPosts);
        }
      })
    );
  }

  /**
   * Supprime une offre
   * @param id - ID de l'offre
   */
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const posts = this.postsSignal();
        this.postsSignal.set(posts.filter(p => p.id !== id));
      })
    );
  }

  /**
   * Active/désactive une offre
   * @param id - ID de l'offre
   */
  toggleActive(id: number): Observable<RecruitmentPost> {
    return this.http.patch<RecruitmentPost>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(updatedPost => {
        const posts = this.postsSignal();
        const index = posts.findIndex(p => p.id === id);
        if (index !== -1) {
          const newPosts = [...posts];
          newPosts[index] = updatedPost;
          this.postsSignal.set(newPosts);
        }
      })
    );
  }

  /**
   * Réordonne les offres
   * @param orderedIds - Tableau des offres avec leur nouvelle position
   */
  reorderPosts(orderedIds: { id: number; position: number }[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/reorder`, { items: orderedIds }).pipe(
      tap(() => {
        // Met à jour l'ordre local
        const posts = this.postsSignal();
        const updatedPosts = posts.map(post => {
          const reorder = orderedIds.find(o => o.id === post.id);
          return reorder ? { ...post, position: reorder.position } : post;
        });
        this.postsSignal.set(updatedPosts);
      })
    );
  }

  /**
   * Envoie une candidature pour un poste
   * @param data - FormData contenant les données de la candidature
   */
  applyToPost(data: FormData): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/apply`, data);
  }
}
