import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { provideZonelessChangeDetection, signal } from '@angular/core';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../../shared/services/api/auth.service';
import { AnalyticsAdminService } from '../../shared/services/analytics-admin.service';
import type { OverviewResponse, RealtimeResponse } from '../../shared/models/analytics.model';

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

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

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

    analyticsSpy.getOverview.and.returnValue(of(mockOverview));
    analyticsSpy.getRealtime.and.returnValue(of(mockRealtime));

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AnalyticsAdminService, useValue: analyticsSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit afficher le nom extrait de l\'email dans userName', () => {
    expect(component.userName()).toBe('admin');
  });

  it('doit afficher "Admin" si l\'email est absent', () => {
    userSignal.set(null);
    expect(component.userName()).toBe('Admin');
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

  it('doit rendre le sous-composant app-dashboard-stats', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dashboard-stats')).not.toBeNull();
  });

  it('doit rendre le sous-composant app-dashboard-traffic', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dashboard-traffic')).not.toBeNull();
  });

  it('doit rendre le sous-composant app-dashboard-recent', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-dashboard-recent')).not.toBeNull();
  });

  it('doit afficher le titre "Dashboard" dans le header', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const h1 = el.querySelector('h1');
    expect(h1?.textContent?.trim()).toBe('Dashboard');
  });
});
