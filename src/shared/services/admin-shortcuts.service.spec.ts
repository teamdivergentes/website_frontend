import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { AdminShortcutsService } from './admin-shortcuts.service';
import { AuthService } from './api/auth.service';
import { ADMIN_SHORTCUTS } from '../config/admin-shortcuts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Crée un mock AuthService minimal.
 * @param authenticated - true si l'utilisateur est connecté
 * @param permissions  - liste des permissions du rôle
 */
function makeAuthMock(authenticated: boolean, permissions: string[] = []) {
  const authSig = signal(authenticated);
  const permSig = signal<string[]>(permissions);
  return {
    isAuthenticated: authSig,
    permissions: permSig,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AdminShortcutsService', () => {
  let service: AdminShortcutsService;
  let authMock: ReturnType<typeof makeAuthMock>;

  // ─── Cas : utilisateur non authentifié ──────────────────────────────────

  describe('utilisateur anonyme', () => {
    beforeEach(() => {
      authMock = makeAuthMock(false);

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          AdminShortcutsService,
          { provide: AuthService, useValue: authMock },
        ],
      });

      service = TestBed.inject(AdminShortcutsService);
    });

    it('doit être créé', () => {
      expect(service).toBeTruthy();
    });

    it('availableShortcuts() retourne un tableau vide', () => {
      expect(service.availableShortcuts()).toEqual([]);
    });

    it('canShortcut("users") retourne false', () => {
      expect(service.canShortcut('users')).toBeFalse();
    });

    it('canShortcut("dashboard") retourne false', () => {
      expect(service.canShortcut('dashboard')).toBeFalse();
    });

    it('shortcutsBySection() retourne une Map vide', () => {
      expect(service.shortcutsBySection().size).toBe(0);
    });
  });

  // ─── Cas : utilisateur authentifié sans aucune permission ───────────────

  describe('utilisateur authentifié sans permissions', () => {
    beforeEach(() => {
      authMock = makeAuthMock(true, []);

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          AdminShortcutsService,
          { provide: AuthService, useValue: authMock },
        ],
      });

      service = TestBed.inject(AdminShortcutsService);
    });

    it('availableShortcuts() contient uniquement dashboard (requiredPermissions vide)', () => {
      const shortcuts = service.availableShortcuts();
      expect(shortcuts.length).toBe(1);
      expect(shortcuts[0].key).toBe('dashboard');
    });

    it('canShortcut("dashboard") retourne true', () => {
      expect(service.canShortcut('dashboard')).toBeTrue();
    });

    it('canShortcut("users") retourne false', () => {
      expect(service.canShortcut('users')).toBeFalse();
    });
  });

  // ─── Cas : utilisateur avec users:read uniquement ───────────────────────

  describe('utilisateur avec users:read uniquement', () => {
    beforeEach(() => {
      authMock = makeAuthMock(true, ['users:read']);

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          AdminShortcutsService,
          { provide: AuthService, useValue: authMock },
        ],
      });

      service = TestBed.inject(AdminShortcutsService);
    });

    it('availableShortcuts() contient dashboard + users', () => {
      const keys = service.availableShortcuts().map(s => s.key);
      expect(keys).toContain('dashboard');
      expect(keys).toContain('users');
    });

    it('availableShortcuts() ne contient pas roles ni teams', () => {
      const keys = service.availableShortcuts().map(s => s.key);
      expect(keys).not.toContain('roles');
      expect(keys).not.toContain('teams');
    });

    it('canShortcut("users") retourne true', () => {
      expect(service.canShortcut('users')).toBeTrue();
    });

    it('canShortcut("roles") retourne false', () => {
      expect(service.canShortcut('roles')).toBeFalse();
    });
  });

  // ─── Cas : administrateur total (toutes les permissions) ────────────────

  describe('administrateur total', () => {
    beforeEach(() => {
      const allPerms = ADMIN_SHORTCUTS.flatMap(s => s.requiredPermissions);
      authMock = makeAuthMock(true, allPerms);

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          AdminShortcutsService,
          { provide: AuthService, useValue: authMock },
        ],
      });

      service = TestBed.inject(AdminShortcutsService);
    });

    it('availableShortcuts() contient tous les raccourcis du registre', () => {
      expect(service.availableShortcuts().length).toBe(ADMIN_SHORTCUTS.length);
    });

    it('canShortcut("twitch-channels") retourne true', () => {
      expect(service.canShortcut('twitch-channels')).toBeTrue();
    });

    it('canShortcut("analytics") retourne true', () => {
      expect(service.canShortcut('analytics')).toBeTrue();
    });

    it('canShortcut("unknown-key") retourne false', () => {
      expect(service.canShortcut('unknown-key')).toBeFalse();
    });
  });

  // ─── Réactivité : mise à jour automatique lors d'un changement de perms ─

  describe('réactivité — changement de permissions', () => {
    beforeEach(() => {
      authMock = makeAuthMock(false, []);

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          AdminShortcutsService,
          { provide: AuthService, useValue: authMock },
        ],
      });

      service = TestBed.inject(AdminShortcutsService);
    });

    it("passe de [] à [dashboard] quand l'utilisateur se connecte", () => {
      expect(service.availableShortcuts()).toEqual([]);

      // Simuler connexion
      authMock.isAuthenticated.set(true);
      authMock.permissions.set([]);

      const keys = service.availableShortcuts().map(s => s.key);
      expect(keys).toContain('dashboard');
    });

    it("passe de [dashboard] à [] quand l'utilisateur se déconnecte", () => {
      authMock.isAuthenticated.set(true);
      authMock.permissions.set([]);
      expect(service.availableShortcuts().length).toBeGreaterThan(0);

      authMock.isAuthenticated.set(false);
      expect(service.availableShortcuts()).toEqual([]);
    });

    it("se met à jour quand les permissions s'élargissent", () => {
      authMock.isAuthenticated.set(true);
      authMock.permissions.set([]);

      expect(service.canShortcut('users')).toBeFalse();

      authMock.permissions.set(['users:read']);

      expect(service.canShortcut('users')).toBeTrue();
    });

    it("se met à jour quand les permissions se réduisent", () => {
      authMock.isAuthenticated.set(true);
      authMock.permissions.set(['users:read', 'roles:read']);

      expect(service.canShortcut('roles')).toBeTrue();

      authMock.permissions.set(['users:read']);

      expect(service.canShortcut('roles')).toBeFalse();
    });
  });

  // ─── shortcutsBySection ──────────────────────────────────────────────────

  describe('shortcutsBySection()', () => {
    beforeEach(() => {
      const allPerms = ADMIN_SHORTCUTS.flatMap(s => s.requiredPermissions);
      authMock = makeAuthMock(true, allPerms);

      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          AdminShortcutsService,
          { provide: AuthService, useValue: authMock },
        ],
      });

      service = TestBed.inject(AdminShortcutsService);
    });

    it('contient la section "content"', () => {
      const map = service.shortcutsBySection();
      expect(map.has('content')).toBeTrue();
    });

    it('contient la section "people"', () => {
      expect(service.shortcutsBySection().has('people')).toBeTrue();
    });

    it('contient la section "config"', () => {
      expect(service.shortcutsBySection().has('config')).toBeTrue();
    });

    it('contient la section "analytics"', () => {
      expect(service.shortcutsBySection().has('analytics')).toBeTrue();
    });

    it('contient la section "tools"', () => {
      expect(service.shortcutsBySection().has('tools')).toBeTrue();
    });

    it('le raccourci "teams" est dans la section "content"', () => {
      const content = service.shortcutsBySection().get('content') ?? [];
      expect(content.some(s => s.key === 'teams')).toBeTrue();
    });

    it('le raccourci "users" est dans la section "people"', () => {
      const people = service.shortcutsBySection().get('people') ?? [];
      expect(people.some(s => s.key === 'users')).toBeTrue();
    });
  });
});
