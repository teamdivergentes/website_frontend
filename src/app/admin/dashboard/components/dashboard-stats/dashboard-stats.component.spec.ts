import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { computed, provideZonelessChangeDetection } from '@angular/core';
import { DashboardStatsComponent } from './dashboard-stats.component';
import { AdminShortcutsService } from '../../../../../shared/services/admin-shortcuts.service';
import { AdminShortcut } from '../../../../../shared/config/admin-shortcuts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeShortcutsMock(shortcuts: AdminShortcut[]) {
  // Exclut le dashboard (comme le fait le composant) pour que les tests
  // reflètent le comportement réel (quickLinks filtre key !== 'dashboard').
  const available = computed(() => shortcuts);
  return {
    availableShortcuts: available,
  } as Pick<AdminShortcutsService, 'availableShortcuts'>;
}

const ALL_SHORTCUTS: AdminShortcut[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/admin', requiredPermissions: [] },
  { key: 'users', label: 'Utilisateurs', icon: 'group', route: '/admin/users', requiredPermissions: ['users:read'], section: 'people' },
  { key: 'teams', label: 'Equipes', icon: 'sports_esports', route: '/admin/teams', requiredPermissions: ['teams:read'], section: 'content' },
  { key: 'sponsors', label: 'Sponsors', icon: 'handshake', route: '/admin/sponsors', requiredPermissions: ['sponsors:read'], section: 'content' },
  { key: 'staff', label: 'Staff', icon: 'badge', route: '/admin/staff', requiredPermissions: ['staff:read'], section: 'people' },
  { key: 'recruitment', label: 'Recrutement', icon: 'campaign', route: '/admin/recruitment', requiredPermissions: ['recrutement:read'], section: 'content' },
  { key: 'config', label: 'Configuration', icon: 'settings', route: '/admin/config', requiredPermissions: ['config:read'], section: 'config' },
  { key: 'twitch-channels', label: 'Twitch', icon: 'live_tv', route: '/admin/twitch-channels', requiredPermissions: ['twitch_channels:read'], section: 'tools' },
];

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('DashboardStatsComponent', () => {
  let component: DashboardStatsComponent;
  let fixture: ComponentFixture<DashboardStatsComponent>;

  // ─── Cas : 0 raccourcis (hors dashboard) ─────────────────────────────────

  describe('utilisateur sans raccourcis supplémentaires (seulement dashboard)', () => {
    beforeEach(async () => {
      const mock = makeShortcutsMock([
        { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/admin', requiredPermissions: [] }
      ]);

      await TestBed.configureTestingModule({
        imports: [DashboardStatsComponent, NoopAnimationsModule],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: AdminShortcutsService, useValue: mock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardStatsComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('userName', 'admin');
      fixture.componentRef.setInput('userRole', 'Viewer');
      fixture.detectChanges();
    });

    it('doit créer le composant', () => {
      expect(component).toBeTruthy();
    });

    it('quickLinks() est vide (dashboard exclu)', () => {
      expect(component.quickLinks().length).toBe(0);
    });

    it('doit afficher 0 quick-link dans le DOM', () => {
      const links = fixture.nativeElement.querySelectorAll('.quick-link');
      expect(links.length).toBe(0);
    });
  });

  // ─── Cas : 1 raccourci ────────────────────────────────────────────────────

  describe('utilisateur avec 1 raccourci (users)', () => {
    beforeEach(async () => {
      const mock = makeShortcutsMock([
        { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/admin', requiredPermissions: [] },
        { key: 'users', label: 'Utilisateurs', icon: 'group', route: '/admin/users', requiredPermissions: ['users:read'], section: 'people' },
      ]);

      await TestBed.configureTestingModule({
        imports: [DashboardStatsComponent, NoopAnimationsModule],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: AdminShortcutsService, useValue: mock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardStatsComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('userName', 'maxime');
      fixture.componentRef.setInput('userRole', 'Gestionnaire');
      fixture.detectChanges();
    });

    it('doit afficher 1 quick-link', () => {
      const links = fixture.nativeElement.querySelectorAll('.quick-link');
      expect(links.length).toBe(1);
    });

    it('le lien pointe vers /admin/users', () => {
      const link = fixture.nativeElement.querySelector('.quick-link') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe('/admin/users');
    });

    it('doit avoir le data-testid "dashboard-stat-users"', () => {
      const link = fixture.nativeElement.querySelector('[data-testid="dashboard-stat-users"]');
      expect(link).not.toBeNull();
    });

    it('doit afficher le label "Utilisateurs"', () => {
      expect(fixture.nativeElement.textContent).toContain('Utilisateurs');
    });
  });

  // ─── Cas : N raccourcis (admin complet) ──────────────────────────────────

  describe('administrateur total (tous les raccourcis)', () => {
    beforeEach(async () => {
      const mock = makeShortcutsMock(ALL_SHORTCUTS);

      await TestBed.configureTestingModule({
        imports: [DashboardStatsComponent, NoopAnimationsModule],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          { provide: AdminShortcutsService, useValue: mock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(DashboardStatsComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('userName', 'admin');
      fixture.componentRef.setInput('userRole', 'Super Admin');
      fixture.detectChanges();
    });

    it('doit créer le composant', () => {
      expect(component).toBeTruthy();
    });

    it('doit afficher autant de quick-links que ADMIN_SHORTCUTS sans dashboard', () => {
      const expected = ALL_SHORTCUTS.filter(s => s.key !== 'dashboard').length;
      const links = fixture.nativeElement.querySelectorAll('.quick-link');
      expect(links.length).toBe(expected);
    });

    it('doit afficher le lien vers /admin/teams', () => {
      const link = fixture.nativeElement.querySelector('[data-testid="dashboard-stat-teams"]');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/admin/teams');
    });

    it('doit afficher le lien vers /admin/sponsors', () => {
      const link = fixture.nativeElement.querySelector('[data-testid="dashboard-stat-sponsors"]');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/admin/sponsors');
    });

    it('doit afficher le lien vers /admin/staff', () => {
      const link = fixture.nativeElement.querySelector('[data-testid="dashboard-stat-staff"]');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/admin/staff');
    });

    it('doit afficher le lien vers /admin/recruitment', () => {
      const link = fixture.nativeElement.querySelector('[data-testid="dashboard-stat-recruitment"]');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/admin/recruitment');
    });

    it('doit afficher le lien vers /admin/config', () => {
      const link = fixture.nativeElement.querySelector('[data-testid="dashboard-stat-config"]');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/admin/config');
    });

    it('doit afficher le lien vers /admin/twitch-channels', () => {
      const link = fixture.nativeElement.querySelector('[data-testid="dashboard-stat-twitch-channels"]');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toBe('/admin/twitch-channels');
    });

    it('doit afficher le label "Equipes"', () => {
      expect(fixture.nativeElement.textContent).toContain('Equipes');
    });

    it('doit afficher le label "Recrutement"', () => {
      expect(fixture.nativeElement.textContent).toContain('Recrutement');
    });

    it('doit afficher le label "Configuration"', () => {
      expect(fixture.nativeElement.textContent).toContain('Configuration');
    });

    it('doit afficher le label "Twitch"', () => {
      expect(fixture.nativeElement.textContent).toContain('Twitch');
    });

    it('doit afficher le userName passé en input', () => {
      expect(fixture.nativeElement.textContent).toContain('admin');
    });

    it('doit afficher le userRole passé en input', () => {
      expect(fixture.nativeElement.textContent).toContain('Super Admin');
    });

    it('doit afficher le bon nom si userName change', () => {
      fixture.componentRef.setInput('userName', 'maxime');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('maxime');
    });
  });
});
