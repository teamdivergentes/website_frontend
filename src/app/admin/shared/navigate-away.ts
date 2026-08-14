import { Router } from '@angular/router';

/**
 * Quitte l'ecran courant depuis un gestionnaire synchrone.
 *
 * Les quinze navigations posees par la migration dialogue -> page (EPIC-41,
 * feature 3) sont toutes de la meme nature : un clic part vers une autre page
 * et l'appelant n'a rien a faire du resultat. Ecrites `void router.navigate()`,
 * elles laissaient un rejet non gere si une garde refusait la sortie ou si un
 * resolver levait — et `void` est precisement l'operateur que la regle
 * `typescript:S3735` refuse.
 *
 * Le rejet est donc trace plutot qu'avale : une navigation qui echoue laisse
 * l'utilisateur sur place sans explication, c'est le genre de panne qu'on ne
 * veut pas decouvrir par un ticket.
 *
 * `Promise.resolve` enveloppe l'appel pour rester robuste face a un `Router`
 * double dans un test qui ne renverrait pas de promesse.
 */
export function navigateAway(router: Router, commands: readonly unknown[]): void {
  Promise.resolve(router.navigate([...commands])).catch((error: unknown) => {
    console.error('Navigation impossible vers', commands, error);
  });
}
