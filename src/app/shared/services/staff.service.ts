import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StaffMember, CreateStaffDto, UpdateStaffDto, StaffCategory } from '../models';

/**
 * Service de gestion du staff
 * Utilise les signals Angular pour la réactivité
 */
@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/staff`;

  // Signal contenant tous les membres du staff
  private readonly staffMembersSignal = signal<StaffMember[]>([]);

  // Computed signals pour filtrer par catégorie
  readonly admins = computed(() =>
    this.staffMembersSignal()
      .filter(m => m.category === StaffCategory.ADMIN)
      .sort((a, b) => a.position - b.position)
  );

  readonly headstaff = computed(() =>
    this.staffMembersSignal()
      .filter(m => m.category === StaffCategory.HEADSTAFF)
      .sort((a, b) => a.position - b.position)
  );

  readonly ambassadors = computed(() =>
    this.staffMembersSignal()
      .filter(m => m.category === StaffCategory.AMBASSADOR)
      .sort((a, b) => a.position - b.position)
  );

  readonly allStaff = computed(() => this.staffMembersSignal());

  /**
   * Charge tous les membres du staff depuis l'API
   */
  loadStaff(): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(this.apiUrl).pipe(
      tap(staff => this.staffMembersSignal.set(staff))
    );
  }

  /**
   * Récupère un membre du staff par son ID
   * @param id - ID du membre
   */
  getStaffMember(id: number): Observable<StaffMember> {
    return this.http.get<StaffMember>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouveau membre du staff
   * @param data - Données du membre
   */
  createMember(data: CreateStaffDto): Observable<StaffMember> {
    return this.http.post<StaffMember>(this.apiUrl, data).pipe(
      tap(newMember => {
        this.staffMembersSignal.set([...this.staffMembersSignal(), newMember]);
      })
    );
  }

  /**
   * Met à jour un membre du staff
   * @param id - ID du membre
   * @param data - Données de mise à jour
   */
  updateMember(id: number, data: UpdateStaffDto): Observable<StaffMember> {
    return this.http.put<StaffMember>(`${this.apiUrl}/${id}`, data).pipe(
      tap(updatedMember => {
        const staff = this.staffMembersSignal();
        const index = staff.findIndex(m => m.id === id);
        if (index !== -1) {
          const newStaff = [...staff];
          newStaff[index] = updatedMember;
          this.staffMembersSignal.set(newStaff);
        }
      })
    );
  }

  /**
   * Supprime un membre du staff
   * @param id - ID du membre
   */
  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const staff = this.staffMembersSignal();
        this.staffMembersSignal.set(staff.filter(m => m.id !== id));
      })
    );
  }

  /**
   * Réordonne les membres du staff
   * @param members - Tableau des membres avec leur nouvel ordre
   */
  reorderMembers(members: { id: number; position: number }[]): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/reorder`, { items: members }).pipe(
      tap(() => {
        // Met à jour l'ordre local
        const staff = this.staffMembersSignal();
        const updatedStaff = staff.map(member => {
          const reorder = members.find(m => m.id === member.id);
          return reorder ? { ...member, position: reorder.position } : member;
        });
        this.staffMembersSignal.set(updatedStaff);
      })
    );
  }
}
