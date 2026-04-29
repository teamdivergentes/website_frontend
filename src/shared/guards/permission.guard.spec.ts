import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { permissionGuard } from './permission.guard';
import { AuthService } from '../services/api/auth.service';
import { ApiService } from '../services/api/api.service';
import type { User } from '../models';

const MOCK_USER: User = {
  id: 1,
  email: 'admin@teamdivergentes.fr',
  role: {
    id: 1,
    name: 'Admin',
    permissions: ['users:read', 'roles:read'],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  actif: true,
  createdAt: '2024-01-01T00:00:00Z'
};

const MOCK_STATE = {} as RouterStateSnapshot;

function buildRoute(permission?: string): ActivatedRouteSnapshot {
  return { data: permission ? { permission } : {} } as unknown as ActivatedRouteSnapshot;
}

describe('permissionGuard (avec waitForInitialization)', () => {
  let httpMock: HttpTestingController;
  let authService: AuthService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ApiService,
        AuthService
      ]
    });
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const initReqs = httpMock.match('http://localhost:3000/api/auth/me');
    initReqs.forEach(req => req.flush(null, { status: 401, statusText: 'Unauthorized' }));
    await authService.waitForInitialization().catch(() => {});
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  function runGuard(permission?: string): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      permissionGuard(buildRoute(permission), MOCK_STATE) as Promise<boolean | UrlTree>
    );
  }

  it('doit retourner true si aucune permission requise', async () => {
    authService['userSignal'].set(MOCK_USER);
    authService['initializedSignal'].set(true);
    authService.initPromise = Promise.resolve(true);
    const result = await runGuard();
    expect(result).toBeTrue();
  });

  it('doit retourner true si l\'utilisateur a la permission requise', async () => {
    authService['userSignal'].set(MOCK_USER);
    authService['initializedSignal'].set(true);
    authService.initPromise = Promise.resolve(true);
    const result = await runGuard('users:read');
    expect(result).toBeTrue();
  });

  it('doit rediriger vers /admin si permission manquante', async () => {
    authService['userSignal'].set(MOCK_USER);
    authService['initializedSignal'].set(true);
    authService.initPromise = Promise.resolve(true);
    const result = await runGuard('config:write');
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/admin');
  });

  it('doit rediriger vers /auth/login si non authentifie', async () => {
    authService['userSignal'].set(null);
    authService['initializedSignal'].set(true);
    authService.initPromise = Promise.resolve(false);
    const result = await runGuard('users:read');
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/auth/login');
  });

  it('doit attendre waitForInitialization() si pas encore initialise', async () => {
    authService['initializedSignal'].set(false);
    authService.initPromise = null;
    const guardPromise = runGuard('users:read');
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const meReqs = httpMock.match('http://localhost:3000/api/auth/me');
    meReqs.forEach(r => r.flush(MOCK_USER));
    const result = await guardPromise;
    expect(result).toBeTrue();
  });

  it('doit rediriger vers /auth/login apres initialisation si non connecte', async () => {
    authService['initializedSignal'].set(false);
    authService.initPromise = null;
    const guardPromise = runGuard('users:read');
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const meReqs = httpMock.match('http://localhost:3000/api/auth/me');
    meReqs.forEach(r => r.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' }));
    const result = await guardPromise;
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/auth/login');
  });
});
