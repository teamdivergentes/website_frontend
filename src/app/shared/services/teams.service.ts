import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Team,
  TeamWithMembers,
  TeamMember,
  CreateTeamDto,
  UpdateTeamDto,
  CreateMemberDto,
  UpdateMemberDto
} from '../models';

/**
 * Service de gestion des équipes
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/teams`;

  // Signal contenant toutes les équipes
  private readonly teamsSignal = signal<Team[]>([]);

  // Computed signal pour les équipes actives triées par position
  readonly activeTeams = computed(() =>
    this.teamsSignal()
      .filter(team => team.active)
      .sort((a, b) => a.position - b.position)
  );

  // Computed signal pour toutes les équipes triées par position
  readonly allTeams = computed(() =>
    this.teamsSignal().sort((a, b) => a.position - b.position)
  );

  /**
   * Charge toutes les équipes depuis l'API
   */
  loadTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(this.apiUrl).pipe(
      tap(teams => this.teamsSignal.set(teams))
    );
  }

  /**
   * Récupère une équipe par son slug avec ses membres
   * @param slug - Slug de l'équipe
   */
  getTeamBySlug(slug: string): Observable<TeamWithMembers> {
    return this.http.get<TeamWithMembers>(`${this.apiUrl}/${slug}`);
  }

  /**
   * Crée une nouvelle équipe
   * @param data - Données de l'équipe
   */
  createTeam(data: CreateTeamDto): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, data).pipe(
      tap(newTeam => {
        this.teamsSignal.set([...this.teamsSignal(), newTeam]);
      })
    );
  }

  /**
   * Met à jour une équipe
   * @param id - ID de l'équipe
   * @param data - Données de mise à jour
   */
  updateTeam(id: number, data: UpdateTeamDto): Observable<Team> {
    return this.http.put<Team>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updatedTeam => {
        const teams = this.teamsSignal();
        const index = teams.findIndex(t => t.id === id);
        if (index !== -1) {
          const newTeams = [...teams];
          newTeams[index] = updatedTeam;
          this.teamsSignal.set(newTeams);
        }
      })
    );
  }

  /**
   * Supprime une équipe
   * @param id - ID de l'équipe
   */
  deleteTeam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const teams = this.teamsSignal();
        this.teamsSignal.set(teams.filter(t => t.id !== id));
      })
    );
  }

  /**
   * Réordonne les équipes
   * @param orderedIds - Tableau des équipes avec leur nouvelle position
   */
  reorderTeams(orderedIds: { id: number; position: number }[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/reorder`, { items: orderedIds }).pipe(
      tap(() => {
        // Met à jour l'ordre local
        const teams = this.teamsSignal();
        const updatedTeams = teams.map(team => {
          const reorder = orderedIds.find(o => o.id === team.id);
          return reorder ? { ...team, position: reorder.position } : team;
        });
        this.teamsSignal.set(updatedTeams);
      })
    );
  }

  /**
   * Active/désactive une équipe
   * @param id - ID de l'équipe
   */
  toggleTeamActive(id: number): Observable<Team> {
    return this.http.patch<Team>(`${this.apiUrl}/${id}/toggle`, {}).pipe(
      tap(updatedTeam => {
        const teams = this.teamsSignal();
        const index = teams.findIndex(t => t.id === id);
        if (index !== -1) {
          const newTeams = [...teams];
          newTeams[index] = updatedTeam;
          this.teamsSignal.set(newTeams);
        }
      })
    );
  }

  // ========== Gestion des membres ==========

  /**
   * Ajoute un membre à une équipe
   * @param teamId - ID de l'équipe
   * @param data - Données du membre
   */
  addMember(teamId: number, data: CreateMemberDto): Observable<TeamMember> {
    return this.http.post<TeamMember>(`${this.apiUrl}/${teamId}/members`, data);
  }

  /**
   * Met à jour un membre
   * @param teamId - ID de l'équipe
   * @param memberId - ID du membre
   * @param data - Données de mise à jour
   */
  updateMember(teamId: number, memberId: number, data: UpdateMemberDto): Observable<TeamMember> {
    return this.http.put<TeamMember>(`${this.apiUrl}/${teamId}/members/${memberId}`, data);
  }

  /**
   * Supprime un membre
   * @param teamId - ID de l'équipe
   * @param memberId - ID du membre
   */
  deleteMember(teamId: number, memberId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${teamId}/members/${memberId}`);
  }

  /**
   * Réordonne les membres d'une équipe
   * @param teamId - ID de l'équipe
   * @param orderedIds - Tableau des membres avec leur nouvelle position
   */
  reorderMembers(teamId: number, orderedIds: { id: number; position: number }[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${teamId}/members/reorder`, { items: orderedIds });
  }

  /**
   * Récupère un membre par son slug
   * @param slug - Slug du membre
   */
  getMemberBySlug(slug: string): Observable<TeamMember> {
    return this.http.get<TeamMember>(`${environment.apiUrl}/api/members/by-slug/${slug}`);
  }
}
