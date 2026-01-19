import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const userRole = authService.role();
    if (userRole && allowedRoles.includes(userRole.name)) {
      return true;
    }

    return router.createUrlTree(['/admin']);
  };
};
