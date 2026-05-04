import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, HttpParams } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ApiService } from './api.service';

const BASE = 'http://localhost:3000';

describe('ApiService', () => {
  let service: ApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
      ],
    });
    service = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ------------------------------------------------------------------ //
  // GET
  // ------------------------------------------------------------------ //

  it('get() doit envoyer une requete GET a la bonne URL', () => {
    service.get('/api/teams').subscribe();

    const req = http.expectOne(`${BASE}/api/teams`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
  });

  it('get() doit transmettre les HttpParams', () => {
    const params = new HttpParams().set('page', '2').set('limit', '10');
    service.get('/api/teams', params).subscribe();

    const req = http.expectOne(r => r.url === `${BASE}/api/teams`);
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush([]);
  });

  it('get() doit retourner le body de la reponse', () => {
    const mockData = [{ id: 1, name: 'Team Alpha' }];
    let result: unknown;

    service.get<typeof mockData>('/api/teams').subscribe(r => (result = r));

    const req = http.expectOne(`${BASE}/api/teams`);
    req.flush(mockData);

    expect(result).toEqual(mockData);
  });

  // ------------------------------------------------------------------ //
  // POST
  // ------------------------------------------------------------------ //

  it('post() doit envoyer une requete POST avec le body', () => {
    const body = { name: 'Nouvelle equipe', game: 'Valorant' };
    service.post('/api/teams', body).subscribe();

    const req = http.expectOne(`${BASE}/api/teams`);
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual(body);
    req.flush({ id: 42, ...body });
  });

  it('post() doit retourner le body de la reponse', () => {
    const body = { name: 'Equipe B' };
    const response = { id: 2, name: 'Equipe B' };
    let result: unknown;

    service.post<typeof response>('/api/teams', body).subscribe(r => (result = r));

    const req = http.expectOne(`${BASE}/api/teams`);
    req.flush(response);

    expect(result).toEqual(response);
  });

  // ------------------------------------------------------------------ //
  // PUT
  // ------------------------------------------------------------------ //

  it('put() doit envoyer une requete PUT avec le body', () => {
    const body = { name: 'Equipe modifiee' };
    service.put('/api/teams/1', body).subscribe();

    const req = http.expectOne(`${BASE}/api/teams/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual(body);
    req.flush({ id: 1, ...body });
  });

  it('put() doit retourner le body de la reponse', () => {
    const body = { name: 'Mise a jour' };
    const response = { id: 1, name: 'Mise a jour' };
    let result: unknown;

    service.put<typeof response>('/api/teams/1', body).subscribe(r => (result = r));

    const req = http.expectOne(`${BASE}/api/teams/1`);
    req.flush(response);

    expect(result).toEqual(response);
  });

  // ------------------------------------------------------------------ //
  // PATCH
  // ------------------------------------------------------------------ //

  it('patch() doit envoyer une requete PATCH avec le body', () => {
    const body = { active: false };
    service.patch('/api/teams/1/toggle', body).subscribe();

    const req = http.expectOne(`${BASE}/api/teams/1/toggle`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual(body);
    req.flush({ id: 1, active: false });
  });

  it('patch() doit retourner le body de la reponse', () => {
    const body = { active: true };
    const response = { id: 1, active: true };
    let result: unknown;

    service.patch<typeof response>('/api/teams/1/toggle', body).subscribe(r => (result = r));

    const req = http.expectOne(`${BASE}/api/teams/1/toggle`);
    req.flush(response);

    expect(result).toEqual(response);
  });

  // ------------------------------------------------------------------ //
  // DELETE
  // ------------------------------------------------------------------ //

  it('delete() doit envoyer une requete DELETE a la bonne URL', () => {
    service.delete('/api/teams/5').subscribe();

    const req = http.expectOne(`${BASE}/api/teams/5`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.withCredentials).toBeTrue();
    req.flush(null);
  });

  it('delete() doit propager les erreurs HTTP', () => {
    let errorReceived = false;

    service.delete('/api/teams/999').subscribe({
      error: () => (errorReceived = true),
    });

    const req = http.expectOne(`${BASE}/api/teams/999`);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(errorReceived).toBeTrue();
  });

  // ------------------------------------------------------------------ //
  // withCredentials global
  // ------------------------------------------------------------------ //

  it('toutes les methodes utilisent withCredentials: true', () => {
    service.get('/api/test').subscribe();
    const getReq = http.expectOne(`${BASE}/api/test`);
    expect(getReq.request.withCredentials).toBeTrue();
    getReq.flush(null);

    service.post('/api/test', {}).subscribe();
    const postReq = http.expectOne(`${BASE}/api/test`);
    expect(postReq.request.withCredentials).toBeTrue();
    postReq.flush(null);

    service.put('/api/test/1', {}).subscribe();
    const putReq = http.expectOne(`${BASE}/api/test/1`);
    expect(putReq.request.withCredentials).toBeTrue();
    putReq.flush(null);

    service.patch('/api/test/1', {}).subscribe();
    const patchReq = http.expectOne(`${BASE}/api/test/1`);
    expect(patchReq.request.withCredentials).toBeTrue();
    patchReq.flush(null);

    service.delete('/api/test/1').subscribe();
    const deleteReq = http.expectOne(`${BASE}/api/test/1`);
    expect(deleteReq.request.withCredentials).toBeTrue();
    deleteReq.flush(null);
  });
});
