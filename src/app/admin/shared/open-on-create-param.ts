import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CREATE_QUERY_PARAM } from '../../../shared/config/admin-actions';

/**
 * Ouvre le formulaire de creation de la page quand l'URL le demande.
 *
 * La plupart des creations admin passent par un dialogue porte par la page de
 * liste, sans route propre : la palette de commandes ne pourrait donc que
 * deposer l'utilisateur sur la liste, a lui de retrouver le bouton. Ce parametre
 * ferme l'ecart.
 *
 * Le parametre est retire de l'URL avant l'ouverture : sans cela, un
 * rafraichissement ou un retour arriere rouvrirait le formulaire, et un lien
 * copie-colle le rouvrirait chez le destinataire.
 *
 * A appeler dans un contexte d'injection (initialisation de champ ou
 * constructeur).
 */
export function openOnCreateParam(open: () => void): void {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const destroyRef = inject(DestroyRef);

  route.queryParamMap.pipe(takeUntilDestroyed(destroyRef)).subscribe((params) => {
    if (params.get(CREATE_QUERY_PARAM) !== '1') return;

    router
      .navigate([], { relativeTo: route, queryParams: {}, replaceUrl: true })
      .catch(() => undefined);

    // Differe d'une microtache : `queryParamMap` emet des l'abonnement, donc en
    // pleine initialisation des champs de la classe appelante. Ouvrir tout de
    // suite lirait des dependances pas encore injectees — `this.dialog` en tete —
    // et le rendrait dependant de la position de l'appel dans la classe.
    Promise.resolve().then(open).catch(() => undefined);
  });
}
