import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Attendre l'initialisation de l'authentification
  await authService.waitForInitialization();

  // Autoriser l'accès si on est authentifié (token + user)
  // OU si on a un token valide mais le profil n'a pas pu être chargé (erreur réseau)
  if (authService.isAuthenticated() || authService.isTokenPresent()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
