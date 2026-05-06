import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/api/auth.service';
import { ApiService } from '../services/api/api.service';
import type { User } from '../models';

const MOCK_USER: User = {
  id: 1,
  email: 'admin@teamdivergentes.fr',
  role: {
    id: 1,
    name: 'Admin',
    permissions: ['users:read'],
    isSystem: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  actif: true,
  createdAt: '2024-01-01T00:00:00Z'
};

const MOCK_ROUTE = {} as ActivatedRouteSnapshot;
const MOCK_STATE = {} as RouterStateSnapshot;

describe('authGuard (avec waitForInitialization)', () => {
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let fetchSpy: jasmine.Spy;
  // Permet aux tests individuels d'override le comportement de fetch /api/auth/me
  let nextFetchMeResponse: () => Response = () =>
    new Response(null, { status: 401, statusText: 'Unauthorized' });

  beforeEach(async () => {
    nextFetchMeResponse = () => new Response(null, { status: 401, statusText: 'Unauthorized' });
    fetchSpy = spyOn(globalThis, 'fetch').and.callFake((url: string | URL | Request) => {
      if (String(url).includes('/api/auth/me')) {
        return Promise.resolve(nextFetchMeResponse());
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    });

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
    await authService.waitForInitialization().catch(() => {});
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  function runGuard(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      authGuard(MOCK_ROUTE, MOCK_STATE) as Promise<boolean | UrlTree>
    );
  }

  it('doit retourner true si isAuthenticated est true apres initialisation', async () => {
    authService['userSignal'].set(MOCK_USER);
    authService['initializedSignal'].set(true);
    authService.initPromise = Promise.resolve(true);
    const result = await runGuard();
    expect(result).toBeTrue();
  });

  it('doit rediriger vers /auth/login si non authentifie', async () => {
    authService['userSignal'].set(null);
    authService['initializedSignal'].set(true);
    authService.initPromise = Promise.resolve(false);
    const result = await runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/auth/login');
  });

  it('doit attendre waitForInitialization() avant de decider (rehydratation)', async () => {
    nextFetchMeResponse = () => new Response(JSON.stringify(MOCK_USER), { status: 200 });
    authService['initializedSignal'].set(false);
    authService.initPromise = null;
    const result = await runGuard();
    expect(result).toBeTrue();
  });

  it('apres refresh page, doit valider si cookie valide', async () => {
    nextFetchMeResponse = () => new Response(JSON.stringify(MOCK_USER), { status: 200 });
    authService['initializedSignal'].set(false);
    authService.initPromise = null;
    const result = await runGuard();
    expect(result).toBeTrue();
    expect(authService.isAuthenticated()).toBeTrue();
  });

  it('apres refresh page, doit rediriger si cookie invalide (401)', async () => {
    nextFetchMeResponse = () => new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    authService['initializedSignal'].set(false);
    authService.initPromise = null;
    const result = await runGuard();
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/auth/login');
  });

  // Anti-regression bug preprod 2026-05-06 : initialize() doit utiliser fetch
  // direct (pas HttpClient) pour eviter la circular DI silencieuse
  it('bootstrap : initialize() doit appeler fetch /api/auth/me, jamais HttpClient', () => {
    expect(fetchSpy).toHaveBeenCalled();
    const calls = fetchSpy.calls.allArgs();
    const meCall = calls.find(args => String(args[0]).includes('/api/auth/me'));
    expect(meCall).toBeDefined();
    expect(meCall![1]).toEqual(jasmine.objectContaining({ credentials: 'include' }));
    httpMock.expectNone('http://localhost:3000/api/auth/me');
  });
});
