import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/api/auth.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return async () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Attendre l'initialisation de l'authentification
    await authService.waitForInitialization();

    // Si on a un token mais pas de user (erreur réseau précédente), réessayer de charger le profil
    if (authService.isTokenPresent() && !authService.user()) {
      await firstValueFrom(authService.loadProfile());
    }

    const userRole = authService.role();
    if (userRole && allowedRoles.includes(userRole.name)) {
      return true;
    }

    // Si toujours pas de user, rediriger vers login
    if (!authService.user()) {
      return router.createUrlTree(['/auth/login']);
    }

    return router.createUrlTree(['/admin']);
  };
};
