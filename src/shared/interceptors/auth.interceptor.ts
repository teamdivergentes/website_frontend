import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/api/auth.service';

/** URLs exclues du retry automatique sur 401. */
const AUTH_URLS_NO_RETRY = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/refresh'
];

/**
 * Intercepteur HTTP d'authentification base cookie.
 * 1. Ajoute withCredentials: true a toutes les requetes.
 * 2. Sur 401 hors auth : tente refresh -> replay. Si echec -> logout.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const requestWithCredentials = req.clone({ withCredentials: true });
  const isAuthUrl = AUTH_URLS_NO_RETRY.some(url => req.url.includes(url));

  return next(requestWithCredentials).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthUrl || !authService.initialized()) {
        return throwError(() => error);
      }
      return tryRefreshAndRetry(requestWithCredentials, next, authService, error);
    })
  );
};

function tryRefreshAndRetry(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  originalError: HttpErrorResponse
) {
  return authService.refreshToken().pipe(
    switchMap(() => next(originalReq)),
    catchError(() => {
      authService.logout();
      return throwError(() => originalError);
    })
  );
}
