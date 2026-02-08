import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { User, UpdateProfileDto, ChangePasswordDto } from '../../models/user.model';
import { AuthService } from './auth.service';

/**
 * Service de gestion du profil utilisateur
 * Permet à l'utilisateur connecté de modifier ses informations
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/api/profile`;

  /**
   * Met à jour le profil de l'utilisateur connecté
   * @param dto - Données de mise à jour (email, etc.)
   */
  updateProfile(dto: UpdateProfileDto): Observable<User> {
    return this.http.put<User>(this.apiUrl, dto).pipe(
      tap(() => {
        // Recharge le profil complet depuis AuthService
        this.authService.loadProfile().subscribe();
      })
    );
  }

  /**
   * Change le mot de passe de l'utilisateur connecté
   * @param dto - Ancien et nouveau mot de passe
   */
  changePassword(dto: ChangePasswordDto): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/password`, dto);
  }
}