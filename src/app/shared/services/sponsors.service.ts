import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Sponsor,
  CreateSponsorDto,
  UpdateSponsorDto,
  AddImageDto,
  AddLinkDto,
  UpdateLinkDto,
  SponsorImage,
  SponsorLink
} from '../models';

/**
 * Service de gestion des sponsors
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class SponsorsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/sponsors`;

  // Signal contenant la liste des sponsors
  private readonly sponsorsData = signal<Sponsor[]>([]);

  // Computed signal pour la liste des sponsors
  readonly sponsors = computed(() => this.sponsorsData());

  /**
   * Charge tous les sponsors actifs (endpoint public)
   */
  loadSponsors(): Observable<Sponsor[]> {
    return this.http.get<Sponsor[]>(this.apiUrl).pipe(
      tap(data => this.sponsorsData.set(data))
    );
  }

  /**
   * Charge tous les sponsors (actifs et inactifs) pour l'admin
   */
  loadAllSponsors(): Observable<Sponsor[]> {
    return this.http.get<Sponsor[]>(`${this.apiUrl}/admin/all`).pipe(
      tap(data => this.sponsorsData.set(data))
    );
  }

  /**
   * Récupère un sponsor par son slug
   * @param slug - Slug du sponsor
   */
  getSponsorBySlug(slug: string): Observable<Sponsor> {
    return this.http.get<Sponsor>(`${this.apiUrl}/${slug}`);
  }

  // ========== Admin Methods ==========

  /**
   * Crée un nouveau sponsor
   * @param data - Données du sponsor
   */
  createSponsor(data: CreateSponsorDto): Observable<Sponsor> {
    return this.http.post<Sponsor>(this.apiUrl, data).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Met a jour un sponsor
   * @param id - ID du sponsor
   * @param data - Données de mise a jour
   */
  updateSponsor(id: number, data: UpdateSponsorDto): Observable<Sponsor> {
    return this.http.put<Sponsor>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Supprime un sponsor
   * @param id - ID du sponsor
   */
  deleteSponsor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Active/désactive un sponsor
   * @param id - ID du sponsor
   */
  toggleSponsorActive(id: number): Observable<Sponsor> {
    return this.http.patch<Sponsor>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Reordonne les sponsors
   * @param orderedIds - IDs dans l'ordre souhaité
   */
  reorder(orderedIds: number[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/reorder`, { orderedIds }).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  // ========== Images ==========

  /**
   * Ajoute une image a un sponsor
   * @param sponsorId - ID du sponsor
   * @param data - Données de l'image
   */
  addImage(sponsorId: number, data: AddImageDto): Observable<SponsorImage> {
    return this.http.post<SponsorImage>(`${this.apiUrl}/${sponsorId}/images`, data).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Supprime une image
   * @param sponsorId - ID du sponsor
   * @param imageId - ID de l'image
   */
  removeImage(sponsorId: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sponsorId}/images/${imageId}`).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Définit une image comme principale
   * @param sponsorId - ID du sponsor
   * @param imageId - ID de l'image
   */
  setPrimaryImage(sponsorId: number, imageId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${sponsorId}/images/${imageId}/primary`, {}).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Reordonne les images d'un sponsor
   * @param sponsorId - ID du sponsor
   * @param orderedIds - IDs dans l'ordre souhaité
   */
  reorderImages(sponsorId: number, orderedIds: number[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${sponsorId}/images/reorder`, { orderedIds }).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  // ========== Links ==========

  /**
   * Ajoute un lien a un sponsor
   * @param sponsorId - ID du sponsor
   * @param data - Données du lien
   */
  addLink(sponsorId: number, data: AddLinkDto): Observable<SponsorLink> {
    return this.http.post<SponsorLink>(`${this.apiUrl}/${sponsorId}/links`, data).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Met a jour un lien
   * @param sponsorId - ID du sponsor
   * @param linkId - ID du lien
   * @param data - Données de mise a jour
   */
  updateLink(sponsorId: number, linkId: number, data: UpdateLinkDto): Observable<SponsorLink> {
    return this.http.put<SponsorLink>(`${this.apiUrl}/${sponsorId}/links/${linkId}`, data).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }

  /**
   * Supprime un lien
   * @param sponsorId - ID du sponsor
   * @param linkId - ID du lien
   */
  removeLink(sponsorId: number, linkId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${sponsorId}/links/${linkId}`).pipe(
      tap(() => {
        this.loadAllSponsors().subscribe();
      })
    );
  }
}
