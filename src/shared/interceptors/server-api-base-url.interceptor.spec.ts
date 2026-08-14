import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import {
  DEFAULT_SSR_API_BASE_URL,
  resolveSsrApiBaseUrl,
  serverApiBaseUrlInterceptor,
} from './server-api-base-url.interceptor';

type ProcessLike = { env?: Record<string, string | undefined> };

describe('serverApiBaseUrlInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let originalProcess: ProcessLike | undefined;

  const setEnv = (value: string | undefined): void => {
    (globalThis as { process?: ProcessLike }).process = { env: { SSR_API_BASE_URL: value } };
  };

  beforeEach(() => {
    originalProcess = (globalThis as { process?: ProcessLike }).process;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([serverApiBaseUrlInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    if (originalProcess === undefined) {
      delete (globalThis as { process?: ProcessLike }).process;
    } else {
      (globalThis as { process?: ProcessLike }).process = originalProcess;
    }
  });

  it('prefixe une URL relative par la valeur de SSR_API_BASE_URL', () => {
    setEnv('http://backend:3000');

    http.get('/api/articles').subscribe();

    const req = httpMock.expectOne('http://backend:3000/api/articles');
    expect(req.request.url).toBe('http://backend:3000/api/articles');
    req.flush([]);
  });

  it('prefixe une URL relative sans slash initial', () => {
    setEnv('http://backend:3000');

    http.get('api/articles').subscribe();

    const req = httpMock.expectOne('http://backend:3000/api/articles');
    expect(req.request.url).toBe('http://backend:3000/api/articles');
    req.flush([]);
  });

  it('laisse intacte une URL absolue en http', () => {
    setEnv('http://backend:3000');

    http.get('http://autre-service:8080/api/ping').subscribe();

    const req = httpMock.expectOne('http://autre-service:8080/api/ping');
    expect(req.request.url).toBe('http://autre-service:8080/api/ping');
    req.flush({});
  });

  it('laisse intacte une URL absolue en https', () => {
    setEnv('http://backend:3000');

    http.get('https://api.github.com/repos').subscribe();

    const req = httpMock.expectOne('https://api.github.com/repos');
    expect(req.request.url).toBe('https://api.github.com/repos');
    req.flush({});
  });

  it('laisse intacte une URL protocol-relative', () => {
    setEnv('http://backend:3000');

    http.get('//cdn.example.com/asset.json').subscribe();

    const req = httpMock.expectOne('//cdn.example.com/asset.json');
    expect(req.request.url).toBe('//cdn.example.com/asset.json');
    req.flush({});
  });

  it('retombe sur la valeur par defaut quand la variable est absente', () => {
    setEnv(undefined);

    http.get('/api/config').subscribe();

    const req = httpMock.expectOne(`${DEFAULT_SSR_API_BASE_URL}/api/config`);
    expect(req.request.url).toBe(`${DEFAULT_SSR_API_BASE_URL}/api/config`);
    req.flush({});
  });

  it('retombe sur la valeur par defaut quand la variable est vide', () => {
    setEnv('   ');

    http.get('/api/config').subscribe();

    const req = httpMock.expectOne(`${DEFAULT_SSR_API_BASE_URL}/api/config`);
    expect(req.request.url).toBe(`${DEFAULT_SSR_API_BASE_URL}/api/config`);
    req.flush({});
  });

  it('retire le slash final de la variable pour ne pas doubler le separateur', () => {
    setEnv('http://backend:3000/');

    http.get('/api/config').subscribe();

    const req = httpMock.expectOne('http://backend:3000/api/config');
    expect(req.request.url).toBe('http://backend:3000/api/config');
    req.flush({});
  });

  describe('resolveSsrApiBaseUrl', () => {
    it('retourne la valeur par defaut quand process est absent', () => {
      delete (globalThis as { process?: ProcessLike }).process;

      expect(resolveSsrApiBaseUrl()).toBe(DEFAULT_SSR_API_BASE_URL);
    });

    it('retourne la valeur de la variable quand elle est definie', () => {
      setEnv('http://localhost:3000');

      expect(resolveSsrApiBaseUrl()).toBe('http://localhost:3000');
    });
  });
});
