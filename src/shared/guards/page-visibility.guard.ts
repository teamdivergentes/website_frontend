import { inject } from '@angular/core';
import { RedirectCommand, Router, type CanActivateFn } from '@angular/router';
import { PageVisibilityService } from '../services/page-visibility.service';

/**
 * Guard de visibilité des pages publiques configurables.
 *
 * Masquer un lien dans le header et le footer ne suffit pas : la route reste
 * atteignable par URL directe, par un lien externe ou par un ancien résultat de
 * recherche. Ce guard ferme cet accès pour les pages qui le demandent.
 *
 * Le chemin interrogé est lu dans `route.data['visibilityPath']`, la même valeur
 * que celle passée à `PageVisibilityService.isPageVisible()` par la navigation —
 * pour qu'un lien caché et une route fermée ne puissent pas diverger.
 *
 * Page masquée : la page 404 est rendue **sur l'URL d'origine**, sans redirection.
 * C'est la règle du projet (cf. app.routes.ts) : elle préserve l'URL dans la
 * Search Console et permet de diagnostiquer les soft 404.
 */
export const pageVisibilityGuard: CanActivateFn = (route) => {
  const pageVisibilityService = inject(PageVisibilityService);
  const router = inject(Router);

  const visibilityPath = route.data['visibilityPath'] as string | undefined;
  if (!visibilityPath) return true;
  if (pageVisibilityService.isPageVisible(visibilityPath)) return true;

  return new RedirectCommand(router.parseUrl('/404'), { skipLocationChange: true });
};
