import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
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

/**
 * Vide la file de microtasks en plusieurs passes successives, puis force un cycle macrotask.
 * Chaque `await Promise.resolve()` avance d'un niveau dans la chaine Observable RxJS.
 * Le `setTimeout(0)` final force un cycle macrotask, indispensable sur les runners CI sous
 * charge ou la microtask queue seule ne suffit pas a dispatcher la requete HTTP.
 */
async function flushMicrotasks(passes = 5): Promise<void> {
  for (let i = 0; i < passes; i++) {
    await Promise.resolve();
  }
  // Macrotask cycle pour absorber la charge runner CI self-hosted
  await new Promise<void>(resolve => setTimeout(resolve, 0));
  for (let i = 0; i < 3; i++) {
    await Promise.resolve();
  }
}

describe('authInterceptor (cookie-based)', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: AuthService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        ApiService,
        AuthService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);

    // Flush l'appel initial de initialize()
    await flushMicrotasks();
    const initReqs = httpMock.match('/api/auth/me');
    initReqs.forEach(req => req.flush(null, { status: 401, statusText: 'Unauthorized' }));
    await authService.waitForInitialization().catch(() => {});
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ------------------------------------------------------------------ //
  // withCredentials: true sur toutes les requetes API
  // ------------------------------------------------------------------ //

  it('doit ajouter withCredentials: true sur les requetes GET /api/*', async () => {
    httpClient.get('/api/teams').subscribe();
    await flushMicrotasks();

    const req = httpMock.expectOne('/api/teams');
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
    await flushMicrotasks();
  });

  it('doit ajouter withCredentials: true sur les requetes POST /api/*', async () => {
    httpClient.post('/api/teams', { name: 'Test' }).subscribe();
    await flushMicrotasks();

    const req = httpMock.expectOne('/api/teams');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
    await flushMicrotasks();
  });

  it('doit ajouter withCredentials: true sur les requetes DELETE /api/*', async () => {
    httpClient.delete('/api/teams/1').subscribe({ error: () => {} });
    await flushMicrotasks();

    const req = httpMock.expectOne('/api/teams/1');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
    await flushMicrotasks();
  });

  // ------------------------------------------------------------------ //
  // NE PAS injecter Authorization: Bearer
  // ------------------------------------------------------------------ //

  it('ne doit PAS injecter un header Authorization: Bearer', async () => {
    localStorage.setItem('dvg_auth_token', 'legacy-token');

    httpClient.get('/api/users').subscribe();
    await flushMicrotasks();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
    await flushMicrotasks();
  });

  it('ne doit PAS injecter Authorization meme quand l\'utilisateur est connecte', async () => {
    authService['userSignal'].set(MOCK_USER);

    httpClient.get('/api/users').subscribe();
    await flushMicrotasks();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
    await flushMicrotasks();
  });

  // ------------------------------------------------------------------ //
  // Gestion 401 -> refresh -> retry
  // ------------------------------------------------------------------ //

  it('sur 401, doit appeler /api/auth/refresh puis rejouer la requete originale', async () => {
    authService['userSignal'].set(MOCK_USER);
    authService['initializedSignal'].set(true);
    let result: unknown;
    let errorResult: unknown;

    httpClient.get('/api/users').subscribe({
      next: r => (result = r),
      error: e => (errorResult = e)
    });
    await flushMicrotasks();

    // Premiere tentative -> 401
    const firstAttempt = httpMock.expectOne('/api/users');
    firstAttempt.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flushMicrotasks();

    // L'intercepteur doit appeler refresh (URL absolue via ApiService + environment.apiUrl)
    const refreshReq = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
    expect(refreshReq.request.method).toBe('POST');
    expect(refreshReq.request.withCredentials).toBeTrue();
    refreshReq.flush(null, { status: 204, statusText: 'No Content' });
    await flushMicrotasks();

    // Replay de la requete originale
    const retryAttempt = httpMock.expectOne('/api/users');
    retryAttempt.flush([{ id: 1 }]);
    await flushMicrotasks();

    expect(result).toEqual([{ id: 1 }]);
    expect(errorResult).toBeUndefined();
  });

  it('sur 401 + refresh 401, doit appeler logout et propager l\'erreur', async () => {
    authService['userSignal'].set(MOCK_USER);
    authService['initializedSignal'].set(true);
    const logoutSpy = spyOn(authService, 'logout').and.callFake(() => {
      authService['userSignal'].set(null);
    });

    let errorResult: unknown;
    httpClient.get('/api/users').subscribe({
      next: () => {},
      error: e => (errorResult = e)
    });

    // Flush pour que l'intercepteur traite la requete sortante
    await flushMicrotasks();

    const firstAttempt = httpMock.expectOne('/api/users');
    firstAttempt.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Flush pour que catchError declenche refreshToken()
    await flushMicrotasks();

    // authService.refreshToken() utilise ApiService -> URL absolue via environment.apiUrl
    const refreshReq = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
    refreshReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Flux de microtasks supplementaires pour traverser toute la chaine
    // catchError(refreshToken 401) -> logout() -> throwError() -> subscriber.error()
    await flushMicrotasks(8);

    expect(logoutSpy).toHaveBeenCalled();
    expect(errorResult).toBeTruthy();
  });

  it('ne doit PAS retry sur 401 pour /api/auth/login (endpoint auth exclu)', async () => {
    authService['initializedSignal'].set(true);
    let errorResult: unknown;

    httpClient.post('/api/auth/login', {}).subscribe({
      next: () => {},
      error: e => (errorResult = e)
    });
    await flushMicrotasks();

    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flushMicrotasks();

    httpMock.expectNone('/api/auth/refresh');
    expect(errorResult).toBeTruthy();
  });

  it('ne doit PAS retry sur 401 pour /api/auth/me (endpoint auth exclu)', async () => {
    authService['initializedSignal'].set(true);
    let errorResult: unknown;

    httpClient.get('/api/auth/me').subscribe({
      next: () => {},
      error: e => (errorResult = e)
    });
    await flushMicrotasks();

    const meReq = httpMock.expectOne('/api/auth/me');
    meReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flushMicrotasks();

    httpMock.expectNone('/api/auth/refresh');
    expect(errorResult).toBeTruthy();
  });

  it('ne doit PAS retry sur 401 pour /api/auth/refresh (eviter boucle infinie)', async () => {
    authService['initializedSignal'].set(true);
    let errorResult: unknown;

    httpClient.post('/api/auth/refresh', {}).subscribe({
      next: () => {},
      error: e => (errorResult = e)
    });
    await flushMicrotasks();

    const refreshReq = httpMock.expectOne('/api/auth/refresh');
    refreshReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await flushMicrotasks();

    httpMock.expectNone('/api/auth/refresh');
    expect(errorResult).toBeTruthy();
  });

  // ------------------------------------------------------------------ //
  // Autres codes d'erreur (non-401) ne declenchent pas de refresh
  // ------------------------------------------------------------------ //

  it('sur 403, ne doit PAS appeler refresh', async () => {
    authService['userSignal'].set(MOCK_USER);
    authService['initializedSignal'].set(true);

    httpClient.get('/api/users').subscribe({ next: () => {}, error: () => {} });
    await flushMicrotasks();

    const req = httpMock.expectOne('/api/users');
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    await flushMicrotasks();

    httpMock.expectNone('/api/auth/refresh');
  });
});
