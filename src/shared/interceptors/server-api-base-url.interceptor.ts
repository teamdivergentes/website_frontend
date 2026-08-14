import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Origine par defaut des appels API emis pendant le rendu serveur.
 * En conteneur, le SSR parle au backend par le reseau Docker interne, sans
 * repasser par Nginx ni par Internet.
 */
export const DEFAULT_SSR_API_BASE_URL = 'http://backend:3000';

/**
 * Lit l'origine a utiliser cote serveur, par ordre de priorite :
 *   1. `SSR_API_BASE_URL` — variable dediee au rendu serveur
 *   2. `BACKEND_URL` — deja definie par `entrypoint.sh` pour le proxy Nginx,
 *      ce qui evite d'avoir a cabler une variable de plus dans Ansible
 *   3. `http://backend:3000`
 *
 * `process` est absent d'un bundle navigateur : la lecture est defensive, meme
 * si cet intercepteur n'est jamais enregistre cote client.
 */
export function resolveSsrApiBaseUrl(): string {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  const trimmed = env?.['SSR_API_BASE_URL']?.trim() || env?.['BACKEND_URL']?.trim();
  if (!trimmed) return DEFAULT_SSR_API_BASE_URL;
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

/**
 * Prefixe les URLs relatives par une origine absolue pendant le rendu serveur.
 *
 * En production, `environment.apiUrl` vaut `''` : les services emettent des URLs
 * relatives (`/api/articles`), que Nginx resout dans le navigateur. Cote Node,
 * une URL relative n'a pas d'origine — `HttpClient` echoue et la page se rend
 * sans donnees, ce qui produit un HTML valide mais vide.
 *
 * A n'enregistrer que dans `app.config.server.ts`. Le comportement navigateur
 * doit rester strictement inchange.
 */
export const serverApiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // URL deja absolue (http://, https://, //cdn...) : on n'y touche pas.
  if (/^([a-z][a-z\d+\-.]*:)?\/\//i.test(req.url)) {
    return next(req);
  }

  const baseUrl = resolveSsrApiBaseUrl();
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;

  return next(req.clone({ url: `${baseUrl}${path}` }));
};
