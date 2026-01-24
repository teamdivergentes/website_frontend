import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/api/auth.service';

// URLs qui ne doivent pas déclencher de logout automatique en cas de 401
const AUTH_URLS = ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/me', '/api/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Clone la requête et ajoute le header Authorization si un token existe
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Vérifier si c'est une URL d'auth (ne pas déclencher de logout auto)
  const isAuthUrl = AUTH_URLS.some(url => req.url.includes(url));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Déconnexion automatique si le token est invalide (401)
      // Sauf pour les endpoints d'auth pour éviter les boucles
      if (error.status === 401 && !isAuthUrl && authService.initialized()) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
