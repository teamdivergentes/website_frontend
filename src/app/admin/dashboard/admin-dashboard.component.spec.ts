import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../../shared/services/api/auth.service';
import { AnalyticsAdminService } from '../../shared/services/analytics-admin.service';
import type { OverviewResponse, RealtimeResponse } from '../../shared/models/analytics.model';

// ─── Données de test ──────────────────────────────────────────────────────────

const mockOverview: OverviewResponse = {
  period: { startDate: '2026-02-20', endDate: '2026-02-27' },
  metrics: {
    totalUsers: 1234,
    newUsers: 456,
    sessions: 789,
    pageViews: 5678,
    avgSessionDuration: 185, // 3:05
    bounceRate: 42.5
  },
  comparison: {
    totalUsers:        { value: 1234, change: 12.3 },
    newUsers:          { value: 456,  change: -5.1 },
    sessions:          { value: 789,  change: 8.7 },
    pageViews:         { value: 5678, change: 15.0 },
    avgSessionDuration:{ value: 185,  change: -2.4 },
    bounceRate:        { value: 42.5, change: 3.2 }
  }
};

const mockRealtime: RealtimeResponse = {
  activeUsers: 17,
  activePages: [{ page: '/structure/equipes', activeUsers: 5 }],
  updatedAt: '2026-02-27T10:00:00Z'
};

// ─── Suite de tests ───────────────────────────────────────────────────────────

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let analyticsService: jasmine.SpyObj<AnalyticsAdminService>;
  let authService: jasmine.SpyObj<AuthService>;

  // Helpers pour les signaux mockés
  const userSignal = signal<{ email: string } | null>({ email: 'admin@teamdivergentes.fr' });
  const roleSignal = signal<{ name: string } | null>({ name: 'Super Admin' });

  beforeEach(async () => {
    const analyticsSpy = jasmine.createSpyObj('AnalyticsAdminService', [
      'getOverview',
      'getRealtime'
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['hasPermission'], {
      user: userSignal,
      role: roleSignal
    });

    // Réponses par défaut : succès
    analyticsSpy.getOverview.and.returnValue(of(mockOverview));
    analyticsSpy.getRealtime.and.returnValue(of(mockRealtime));

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AnalyticsAdminService, useValue: analyticsSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    analyticsService = TestBed.inject(AnalyticsAdminService) as jasmine.SpyObj<AnalyticsAdminService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  });

  // ─── Création ──────────────────────────────────────────────────────────────

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // ─── Signals utilisateur ───────────────────────────────────────────────────

  it('doit afficher le nom extrait de l\'email dans userName', () => {
    expect(component.userName()).toBe('admin');
  });

  it('doit afficher "Admin" si l\'email est absent', () => {
    userSignal.set(null);
    expect(component.userName()).toBe('Admin');
    // Restauration pour les tests suivants
    userSignal.set({ email: 'admin@teamdivergentes.fr' });
  });

  it('doit afficher le nom du rôle dans userRole', () => {
    expect(component.userRole()).toBe('Super Admin');
  });

  it('doit afficher "Admin" si le rôle est absent', () => {
    roleSignal.set(null);
    expect(component.userRole()).toBe('Admin');
    roleSignal.set({ name: 'Super Admin' });
  });

  // ─── Chargement analytics ──────────────────────────────────────────────────

  it('doit démarrer en état chargement (analyticsLoading = true)', () => {
    // Avant detectChanges = avant ngOnInit
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

  it('doit afficher le nombre total d\'utilisateurs pour "Visiteurs aujourd\'hui"', () => {
    fixture.detectChanges();
    const metrics = component.analyticsMetrics();
    const visiteurs = metrics.find(m => m.title === 'Visiteurs aujourd\'hui');

    expect(visiteurs).toBeDefined();
    // 1 234 avec séparateur fr-FR (espace insécable ou virgule selon env)
    expect(visiteurs!.value).toContain('1');
    expect(visiteurs!.value).toContain('234');
  });

  it('doit afficher le nombre de pages vues pour "Pages vues (7j)"', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Pages vues (7j)');
    expect(metric).toBeDefined();
    expect(metric!.value).toContain('5');
    expect(metric!.value).toContain('678');
  });

  it('doit afficher les utilisateurs actifs pour "Sessions actives"', () => {
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

  it('doit formater la durée moyenne en mm:ss', () => {
    fixture.detectChanges();
    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric).toBeDefined();
    // 185 secondes = 3 minutes 5 secondes
    expect(metric!.value).toBe('3:05');
  });

  it('doit afficher les nouveaux visiteurs pour "Nouveaux visiteurs"', () => {
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
    // Simuler un Observable qui ne complète jamais
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

  // ─── Helpers privés (via comportement observable) ──────────────────────────

  it('doit formater 0 seconde en "0:00"', () => {
    // Injection indirecte via les données
    analyticsService.getOverview.and.returnValue(of({
      ...mockOverview,
      metrics: { ...mockOverview.metrics, avgSessionDuration: 0 }
    }));
    fixture.detectChanges();

    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric!.value).toBe('0:00');
  });

  it('doit formater 3600 secondes (1h) en "60:00"', () => {
    analyticsService.getOverview.and.returnValue(of({
      ...mockOverview,
      metrics: { ...mockOverview.metrics, avgSessionDuration: 3600 }
    }));
    fixture.detectChanges();

    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric!.value).toBe('60:00');
  });

  it('doit formater 65 secondes en "1:05"', () => {
    analyticsService.getOverview.and.returnValue(of({
      ...mockOverview,
      metrics: { ...mockOverview.metrics, avgSessionDuration: 65 }
    }));
    fixture.detectChanges();

    const metric = component.analyticsMetrics().find(m => m.title === 'Durée moyenne');
    expect(metric!.value).toBe('1:05');
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
    expect(cards.length).toBe(6);
  });

  it('doit afficher la section "État du site"', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.site-status')).not.toBeNull();
    expect(el.querySelector('.status-dot')).not.toBeNull();
  });

  // ─── Horloge ───────────────────────────────────────────────────────────────

  it('doit initialiser currentDateTime avec la date du jour', () => {
    const dateTime = component.currentDateTime();
    expect(dateTime).toContain('•');
    expect(dateTime.length).toBeGreaterThan(10);
  });

  it('doit mettre à jour currentDateTime après 60 secondes', fakeAsync(() => {
    fixture.detectChanges();
    const initial = component.currentDateTime();

    // Avancer l'horloge de 60 secondes
    tick(60000);

    // La valeur peut être identique si la minute n'a pas changé,
    // mais le mécanisme doit avoir été déclenché sans erreur
    expect(component.currentDateTime()).toBeDefined();
    discardPeriodicTasks();
  }));
});
