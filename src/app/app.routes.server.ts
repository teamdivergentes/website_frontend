import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Table de rendu par route.
 *
 * Le choix est volontairement inverse de celui de la spec de design : au lieu
 * d'enumerer les routes publiques a rendre cote serveur, on enumere les seules
 * routes a laisser en rendu client, et tout le reste passe en `Server`.
 *
 * La raison est le risque cite par la feature elle-meme — « toute route publique
 * ajoutee ulterieurement doit etre declaree ici, sinon elle retombe
 * silencieusement en rendu client et perd ses previews sociales ». Avec une
 * liste d'exclusion, une nouvelle page publique est correctement rendue sans
 * qu'on ait a y penser, et le seul oubli possible — une nouvelle section privee
 * — se voit immediatement puisque la page serait rendue sans session.
 *
 * `/admin/**`, `/auth/**` et `/profile` restent en rendu client : aucun benefice
 * SEO, elles sont derriere `authGuard`, et cela evite d'auditer les modules
 * admin pour la compatibilite serveur.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: 'auth', renderMode: RenderMode.Client },
  { path: 'auth/**', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
