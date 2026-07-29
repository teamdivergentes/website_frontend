import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateMatchDto, Match, MatchAdmin, UpdateMatchDto } from '../models/match.model';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly http = inject(HttpClient);
  private readonly publicBase = `${environment.apiUrl}/api/matches`;
  private readonly adminBase = `${environment.apiUrl}/api/admin/matches`;

  private readonly adminMatchesSignal = signal<MatchAdmin[]>([]);
  readonly adminMatches = this.adminMatchesSignal.asReadonly();

  /**
   * Charge les prochains matchs (status=upcoming, trié date asc).
   * Ne modifie aucun signal.
   */
  getUpcoming(limit?: number, teamId?: number): Observable<Match[]> {
    let params = new HttpParams().set('status', 'upcoming');
    if (limit != null) params = params.set('limit', String(limit));
    if (teamId != null) params = params.set('teamId', String(teamId));
    return this.http.get<Match[]>(this.publicBase, { params });
  }

  /**
   * Charge les résultats passés (status=past, trié date desc, uniquement matchs avec scores).
   * Ne modifie aucun signal.
   */
  getResults(limit?: number, teamId?: number): Observable<Match[]> {
    let params = new HttpParams().set('status', 'past');
    if (limit != null) params = params.set('limit', String(limit));
    if (teamId != null) params = params.set('teamId', String(teamId));
    return this.http.get<Match[]>(this.publicBase, { params });
  }

  /**
   * Charge tous les matchs admin et popule le signal adminMatches.
   */
  loadAdminMatches(): Observable<MatchAdmin[]> {
    return this.http
      .get<MatchAdmin[]>(this.adminBase)
      .pipe(tap(matches => this.adminMatchesSignal.set(matches)));
  }

  createMatch(dto: CreateMatchDto): Observable<MatchAdmin> {
    return this.http.post<MatchAdmin>(this.adminBase, dto).pipe(
      tap(created => this.adminMatchesSignal.set([...this.adminMatchesSignal(), created])),
    );
  }

  updateMatch(id: number, dto: UpdateMatchDto): Observable<MatchAdmin> {
    return this.http.patch<MatchAdmin>(`${this.adminBase}/${id}`, dto).pipe(
      tap(updated =>
        this.adminMatchesSignal.set(
          this.adminMatchesSignal().map(m => (m.id === id ? updated : m)),
        ),
      ),
    );
  }

  deleteMatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminBase}/${id}`).pipe(
      tap(() =>
        this.adminMatchesSignal.set(this.adminMatchesSignal().filter(m => m.id !== id)),
      ),
    );
  }
}
