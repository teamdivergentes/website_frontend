import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Role } from '../../models/user.model';

/**
 * Service de gestion des rôles
 */
@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/roles`;

  // Signal contenant tous les rôles
  private readonly rolesSignal = signal<Role[]>([]);

  readonly roles = this.rolesSignal.asReadonly();

  /**
   * Charge tous les rôles depuis l'API
   */
  loadRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl).pipe(
      tap(roles => this.rolesSignal.set(roles))
    );
  }

  /**
   * Récupère tous les rôles (alias pour la compatibilité)
   */
  getRoles(): Observable<Role[]> {
    return this.loadRoles();
  }

  /**
   * Récupère un rôle par son ID
   */
  getRole(id: number): Observable<Role> {
    return this.http.get<Role>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouveau rôle
   */
  createRole(data: { name: string; permissions: string[] }): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, data).pipe(
      tap(() => this.loadRoles().subscribe())
    );
  }

  /**
   * Met à jour un rôle
   */
  updateRole(id: number, data: { name?: string; permissions?: string[] }): Observable<Role> {
    return this.http.patch<Role>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.loadRoles().subscribe())
    );
  }

  /**
   * Supprime un rôle
   */
  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadRoles().subscribe())
    );
  }

  /**
   * Récupère les groupes de permissions disponibles
   */
  getPermissions(): Observable<Array<{ module: string; permissions: string[] }>> {
    // Pour l'instant, retourner les permissions en dur
    // À remplacer par un appel API si le backend expose /api/roles/permissions
    return new Observable(observer => {
      observer.next([
        {
          module: 'Utilisateurs',
          permissions: ['users:read', 'users:write', 'users:delete']
        },
        {
          module: 'Rôles',
          permissions: ['roles:read', 'roles:write', 'roles:delete']
        },
        {
          module: 'Équipes',
          permissions: ['teams:read', 'teams:write', 'teams:delete']
        },
        {
          module: 'Jeux',
          permissions: ['games:read', 'games:write', 'games:delete']
        },
        {
          module: 'Sponsors',
          permissions: ['sponsors:read', 'sponsors:write', 'sponsors:delete']
        },
        {
          module: 'Staff',
          permissions: ['staff:read', 'staff:write', 'staff:delete']
        },
        {
          module: 'Configuration',
          permissions: ['config:read', 'config:write']
        },
        {
          module: 'Annonces',
          permissions: ['annonces:read', 'annonces:write', 'annonces:delete']
        },
        {
          module: 'Articles',
          permissions: ['articles:read', 'articles:write', 'articles:delete']
        }
      ]);
      observer.complete();
    });
  }
}