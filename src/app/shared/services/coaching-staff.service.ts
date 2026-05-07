import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CoachingStaffMember,
  CreateCoachingStaffDto,
  UpdateCoachingStaffDto,
  ReorderCoachingStaffDto,
} from '../models';

/**
 * Service de gestion du coaching staff par équipe (admin CRUD)
 */
@Injectable({
  providedIn: 'root',
})
export class CoachingStaffService {
  private readonly http = inject(HttpClient);
  private readonly adminBase = `${environment.apiUrl}/api/admin`;

  /**
   * Liste le coaching staff d'une équipe (endpoint admin)
   */
  list(teamId: number): Observable<CoachingStaffMember[]> {
    return this.http.get<CoachingStaffMember[]>(
      `${this.adminBase}/teams/${teamId}/coaching-staff`,
    );
  }

  /**
   * Crée un membre du coaching staff
   */
  create(teamId: number, dto: CreateCoachingStaffDto): Observable<CoachingStaffMember> {
    return this.http.post<CoachingStaffMember>(
      `${this.adminBase}/teams/${teamId}/coaching-staff`,
      dto,
    );
  }

  /**
   * Met à jour un membre du coaching staff (PATCH partiel)
   * Le path inclut teamId pour eviter l'IDOR (verification croisee cote backend, audit DB-01)
   */
  update(teamId: number, id: number, dto: UpdateCoachingStaffDto): Observable<CoachingStaffMember> {
    return this.http.patch<CoachingStaffMember>(
      `${this.adminBase}/teams/${teamId}/coaching-staff/${id}`,
      dto,
    );
  }

  /**
   * Supprime un membre du coaching staff
   * Le path inclut teamId pour eviter l'IDOR (audit DB-01)
   */
  delete(teamId: number, id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminBase}/teams/${teamId}/coaching-staff/${id}`);
  }

  /**
   * Réordonne le coaching staff d'une équipe
   */
  reorder(teamId: number, items: Array<{ id: number; position: number }>): Observable<{ message: string }> {
    const dto: ReorderCoachingStaffDto = { items };
    return this.http.patch<{ message: string }>(
      `${this.adminBase}/teams/${teamId}/coaching-staff/reorder`,
      dto,
    );
  }
}
