import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OverviewResponse,
  VisitorsResponse,
  TopPagesResponse,
  TrafficSourcesResponse,
  GeoResponse,
  DevicesResponse,
  RealtimeResponse
} from '../models';

/**
 * Service d'accès aux données analytics (Google Analytics Data API via backend)
 * Toutes les méthodes retournent un Observable sans mise en cache locale
 * (les données sont affichées ponctuellement selon la plage de dates choisie)
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/admin/analytics`;

  /**
   * Aperçu global des métriques pour une période donnée
   * Retourne aussi la comparaison avec la période précédente équivalente
   */
  getOverview(startDate: string, endDate: string): Observable<OverviewResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<OverviewResponse>(`${this.apiUrl}/overview`, { params });
  }

  /**
   * Données de visiteurs par jour (timeline)
   */
  getVisitors(startDate: string, endDate: string): Observable<VisitorsResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<VisitorsResponse>(`${this.apiUrl}/visitors`, { params });
  }

  /**
   * Top pages les plus visitées sur la période
   */
  getTopPages(startDate: string, endDate: string): Observable<TopPagesResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<TopPagesResponse>(`${this.apiUrl}/top-pages`, { params });
  }

  /**
   * Sources de trafic (canaux + sources détaillées)
   */
  getTrafficSources(startDate: string, endDate: string): Observable<TrafficSourcesResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<TrafficSourcesResponse>(`${this.apiUrl}/traffic-sources`, { params });
  }

  /**
   * Répartition géographique des utilisateurs (top pays)
   */
  getGeography(startDate: string, endDate: string): Observable<GeoResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<GeoResponse>(`${this.apiUrl}/geography`, { params });
  }

  /**
   * Répartition des appareils (desktop/mobile/tablet) et navigateurs
   */
  getDevices(startDate: string, endDate: string): Observable<DevicesResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<DevicesResponse>(`${this.apiUrl}/devices`, { params });
  }

  /**
   * Utilisateurs actifs en temps réel (sans paramètre de date)
   */
  getRealtime(): Observable<RealtimeResponse> {
    return this.http.get<RealtimeResponse>(`${this.apiUrl}/realtime`);
  }
}
