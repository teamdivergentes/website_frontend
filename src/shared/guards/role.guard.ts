import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

/** Guard de role. Attend la rehydratation via cookie avant de verifier le role. */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    await authService.waitForInitialization();
    if (!authService.isAuthenticated()) return router.createUrlTree(['/auth/login']);
    const userRole = authService.role();
    if (userRole && allowedRoles.includes(userRole.name)) return true;
    return router.createUrlTree(['/admin']);
  };
};
