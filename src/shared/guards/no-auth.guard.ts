import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

/**
 * Guard inverse de l'authentification.
 * Redirige vers /admin si l'utilisateur est deja authentifie.
 * Evite qu'un utilisateur connecte reste bloque sur /auth/login.
 */
export const noAuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  await authService.waitForInitialization();
  if (authService.isAuthenticated()) {
    return router.createUrlTree(['/admin']);
  }
  return true;
};
