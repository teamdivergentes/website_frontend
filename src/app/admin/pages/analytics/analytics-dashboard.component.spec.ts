import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AnalyticsDashboardComponent } from './analytics-dashboard.component';
import { AnalyticsAdminService } from '../../../shared/services';
import { of, throwError, Subject } from 'rxjs';
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

const makeEmptyOverview = (): OverviewResponse => ({
  period: { startDate: '2099-01-01', endDate: '2099-01-01' },
  previousPeriod: { startDate: '2099-01-01', endDate: '2099-01-01' },
  metrics: {
    totalUsers:         { value: 0, previous: 0, changePercent: 0 },
    newUsers:           { value: 0, previous: 0, changePercent: 0 },
    sessions:           { value: 0, previous: 0, changePercent: 0 },
    pageViews:          { value: 0, previous: 0, changePercent: 0 },
    avgSessionDuration: { value: 0, previous: 0, changePercent: 0 },
    bounceRate:         { value: 0, previous: 0, changePercent: 0 }
  }
});

describe('AnalyticsDashboardComponent', () => {
  let fixture: ComponentFixture<AnalyticsDashboardComponent>;
  let component: AnalyticsDashboardComponent;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsAdminService>;

  beforeEach(async () => {
    // Réinitialiser localStorage avant chaque test
    localStorage.removeItem('dvg_admin_analytics_consent_banner_dismissed');

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

  afterEach(() => {
    localStorage.removeItem('dvg_admin_analytics_consent_banner_dismissed');
  });

  it('devrait être créé', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ─── US 1 : Chargement automatique de la période par défaut ──────────────────

  describe('US1 — chargement automatique de la période par défaut (7 jours)', () => {
    it('doit déclencher un appel API au montage sans interaction utilisateur', () => {
      fixture.detectChanges(); // ngOnInit

      expect(analyticsServiceSpy.getOverview).toHaveBeenCalledTimes(1);
    });

    it('doit appeler getOverview avec une plage commençant J-6 par rapport à aujourd\'hui', () => {
      fixture.detectChanges();

      const today = new Date();
      const expectedEnd = formatDate(today);
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      const expectedStart = formatDate(start);

      const [startDate, endDate] = analyticsServiceSpy.getOverview.calls.mostRecent().args;
      expect(startDate).toBe(expectedStart);
      expect(endDate).toBe(expectedEnd);
    });

    it('doit initialiser currentRange avec la plage 7 jours', () => {
      fixture.detectChanges();

      const range = component.currentRange();
      expect(range).not.toBeNull();
      expect(range!.endDate).toBe(formatDate(new Date()));
    });

    it('doit afficher le skeleton pendant le chargement initial (loading=true)', () => {
      // Spy qui ne complète jamais (simule un appel en cours)
      const neverComplete$ = new Subject<OverviewResponse>();
      analyticsServiceSpy.getOverview.and.returnValue(neverComplete$.asObservable());

      // detectChanges déclenche ngOnInit → le loadTrigger$ est émis → loading passe à true
      fixture.detectChanges();

      expect(component.loading()).toBeTrue();
    });

    it('doit passer loading=false et afficher les données après le chargement initial', () => {
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.hasData()).toBeTrue();
    });

    it('ne doit pas émettre un double appel API au montage', () => {
      fixture.detectChanges();

      // Un seul appel doit être fait : celui de ngOnInit
      expect(analyticsServiceSpy.getOverview).toHaveBeenCalledTimes(1);
    });

    it('doit conserver le préset "7days" visible dans le date-range-picker', () => {
      fixture.detectChanges();

      // Le DateRangePicker est un composant enfant — on vérifie via currentRange
      // que la plage par défaut est bien initialisée, et que l'endDate correspond à aujourd'hui
      expect(component.currentRange()).not.toBeNull();
      expect(component.currentRange()!.endDate).toBe(formatDate(new Date()));
    });
  });

  // ─── État initial des data signals (tests de non-régression) ─────────────────

  describe('état initial des data signals avant montage', () => {
    it('loading() est false avant tout chargement', () => {
      expect(component.loading()).toBeFalse();
    });

    it('errorType() est "none" avant tout chargement', () => {
      expect(component.errorType()).toBe('none');
    });

    it('overview est null avant tout chargement', () => {
      expect(component.overview()).toBeNull();
    });

    it('visitors est null avant tout chargement', () => {
      expect(component.visitors()).toBeNull();
    });

    it('topPages est null avant tout chargement', () => {
      expect(component.topPages()).toBeNull();
    });

    it('trafficSources est null avant tout chargement', () => {
      expect(component.trafficSources()).toBeNull();
    });

    it('geography est null avant tout chargement', () => {
      expect(component.geography()).toBeNull();
    });

    it('devices est null avant tout chargement', () => {
      expect(component.devices()).toBeNull();
    });
  });

  it('doit charger les données et les placer dans les signals correspondants', () => {
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
    // S'assurer que ngOnInit n'est pas encore appelé (currentRange est null)
    // Le beforeEach ne fait pas detectChanges, donc ngOnInit n'est pas déclenché
    expect(component.currentRange()).toBeNull();

    const callsBefore = analyticsServiceSpy.getOverview.calls.count();
    component.retry();

    // Aucun appel API ne doit être fait car currentRange est null
    expect(analyticsServiceSpy.getOverview.calls.count()).toBe(callsBefore);

    // Maintenant on déclenche ngOnInit via detectChanges
    fixture.detectChanges();
    // Après detectChanges, ngOnInit est appelé → 1 appel API
    expect(analyticsServiceSpy.getOverview.calls.count()).toBe(callsBefore + 1);
  });

  // ─── US 2 : Placeholder pour métriques vides ─────────────────────────────────

  describe('US2 — placeholder pour métriques vides (0 visiteurs / 0 pages vues)', () => {
    it('hasEmptyData() doit être true si overview retourne toutes les métriques à 0', () => {
      analyticsServiceSpy.getOverview.and.returnValue(of(makeEmptyOverview()));
      fixture.detectChanges();

      expect(component.hasEmptyData()).toBeTrue();
    });

    it('hasEmptyData() doit être false si overview a au moins un utilisateur', () => {
      fixture.detectChanges();

      expect(component.hasEmptyData()).toBeFalse();
    });

    it('hasEmptyData() doit être false si overview est null (pas encore chargé)', () => {
      // Avant ngOnInit
      expect(component.hasEmptyData()).toBeFalse();
    });

    it('doit afficher .empty-data-state dans le DOM si hasEmptyData() est true et loading=false', () => {
      analyticsServiceSpy.getOverview.and.returnValue(of(makeEmptyOverview()));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.empty-data-state')).toBeTruthy();
    });

    it('ne doit pas afficher .empty-data-state si loading est true', () => {
      // Simuler un chargement en cours
      component['loading'].set(true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.empty-data-state')).toBeNull();
    });

    it('le placeholder vide doit contenir le texte "Aucune donnée"', () => {
      analyticsServiceSpy.getOverview.and.returnValue(of(makeEmptyOverview()));
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const placeholder = el.querySelector('.empty-data-state');
      expect(placeholder?.textContent).toContain('Aucune donnée');
    });
  });

  // ─── US 3 : Bandeau consent ──────────────────────────────────────────────────

  describe('US3 — bandeau d\'information consent cookie', () => {
    beforeEach(() => {
      localStorage.removeItem('dvg_admin_analytics_consent_banner_dismissed');
    });

    it('consentBannerVisible() doit être true par défaut (localStorage vide)', () => {
      fixture.detectChanges();
      expect(component.consentBannerVisible()).toBeTrue();
    });

    it('consentBannerVisible() doit être false si localStorage contient la clé dismissed', () => {
      localStorage.setItem('dvg_admin_analytics_consent_banner_dismissed', 'true');
      fixture.detectChanges();

      expect(component.consentBannerVisible()).toBeFalse();
    });

    it('dismissConsentBanner() doit passer consentBannerVisible() à false', () => {
      fixture.detectChanges();
      component.dismissConsentBanner();

      expect(component.consentBannerVisible()).toBeFalse();
    });

    it('dismissConsentBanner() doit persister la valeur dans localStorage', () => {
      fixture.detectChanges();
      component.dismissConsentBanner();

      expect(localStorage.getItem('dvg_admin_analytics_consent_banner_dismissed')).toBe('true');
    });

    it('resetConsentBanner() doit remettre consentBannerVisible() à true', () => {
      localStorage.setItem('dvg_admin_analytics_consent_banner_dismissed', 'true');
      fixture.detectChanges();

      component.resetConsentBanner();

      expect(component.consentBannerVisible()).toBeTrue();
    });

    it('resetConsentBanner() doit supprimer la clé localStorage', () => {
      localStorage.setItem('dvg_admin_analytics_consent_banner_dismissed', 'true');
      fixture.detectChanges();

      component.resetConsentBanner();

      expect(localStorage.getItem('dvg_admin_analytics_consent_banner_dismissed')).toBeNull();
    });

    it('doit afficher .consent-banner dans le DOM si consentBannerVisible() est true', () => {
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.consent-banner')).toBeTruthy();
    });

    it('ne doit pas afficher .consent-banner si dismissé', () => {
      localStorage.setItem('dvg_admin_analytics_consent_banner_dismissed', 'true');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.consent-banner')).toBeNull();
    });

    it('le bandeau doit contenir un message sur les cookies consent', () => {
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const banner = el.querySelector('.consent-banner');
      expect(banner?.textContent).toContain('cookies');
    });

    it('le bandeau doit contenir un bouton de fermeture', () => {
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const closeBtn = el.querySelector('.consent-banner .consent-banner-close');
      expect(closeBtn).toBeTruthy();
    });

    it('cliquer sur le bouton de fermeture doit dismisser le bandeau', () => {
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const closeBtn = el.querySelector('.consent-banner .consent-banner-close') as HTMLElement;
      closeBtn?.click();
      fixture.detectChanges();

      expect(component.consentBannerVisible()).toBeFalse();
      expect(el.querySelector('.consent-banner')).toBeNull();
    });

    it('le bandeau doit être non-bloquant (les métriques restent visibles)', () => {
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      // Le bandeau ET la grille KPI doivent coexister
      expect(el.querySelector('.consent-banner')).toBeTruthy();
      expect(el.querySelector('.kpi-grid')).toBeTruthy();
    });
  });

  // ─── Rendu DOM (non-régression) ───────────────────────────────────────────────

  describe('rendu DOM', () => {
    it('doit afficher .kpi-grid dans le DOM après chargement des données', () => {
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.kpi-grid')).toBeTruthy();
    });

    it('doit afficher .not-configured-state après une erreur 503 sur overview', () => {
      analyticsServiceSpy.getOverview.and.returnValue(throwError(() => ({ status: 503 })));

      fixture.detectChanges();
      component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.not-configured-state')).toBeTruthy();
    });

    it('doit afficher .error-state après une erreur 500 sur overview', () => {
      analyticsServiceSpy.getOverview.and.returnValue(throwError(() => ({ status: 500 })));

      fixture.detectChanges();
      component.onRangeChange({ startDate: '2026-02-01', endDate: '2026-02-28' });
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.error-state')).toBeTruthy();
    });
  });
});

// ─── Helpers locaux ───────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
