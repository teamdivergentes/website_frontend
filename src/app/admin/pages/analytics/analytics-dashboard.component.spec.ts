import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import { AnalyticsAdminService } from '../../../shared/services';
import { of, throwError } from 'rxjs';
import { OverviewResponse, VisitorsResponse, TopPagesResponse, TrafficSourcesResponse, GeoResponse, DevicesResponse } from '../../../shared/models';

// FIX ALPHA-001 : mock aligné sur la structure backend (MetricWithComparison)
const makeMockOverview = (): OverviewResponse => ({
  period: { startDate: '2026-02-01', endDate: '2026-02-28' },
  previousPeriod: { startDate: '2026-01-01', endDate: '2026-01-31' },
  metrics: {
    totalUsers:         { value: 1000, previous: 900,  changePercent: 11.1 },
    newUsers:           { value: 300,  previous: 280,  changePercent: 7.1 },
    sessions:           { value: 1500, previous: 1400, changePercent: 7.1 },
    pageViews:          { value: 4000, previous: 3500, changePercent: 14.3 },
    avgSessionDuration: { value: 120,  previous: 110,  changePercent: 9.1 },
    bounceRate:         { value: 42,   previous: 44,   changePercent: -4.5 }
  }
});

describe('AnalyticsDashboardComponent', () => {
  let fixture: ComponentFixture<AnalyticsDashboardComponent>;
  let component: AnalyticsDashboardComponent;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsAdminService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj<AnalyticsAdminService>('AnalyticsAdminService', [
      'getOverview', 'getVisitors', 'getTopPages', 'getTrafficSources', 'getGeography', 'getDevices', 'getRealtime'
    ]);

    // Valeurs par défaut pour les appels forkJoin (FIX ALPHA-001 : nouveaux noms de champs)
    spy.getOverview.and.returnValue(of(makeMockOverview()));
    spy.getVisitors.and.returnValue(of({ period: { startDate: '', endDate: '' }, data: [] } as VisitorsResponse));
    spy.getTopPages.and.returnValue(of({ period: { startDate: '', endDate: '' }, data: [] } as TopPagesResponse));
    spy.getTrafficSources.and.returnValue(of({ period: { startDate: '', endDate: '' }, data: [], byChannel: [] } as TrafficSourcesResponse));
    spy.getGeography.and.returnValue(of({ period: { startDate: '', endDate: '' }, byCountry: [], byCity: [] } as GeoResponse));
    spy.getDevices.and.returnValue(of({ period: { startDate: '', endDate: '' }, byCategory: [], byBrowser: [] } as DevicesResponse));
    spy.getRealtime.and.returnValue(of({ activeUsers: 0, byPage: [], byCountry: [], byDevice: [], updatedAt: '' }));

    await TestBed.configureTestingModule({
      imports: [AnalyticsDashboardComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AnalyticsAdminService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalyticsDashboardComponent);
    component = fixture.componentInstance;
    analyticsServiceSpy = TestBed.inject(AnalyticsAdminService) as jasmine.SpyObj<AnalyticsAdminService>;
  });

  it('devrait être créé', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('doit être en état loading=false et errorType=none au départ', () => {
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
    expect(component.errorType()).toBe('none');
    expect(component.hasData()).toBeFalse();
  });

  it('doit charger les données et les placer dans les signals correspondants', () => {
    fixture.detectChanges();

    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    expect(component.overview()).toBeTruthy();
    // FIX ALPHA-001 : totalUsers est maintenant un MetricWithComparison
    expect(component.overview()!.metrics.totalUsers.value).toBe(1000);
    expect(component.hasData()).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(component.errorType()).toBe('none');
  });

  it('doit exposer correctement les KPI depuis les signals computed', () => {
    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    // FIX ALPHA-001 : les accessors KPI lisent .value et .changePercent
    expect(component.kpiTotalUsers()).toBe(1000);
    expect(component.kpiSessions()).toBe(1500);
    expect(component.kpiBounceRate()).toBe(42);
    expect(component.kpiChangeTotalUsers()).toBe(11.1);
  });

  it('doit passer en errorType=not_configured si l\'API overview retourne 503', () => {
    // FIX ALPHA-003 : l'erreur est catchée dans le pipe, pas au niveau forkJoin global
    analyticsServiceSpy.getOverview.and.returnValue(throwError(() => ({ status: 503 })));

    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    expect(component.errorType()).toBe('not_configured');
    expect(component.isNotConfigured()).toBeTrue();
    expect(component.loading()).toBeFalse();
    // overview est null car l'endpoint a échoué
    expect(component.overview()).toBeNull();
  });

  it('doit passer en errorType=generic si l\'API overview retourne une autre erreur', () => {
    analyticsServiceSpy.getOverview.and.returnValue(throwError(() => ({ status: 500 })));

    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    expect(component.errorType()).toBe('generic');
    expect(component.hasGenericError()).toBeTrue();
  });

  it('doit afficher les données partielles si un seul endpoint échoue (résilience)', () => {
    // FIX ALPHA-003 : les autres endpoints réussissent même si visitors échoue
    analyticsServiceSpy.getVisitors.and.returnValue(throwError(() => ({ status: 500 })));

    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    // overview est chargé normalement
    expect(component.overview()).toBeTruthy();
    // visitors est null car son endpoint a échoué
    expect(component.visitors()).toBeNull();
    expect(component.loading()).toBeFalse();
    // errorType reste 'none' : overview a réussi
    expect(component.errorType()).toBe('none');
  });

  it('doit recharger les données au retry()', () => {
    analyticsServiceSpy.getOverview.and.returnValue(throwError(() => ({ status: 500 })));

    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    // Après erreur, remettre le spy en mode succès
    analyticsServiceSpy.getOverview.and.returnValue(of(makeMockOverview()));
    component.retry();
    fixture.detectChanges();

    expect(component.errorType()).toBe('none');
    expect(component.hasData()).toBeTrue();
  });

  it('retry() ne doit rien faire si currentRange est null', () => {
    fixture.detectChanges();
    component.retry(); // pas de range sélectionné
    fixture.detectChanges();

    // Aucun appel API
    expect(analyticsServiceSpy.getOverview).not.toHaveBeenCalled();
  });
});
