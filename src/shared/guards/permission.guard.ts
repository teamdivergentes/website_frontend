import { inject } from '@angular/core';
import { Router, type CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

/**
 * Guard de permission.
 * Attend la fin de l'initialisation (rehydratation via cookie HttpOnly).
 */
export const permissionGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  await authService.waitForInitialization();

  const requiredPermission = route.data['permission'] as string;
  if (!requiredPermission) return true;
  if (!authService.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (!authService.hasPermission(requiredPermission)) return router.createUrlTree(['/admin']);
  return true;
};
