import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTrophyDto, Trophy, UpdateTrophyDto } from '../models/trophy.model';

export interface TrophyYearGroup {
  year: number;
  trophies: Trophy[];
}

@Injectable({ providedIn: 'root' })
export class TrophiesService {
  private readonly http = inject(HttpClient);
  private readonly publicBase = `${environment.apiUrl}/api/trophies`;
  private readonly adminBase = `${environment.apiUrl}/api/admin/trophies`;

  private readonly trophiesSignal = signal<Trophy[]>([]);
  private readonly adminTrophiesSignal = signal<Trophy[]>([]);

  readonly trophies = this.trophiesSignal.asReadonly();
  readonly adminTrophies = this.adminTrophiesSignal.asReadonly();

  readonly featuredTrophies = computed(() =>
    this.trophiesSignal().filter(trophy => trophy.featured),
  );

  readonly trophiesByYear = computed<TrophyYearGroup[]>(() => {
    const byYear = new Map<number, Trophy[]>();
    for (const trophy of this.trophiesSignal()) {
      const year = new Date(trophy.date).getFullYear();
      byYear.set(year, [...(byYear.get(year) ?? []), trophy]);
    }
    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, trophies]) => ({ year, trophies }));
  });

  loadTrophies(): Observable<Trophy[]> {
    return this.http
      .get<Trophy[]>(this.publicBase)
      .pipe(tap(trophies => this.trophiesSignal.set(trophies)));
  }

  getTeamTrophies(teamId: number): Observable<Trophy[]> {
    return this.http.get<Trophy[]>(`${this.publicBase}?teamId=${teamId}`);
  }

  loadAdminTrophies(): Observable<Trophy[]> {
    return this.http
      .get<Trophy[]>(this.adminBase)
      .pipe(tap(trophies => this.adminTrophiesSignal.set(trophies)));
  }

  createTrophy(dto: CreateTrophyDto): Observable<Trophy> {
    return this.http.post<Trophy>(this.adminBase, dto).pipe(
      tap(created => this.adminTrophiesSignal.set([...this.adminTrophiesSignal(), created])),
    );
  }

  updateTrophy(id: number, dto: UpdateTrophyDto): Observable<Trophy> {
    return this.http.patch<Trophy>(`${this.adminBase}/${id}`, dto).pipe(
      tap(updated =>
        this.adminTrophiesSignal.set(
          this.adminTrophiesSignal().map(trophy => (trophy.id === id ? updated : trophy)),
        ),
      ),
    );
  }

  deleteTrophy(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminBase}/${id}`).pipe(
      tap(() =>
        this.adminTrophiesSignal.set(
          this.adminTrophiesSignal().filter(trophy => trophy.id !== id),
        ),
      ),
    );
  }
}
