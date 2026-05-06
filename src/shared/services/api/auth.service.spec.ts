import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import type { User } from '../../models';

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

/**
 * Cree un service frais avec un httpMock propre et flush l'initialize().
 */
async function createFreshService(): Promise<{
  service: AuthService;
  httpMock: HttpTestingController;
  router: Router;
  fetchSpy: jasmine.Spy;
}> {
  // initialize() utilise fetch directement (pas HttpClient) pour eviter la circular DI.
  // On mock fetch globalement avec un 401 par defaut (utilisateur non authentifie).
  const fetchSpy = spyOn(globalThis, 'fetch').and.callFake((url: string | URL | Request) => {
    const u = url.toString();
    if (u.includes('/api/auth/me')) {
      return Promise.resolve(new Response(null, { status: 401, statusText: 'Unauthorized' }));
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
  const httpMock = TestBed.inject(HttpTestingController);
  const router = TestBed.inject(Router);
  const service = TestBed.inject(AuthService);

  // Attendre que la Promise d'initialisation se resolve
  await service.waitForInitialization().catch(() => {});

  return { service, httpMock, router, fetchSpy };
}

describe('AuthService (cookie-based)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  let fetchSpy: jasmine.Spy;

  beforeEach(async () => {
    ({ service, httpMock, router, fetchSpy } = await createFreshService());
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  // ------------------------------------------------------------------ //
  // Bootstrap via fetch direct (anti-regression bug preprod 2026-05-06)
  // ------------------------------------------------------------------ //

  it('bootstrap : initialize() doit appeler fetch /api/auth/me avec credentials:include', () => {
    expect(fetchSpy).toHaveBeenCalled();
    const calls = fetchSpy.calls.allArgs();
    const meCall = calls.find(args => String(args[0]).includes('/api/auth/me'));
    expect(meCall).toBeDefined();
    expect(meCall![1]).toEqual(jasmine.objectContaining({ credentials: 'include' }));
  });

  it('bootstrap : initialize() ne doit PAS passer par HttpClient (sinon circular DI)', () => {
    // Aucune requete HttpClient ne doit etre faite au bootstrap pour /api/auth/me
    // (toutes les requetes initiales sont via fetch direct)
    httpMock.expectNone('http://localhost:3000/api/auth/me');
  });

  // ------------------------------------------------------------------ //
  // Absence de localStorage
  // ------------------------------------------------------------------ //

  it('ne doit PAS avoir de methode getToken() (supprimee)', () => {
    expect((service as unknown as { getToken?: () => string | null }).getToken).toBeUndefined();
  });

  it('ne doit PAS ecrire dans localStorage apres login', async () => {
    localStorage.clear();
    const loginSpy = spyOn(localStorage, 'setItem').and.callThrough();

    let loginDone = false;
    service.login({ email: 'admin@teamdivergentes.fr', password: 'admin123' }).subscribe({
      next: () => { loginDone = true; }
    });

    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const loginReq = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(loginReq.request.withCredentials).toBeTrue();
    loginReq.flush({ user: MOCK_USER });

    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const meReqs = httpMock.match('http://localhost:3000/api/auth/me');
    meReqs.forEach(req => req.flush(MOCK_USER));
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(loginSpy).not.toHaveBeenCalledWith('dvg_auth_token', jasmine.any(String));
    expect(loginDone).toBeTrue();
  });

  it('ne doit PAS supprimer depuis localStorage apres logout', async () => {
    spyOn(router, 'navigate');
    const removeItemSpy = spyOn(localStorage, 'removeItem').and.callThrough();

    service.logout();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const logoutReq = httpMock.expectOne('http://localhost:3000/api/auth/logout');
    logoutReq.flush({});
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(removeItemSpy).not.toHaveBeenCalledWith('dvg_auth_token');
  });

  // ------------------------------------------------------------------ //
  // login() avec withCredentials: true
  // ------------------------------------------------------------------ //

  it('login() doit appeler POST /api/auth/login avec withCredentials: true', async () => {
    service.login({ email: 'admin@teamdivergentes.fr', password: 'admin123' }).subscribe();

    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const req = httpMock.expectOne('http://localhost:3000/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ user: MOCK_USER });

    await new Promise<void>(resolve => setTimeout(resolve, 0));
    const meReqs = httpMock.match('http://localhost:3000/api/auth/me');
    meReqs.forEach(r => r.flush(MOCK_USER));
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });

  it('login() reussi doit charger le profil et rendre isAuthenticated true', async () => {
    expect(service.isAuthenticated()).toBeFalse();

    service.login({ email: 'admin@teamdivergentes.fr', password: 'admin123' }).subscribe();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const loginReq = httpMock.expectOne('http://localhost:3000/api/auth/login');
    loginReq.flush({ user: MOCK_USER });
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const meReqs = httpMock.match('http://localhost:3000/api/auth/me');
    meReqs.forEach(r => r.flush(MOCK_USER));
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()?.email).toBe('admin@teamdivergentes.fr');
  });

  it('login() doit exposer le user via userSignal (sans access_token)', async () => {
    service.login({ email: 'admin@teamdivergentes.fr', password: 'admin123' }).subscribe();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const loginReq = httpMock.expectOne('http://localhost:3000/api/auth/login');
    loginReq.flush({ user: MOCK_USER });
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const meReqs = httpMock.match('http://localhost:3000/api/auth/me');
    meReqs.forEach(r => r.flush(MOCK_USER));
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(service.user()).toEqual(MOCK_USER);
  });

  // ------------------------------------------------------------------ //
  // logout()
  // ------------------------------------------------------------------ //

  it('logout() doit appeler POST /api/auth/logout avec withCredentials: true', async () => {
    spyOn(router, 'navigate');
    service.logout();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({});
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });

  it('logout() doit vider userSignal et naviguer vers /auth/login', async () => {
    service['userSignal'].set(MOCK_USER);
    const routerSpy = spyOn(router, 'navigate');

    service.logout();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
    req.flush({});
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('logout() doit vider userSignal meme si la requete echoue', async () => {
    service['userSignal'].set(MOCK_USER);
    const routerSpy = spyOn(router, 'navigate');

    service.logout();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/logout');
    req.flush('Erreur', { status: 500, statusText: 'Internal Server Error' });
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(service.user()).toBeNull();
    expect(routerSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  // ------------------------------------------------------------------ //
  // loadProfile()
  // ------------------------------------------------------------------ //

  it('loadProfile() doit appeler GET /api/auth/me avec withCredentials: true', async () => {
    service.loadProfile().subscribe();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(MOCK_USER);
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });

  it('loadProfile() reussi doit remplir userSignal', async () => {
    service.loadProfile().subscribe();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
    req.flush(MOCK_USER);
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(service.user()).toEqual(MOCK_USER);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('loadProfile() sur 401 doit vider userSignal et retourner null', async () => {
    service['userSignal'].set(MOCK_USER);
    let result: unknown;

    service.loadProfile().subscribe(r => (result = r));
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(result).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('loadProfile() sur erreur reseau ne doit pas effacer userSignal (pas de 401)', async () => {
    service['userSignal'].set(MOCK_USER);
    let result: unknown;

    service.loadProfile().subscribe(r => (result = r));
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/me');
    req.flush('Erreur reseau', { status: 500, statusText: 'Internal Server Error' });
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(result).toBeNull();
    expect(service.user()).toEqual(MOCK_USER);
  });

  // ------------------------------------------------------------------ //
  // refreshToken()
  // ------------------------------------------------------------------ //

  it('refreshToken() doit appeler POST /api/auth/refresh avec withCredentials: true', async () => {
    service.refreshToken().subscribe({ error: () => {} });
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null, { status: 204, statusText: 'No Content' });
    await new Promise<void>(resolve => setTimeout(resolve, 10));
  });

  it('refreshToken() ne doit PAS stocker de token en localStorage', async () => {
    const setItemSpy = spyOn(localStorage, 'setItem');

    service.refreshToken().subscribe({ error: () => {} });
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const req = httpMock.expectOne('http://localhost:3000/api/auth/refresh');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    expect(setItemSpy).not.toHaveBeenCalledWith('dvg_auth_token', jasmine.any(String));
  });

  // ------------------------------------------------------------------ //
  // initialize() + waitForInitialization()
  // ------------------------------------------------------------------ //

  it('initialize() doit appeler fetch /api/auth/me et passer initializedSignal a true', async () => {
    TestBed.resetTestingModule();
    fetchSpy.and.callFake((url: string | URL | Request) => {
      if (String(url).includes('/api/auth/me')) {
        return Promise.resolve(new Response(JSON.stringify(MOCK_USER), { status: 200 }));
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
    const freshHttp = TestBed.inject(HttpTestingController);
    const freshService = TestBed.inject(AuthService);

    await freshService.waitForInitialization().catch(() => {});

    expect(freshService.initialized()).toBeTrue();
    expect(freshService.isAuthenticated()).toBeTrue();
    freshHttp.verify();
    TestBed.resetTestingModule();
  });

  it('waitForInitialization() resout false si fetch /api/auth/me retourne 401', async () => {
    TestBed.resetTestingModule();
    // fetchSpy est deja configure pour 401 par defaut dans createFreshService
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
    const freshService = TestBed.inject(AuthService);

    const result = await freshService.waitForInitialization().catch(() => false);

    expect(result).toBeFalse();
    expect(freshService.initialized()).toBeTrue();
    TestBed.resetTestingModule();
  });

  // ------------------------------------------------------------------ //
  // isAuthenticated se base sur userSignal uniquement
  // ------------------------------------------------------------------ //

  it('isAuthenticated doit etre false si userSignal est null', () => {
    service['userSignal'].set(null);
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('isAuthenticated doit etre true si userSignal est rempli', () => {
    service['userSignal'].set(MOCK_USER);
    expect(service.isAuthenticated()).toBeTrue();
  });

  // ------------------------------------------------------------------ //
  // permissions et roles
  // ------------------------------------------------------------------ //

  it('permissions() doit retourner les permissions du role', () => {
    service['userSignal'].set(MOCK_USER);
    expect(service.permissions()).toContain('users:read');
    expect(service.permissions()).toContain('roles:read');
  });

  it('hasPermission() doit retourner true pour une permission possedee', () => {
    service['userSignal'].set(MOCK_USER);
    expect(service.hasPermission('users:read')).toBeTrue();
    expect(service.hasPermission('config:read')).toBeFalse();
  });

  // ------------------------------------------------------------------ //
  // Timer de refresh (via startRefreshTimer / stopRefreshTimer)
  // ------------------------------------------------------------------ //

  it('startRefreshTimer puis stopRefreshTimer ne doit pas laisser de requete ouverte', async () => {
    service['userSignal'].set(MOCK_USER);
    service.startRefreshTimer();
    // Timer interval de 6h, donc dans les tests synchrones rien ne se passe
    service.stopRefreshTimer();
    // Aucune requete ouverte
    httpMock.expectNone('/api/auth/refresh');
  });

  it('stopRefreshTimer apres logout ne doit pas planter', async () => {
    spyOn(router, 'navigate');
    service['userSignal'].set(MOCK_USER);
    service.startRefreshTimer();

    service.logout();
    await new Promise<void>(resolve => setTimeout(resolve, 0));

    const logoutReq = httpMock.expectOne('http://localhost:3000/api/auth/logout');
    logoutReq.flush({});
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    // Timer arrete, aucune requete refresh ne doit etre en attente
    httpMock.expectNone('/api/auth/refresh');
    expect(service.isAuthenticated()).toBeFalse();
  });
});
