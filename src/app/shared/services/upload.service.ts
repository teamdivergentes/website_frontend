import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Response du upload d'image
 */
export interface UploadResponse {
  url: string;
  filename: string;
}

/**
 * Événement de progression de l'upload
 */
export interface UploadProgress {
  progress: number;
  url?: string;
}

/**
 * Service de gestion des uploads d'images
 */
@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/upload`;

  /**
   * Upload une image vers le serveur
   * @param file - Fichier image à uploader
   * @returns Observable avec la progression et l'URL finale
   */
  uploadImage(file: File): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/image`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<UploadResponse>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress: {
            const progress = event.total
              ? Math.round((100 * event.loaded) / event.total)
              : 0;
            return { progress };
          }

          case HttpEventType.Response: {
            return {
              progress: 100,
              url: event.body?.url
            };
          }

          default:
            return { progress: 0 };
        }
      })
    );
  }

  /**
   * Supprime une image du serveur
   * @param imageUrl - URL de l'image à supprimer
   * @returns Observable<void>
   */
  deleteImage(imageUrl: string): Observable<void> {
    const filename = imageUrl.split('/').pop();
    return this.http.delete<void>(`${this.apiUrl}/${filename}`);
  }
}
