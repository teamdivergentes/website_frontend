import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  UserSearchParams,
  PaginatedResponse
} from '../../models/user.model';

/**
 * Service de gestion des utilisateurs (admin)
 * Gère le CRUD complet des utilisateurs avec pagination et filtres
 */
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/users`;

  /**
   * Récupère la liste paginée des utilisateurs avec filtres
   * @param params - Paramètres de recherche et pagination
   */
  getUsers(params?: UserSearchParams): Observable<PaginatedResponse<User>> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.roleId !== undefined) httpParams = httpParams.set('roleId', params.roleId.toString());
      if (params.actif !== undefined) httpParams = httpParams.set('actif', params.actif.toString());
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.http.get<PaginatedResponse<User>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Récupère un utilisateur par son ID
   * @param id - ID de l'utilisateur
   */
  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouvel utilisateur
   * @param dto - Données de création
   */
  createUser(dto: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, dto);
  }

  /**
   * Met à jour un utilisateur
   * @param id - ID de l'utilisateur
   * @param dto - Données de mise à jour
   */
  updateUser(id: number, dto: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Supprime un utilisateur
   * @param id - ID de l'utilisateur
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Active/désactive un utilisateur
   * @param id - ID de l'utilisateur
   */
  toggleActive(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle`, {});
  }

  /**
   * Assigne un rôle à un utilisateur
   * @param id - ID de l'utilisateur
   * @param roleId - ID du nouveau rôle
   */
  assignRole(id: number, roleId: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/role`, { roleId });
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur (admin)
   * @param id - ID de l'utilisateur
   * @param newPassword - Nouveau mot de passe
   */
  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/password`, { newPassword });
  }
}
