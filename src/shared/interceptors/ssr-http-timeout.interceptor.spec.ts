import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import {
  DEFAULT_SSR_HTTP_TIMEOUT_MS,
  resolveSsrHttpTimeoutMs,
  ssrHttpTimeoutInterceptor,
} from './ssr-http-timeout.interceptor';

type ProcessLike = { env?: Record<string, string | undefined> };

describe('ssrHttpTimeoutInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let originalProcess: ProcessLike | undefined;

  const setEnv = (value: string | undefined): void => {
    (globalThis as { process?: ProcessLike }).process = { env: { SSR_HTTP_TIMEOUT_MS: value } };
  };

  beforeEach(() => {
    originalProcess = (globalThis as { process?: ProcessLike }).process;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([ssrHttpTimeoutInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Un appel abandonne est annule, pas complete : c'est le comportement
    // attendu, il ne doit pas faire echouer la verification.
    httpMock.verify({ ignoreCancelled: true });
    if (originalProcess === undefined) {
      delete (globalThis as { process?: ProcessLike }).process;
    } else {
      (globalThis as { process?: ProcessLike }).process = originalProcess;
    }
  });

  describe('resolveSsrHttpTimeoutMs()', () => {
    it('retourne le defaut sans variable d’environnement', () => {
      delete (globalThis as { process?: ProcessLike }).process;
      expect(resolveSsrHttpTimeoutMs()).toBe(DEFAULT_SSR_HTTP_TIMEOUT_MS);
    });

    it('lit SSR_HTTP_TIMEOUT_MS', () => {
      setEnv('1200');
      expect(resolveSsrHttpTimeoutMs()).toBe(1200);
    });

    it('ignore une valeur non numerique, nulle ou negative', () => {
      // Une variable mal saisie ne doit pas desactiver la protection : le
      // repli sur le defaut est ce qui garantit qu'elle reste toujours active.
      for (const value of ['abc', '', '0', '-1']) {
        setEnv(value);
        expect(resolveSsrHttpTimeoutMs())
          .withContext(`valeur « ${value} »`)
          .toBe(DEFAULT_SSR_HTTP_TIMEOUT_MS);
      }
    });
  });

  it('laisse passer une reponse normale sans y toucher', () => {
    let body: unknown;
    http.get('/api/config').subscribe(response => (body = response));

    httpMock.expectOne('/api/config').flush([{ key: 'ok' }]);

    expect(body).toEqual([{ key: 'ok' }]);
  });

  it('abandonne un appel qui ne repond jamais', () => {
    // Le scenario que l'intercepteur existe pour couvrir. Un appel qui echoue
    // est deja rattrape partout ; un appel qui pend ne l'est nulle part, et il
    // suspend le rendu de la page jusqu'a ce que le moteur serve le shell
    // client — en HTTP 200, sans ecrire la moindre erreur.
    //
    // `jasmine.clock()` plutot que `fakeAsync` : le runner zoneless du projet
    // ne supporte pas `fakeAsync`.
    jasmine.clock().install();

    try {
      let error: unknown;
      http.get('/api/config').subscribe({ error: (err: unknown) => (error = err) });

      httpMock.expectOne('/api/config'); // jamais servi, volontairement
      jasmine.clock().tick(DEFAULT_SSR_HTTP_TIMEOUT_MS + 1);

      expect((error as { name?: string })?.name).toBe('TimeoutError');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('ne coupe pas un appel qui repond avant le delai', () => {
    jasmine.clock().install();

    try {
      let error: unknown;
      let body: unknown;
      http.get('/api/config').subscribe({
        next: response => (body = response),
        error: (err: unknown) => (error = err),
      });

      jasmine.clock().tick(DEFAULT_SSR_HTTP_TIMEOUT_MS - 1);
      httpMock.expectOne('/api/config').flush([]);

      expect(error).toBeUndefined();
      expect(body).toEqual([]);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
