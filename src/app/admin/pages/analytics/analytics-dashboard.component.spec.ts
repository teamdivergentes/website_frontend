import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import { AnalyticsAdminService } from '../../../shared/services';
import { of, throwError } from 'rxjs';
import { OverviewResponse, VisitorsResponse, TopPagesResponse, TrafficSourcesResponse, GeoResponse, DevicesResponse } from '../../../shared/models';

const makeMockOverview = (): OverviewResponse => ({
  period: { startDate: '2026-02-01', endDate: '2026-02-28' },
  metrics: { totalUsers: 1000, newUsers: 300, sessions: 1500, pageViews: 4000, avgSessionDuration: 120, bounceRate: 42 },
  comparison: {
    totalUsers: { value: 900, change: 11.1 },
    newUsers: { value: 280, change: 7.1 },
    sessions: { value: 1400, change: 7.1 },
    pageViews: { value: 3500, change: 14.3 },
    avgSessionDuration: { value: 110, change: 9.1 },
    bounceRate: { value: 44, change: -4.5 }
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

    // Valeurs par défaut pour les appels forkJoin
    spy.getOverview.and.returnValue(of(makeMockOverview()));
    spy.getVisitors.and.returnValue(of({ period: { startDate: '', endDate: '' }, data: [] } as VisitorsResponse));
    spy.getTopPages.and.returnValue(of({ period: { startDate: '', endDate: '' }, pages: [] } as TopPagesResponse));
    spy.getTrafficSources.and.returnValue(of({ period: { startDate: '', endDate: '' }, channels: [], sources: [] } as TrafficSourcesResponse));
    spy.getGeography.and.returnValue(of({ period: { startDate: '', endDate: '' }, countries: [] } as GeoResponse));
    spy.getDevices.and.returnValue(of({ period: { startDate: '', endDate: '' }, devices: [], browsers: [] } as DevicesResponse));
    spy.getRealtime.and.returnValue(of({ activeUsers: 0, activePages: [], updatedAt: '' }));

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
    expect(component.overview()!.metrics.totalUsers).toBe(1000);
    expect(component.hasData()).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(component.errorType()).toBe('none');
  });

  it('doit exposer correctement les KPI depuis les signals computed', () => {
    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    expect(component.kpiTotalUsers()).toBe(1000);
    expect(component.kpiSessions()).toBe(1500);
    expect(component.kpiBounceRate()).toBe(42);
    expect(component.kpiChangeTotalUsers()).toBe(11.1);
  });

  it('doit passer en errorType=not_configured si l\'API retourne 503', () => {
    analyticsServiceSpy.getOverview.and.returnValue(throwError(() => ({ status: 503 })));

    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    expect(component.errorType()).toBe('not_configured');
    expect(component.isNotConfigured()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });

  it('doit passer en errorType=generic si l\'API retourne une autre erreur', () => {
    analyticsServiceSpy.getOverview.and.returnValue(throwError(() => ({ status: 500 })));

    fixture.detectChanges();
    component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
    fixture.detectChanges();

    expect(component.errorType()).toBe('generic');
    expect(component.hasGenericError()).toBeTrue();
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
