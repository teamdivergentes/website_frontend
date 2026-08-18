import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';

import { DashboardTrafficComponent } from './dashboard-traffic.component';
import { AnalyticsAdminService } from '../../../../shared/services/analytics-admin.service';
import type { OverviewResponse, RealtimeResponse } from '../../../../shared/models/analytics.model';

// ─── Données de test ──────────────────────────────────────────────────────────

const mockOverview: OverviewResponse = {
  period: { startDate: '2026-02-20', endDate: '2026-02-27' },
  previousPeriod: { startDate: '2026-02-13', endDate: '2026-02-20' },
  metrics: {
    totalUsers:         { value: 1234, previous: 1100, changePercent: 12.3 },
    newUsers:           { value: 456,  previous: 480,  changePercent: -5.1 },
    sessions:           { value: 789,  previous: 726,  changePercent: 8.7 },
    pageViews:          { value: 5678, previous: 4938, changePercent: 15.0 },
    avgSessionDuration: { value: 185,  previous: 190,  changePercent: -2.4 },
    bounceRate:         { value: 42.5, previous: 41.2, changePercent: 3.2 }
  }
};

const mockRealtime: RealtimeResponse = {
  activeUsers: 17,
  byPage: [{ page: '/structure/equipes', activeUsers: 5 }],
  byCountry: [{ country: 'France', activeUsers: 17 }],
  byDevice: [{ device: 'desktop', activeUsers: 12 }],
  updatedAt: '2026-02-27T10:00:00Z'
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('DashboardTrafficComponent', () => {
  let component: DashboardTrafficComponent;
  let fixture: ComponentFixture<DashboardTrafficComponent>;
  let analyticsService: jasmine.SpyObj<AnalyticsAdminService>;

  beforeEach(async () => {
    const analyticsSpy = jasmine.createSpyObj('AnalyticsAdminService', [
      'getOverview',
      'getRealtime'
    ]);

    analyticsSpy.getOverview.and.returnValue(of(mockOverview));
    analyticsSpy.getRealtime.and.returnValue(of(mockRealtime));

    await TestBed.configureTestingModule({
      imports: [DashboardTrafficComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AnalyticsAdminService, useValue: analyticsSpy }
      ]
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsAdminService) as jasmine.SpyObj<AnalyticsAdminService>;

    fixture = TestBed.createComponent(DashboardTrafficComponent);
    component = fixture.componentInstance;
  });

  // ─── Création ──────────────────────────────────────────────────────────────

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // ─── État initial ──────────────────────────────────────────────────────────

  it('doit démarrer en état chargement (analyticsLoading = true)', () => {
    expect(component.analyticsLoading()).toBeTrue();
  });

  it('doit appeler getOverview avec les 7 derniers jours au ngOnInit', () => {
    fixture.detectChanges();
    expect(analyticsService.getOverview).toHaveBeenCalledWith(
      jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      jasmine.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
    expect(analyticsService.getOverview).toHaveBeenCalledTimes(1);
  });

  it('doit appeler getRealtime au ngOnInit', () => {
    fixture.detectChanges();
    expect(analyticsService.getRealtime).toHaveBeenCalledTimes(1);
  });

  it('doit passer analyticsLoading à false après chargement réussi', () => {
    fixture.detectChanges();
    expect(component.analyticsLoading()).toBeFalse();
  });

  it('doit laisser analyticsUnavailable à false après chargement réussi', () => {
    fixture.detectChanges();
    expect(component.analyticsUnavailable()).toBeFalse();
  });

  // ─── Valeurs des métriques ─────────────────────────────────────────────────

  it('doit afficher "Visiteurs aujourd\'hui" avec la valeur formatée', () => {
    fixture.detectChanges();
    const visiteurs = component.analyticsMetrics().find(m => m.title === 'Visiteurs aujourd\'hui');
    expect(visiteurs).toBeDefined();
    expect(visiteurs!.value).toBe('1.2k');
  });

  it('doit afficher "Pages vues (7j)" avec la valeur formatée', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Pages vues (7j)');
    expect(metric).toBeDefined();
    expect(metric!.value).toBe('5.7k');
  });

  it('doit afficher "Sessions actives" avec la valeur realtime', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Sessions actives');
    expect(metric).toBeDefined();
    expect(metric!.value).toBe('17');
  });

  it('doit formater le taux de rebond avec le symbole %', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Taux de rebond');
    expect(metric).toBeDefined();
    expect(metric!.value).toBe('42.5%');
  });

  it('doit formater la durée moyenne en mm m ss s', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric).toBeDefined();
    expect(metric!.value).toBe('3m 05s');
  });

  it('doit afficher "Nouveaux visiteurs" avec la valeur correcte', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Nouveaux visiteurs');
    expect(metric).toBeDefined();
    expect(metric!.value).toContain('456');
  });

  // ─── Variations (change) ───────────────────────────────────────────────────

  it('doit retourner change positif pour totalUsers', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Visiteurs aujourd\'hui');
    expect(metric!.change).toBe(12.3);
  });

  it('doit retourner change négatif pour newUsers', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Nouveaux visiteurs');
    expect(metric!.change).toBe(-5.1);
  });

  it('doit retourner change null pour les sessions actives (realtime sans comparaison)', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Sessions actives');
    expect(metric!.change).toBeNull();
  });

  // ─── État skeleton avant chargement ───────────────────────────────────────

  it('doit retourner "—" pour toutes les valeurs avant chargement', () => {
    analyticsService.getOverview.and.returnValue(new Subject<OverviewResponse>());
    analyticsService.getRealtime.and.returnValue(new Subject<RealtimeResponse>());

    fixture.detectChanges();

    const metrics = component.analyticsMetrics();
    metrics.forEach(m => {
      expect(m.value).withContext(`La métrique "${m.title}" devrait afficher "—" avant chargement`).toBe('—');
    });
  });

  // ─── Gestion des erreurs ───────────────────────────────────────────────────

  it('doit passer analyticsUnavailable à true sur erreur 503', () => {
    const error503 = { status: 503, message: 'Service Unavailable' };
    analyticsService.getOverview.and.returnValue(throwError(() => error503));
    analyticsService.getRealtime.and.returnValue(throwError(() => error503));

    fixture.detectChanges();

    expect(component.analyticsUnavailable()).toBeTrue();
    expect(component.analyticsLoading()).toBeFalse();
  });

  it('doit laisser analyticsUnavailable à false sur une erreur non-503', () => {
    const error500 = { status: 500, message: 'Internal Server Error' };
    analyticsService.getOverview.and.returnValue(throwError(() => error500));
    analyticsService.getRealtime.and.returnValue(throwError(() => error500));

    fixture.detectChanges();

    expect(component.analyticsUnavailable()).toBeFalse();
    expect(component.analyticsLoading()).toBeFalse();
  });

  it('doit passer analyticsLoading à false même en cas d\'erreur', () => {
    analyticsService.getOverview.and.returnValue(throwError(() => ({ status: 503 })));
    analyticsService.getRealtime.and.returnValue(throwError(() => ({ status: 503 })));

    fixture.detectChanges();

    expect(component.analyticsLoading()).toBeFalse();
  });

  // ─── Helpers (format) via comportement observable ─────────────────────────

  it('doit formater 0 seconde en "0m 00s"', () => {
    analyticsService.getOverview.and.returnValue(of({
      ...mockOverview,
      metrics: { ...mockOverview.metrics, avgSessionDuration: { value: 0, previous: 0, changePercent: 0 } }
    }));
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric!.value).toBe('0m 00s');
  });

  it('doit formater 3600 secondes en "60m 00s"', () => {
    analyticsService.getOverview.and.returnValue(of({
      ...mockOverview,
      metrics: { ...mockOverview.metrics, avgSessionDuration: { value: 3600, previous: 0, changePercent: 0 } }
    }));
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric!.value).toBe('60m 00s');
  });

  it('doit formater 65 secondes en "1m 05s"', () => {
    analyticsService.getOverview.and.returnValue(of({
      ...mockOverview,
      metrics: { ...mockOverview.metrics, avgSessionDuration: { value: 65, previous: 60, changePercent: 8.3 } }
    }));
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric!.value).toBe('1m 05s');
  });

  // ─── Template (DOM) ────────────────────────────────────────────────────────

  it('doit afficher la grille de métriques quand GA est configuré', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.analytics-grid')).not.toBeNull();
    expect(el.querySelector('.analytics-unconfigured')).toBeNull();
  });

  it('doit masquer la grille et afficher "Non configuré" sur erreur 503', () => {
    analyticsService.getOverview.and.returnValue(throwError(() => ({ status: 503 })));
    analyticsService.getRealtime.and.returnValue(throwError(() => ({ status: 503 })));

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.analytics-grid')).toBeNull();
    expect(el.querySelector('.analytics-unconfigured')).not.toBeNull();
  });

  it('doit afficher le lien "Voir les analytics détaillés" quand GA est configuré', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector<HTMLAnchorElement>('.analytics-link');
    expect(link).not.toBeNull();
    expect(link!.textContent).toContain('Voir les analytics détaillés');
  });

  it('doit afficher le badge "Non configuré" sur erreur 503', () => {
    analyticsService.getOverview.and.returnValue(throwError(() => ({ status: 503 })));
    analyticsService.getRealtime.and.returnValue(throwError(() => ({ status: 503 })));

    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const badge = el.querySelector('.badge--unavailable');
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toContain('Non configuré');
  });

  it('doit afficher 6 cartes métriques dans la grille', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('.metric-card');
    expect(cards).toHaveSize(6);
  });
});
