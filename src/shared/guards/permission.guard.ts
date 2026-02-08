import { inject } from '@angular/core';
import { Router, type CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/api/auth.service';

export const permissionGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attendre l'initialisation de l'authentification
  await authService.waitForInitialization();

  const requiredPermission = route.data['permission'] as string;

  if (!requiredPermission) {
    return true;
  }

  // Si on a un token mais pas de user (erreur réseau précédente), réessayer de charger le profil
  if (authService.isTokenPresent() && !authService.user()) {
    await firstValueFrom(authService.loadProfile());
  }

  // Vérifier si on a maintenant l'utilisateur et les permissions
  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  // Si toujours pas de user, rediriger vers login
  if (!authService.user()) {
    return router.createUrlTree(['/auth/login']);
  }

  // Si on a un user mais pas la permission, rediriger vers admin
  return router.createUrlTree(['/admin']);
};
