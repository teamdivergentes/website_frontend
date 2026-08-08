import { HttpInterceptorFn } from '@angular/common/http';
import { timeout } from 'rxjs/operators';

/**
 * Délai au-delà duquel un appel émis pendant le rendu serveur est abandonné.
 *
 * Cinq secondes : le backend répond en une centaine de millisecondes en
 * conditions normales, et Nginx laisse au rendu une marge bien supérieure. Ce
 * seuil ne coupe donc jamais un appel qui progresse — il ne vise que ceux qui
 * ne progressent plus.
 */
export const DEFAULT_SSR_HTTP_TIMEOUT_MS = 5000;

/**
 * Lit le délai depuis l'environnement du process, pour pouvoir l'ajuster sans
 * reconstruire l'image. Une valeur absente ou non numérique retombe sur le
 * défaut : une variable mal saisie ne doit pas désactiver la protection.
 */
export function resolveSsrHttpTimeoutMs(): number {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
    ?.env;
  const parsed = Number.parseInt(env?.['SSR_HTTP_TIMEOUT_MS']?.trim() ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SSR_HTTP_TIMEOUT_MS;
}

/**
 * Borne la durée des appels HTTP émis pendant le rendu serveur.
 *
 * Un appel qui **échoue** est déjà géré partout : les initialiseurs de
 * `app.config.ts` ont leur `catchError`, les pages ont leur callback d'erreur,
 * et la page se rend sans la donnée manquante. Un appel qui **pend**, lui,
 * n'est géré nulle part : rien ne le fait échouer, donc rien ne le rattrape.
 *
 * C'est le scénario à couvrir. Angular attend la stabilité de l'application
 * avant de sérialiser le HTML : une seule requête qui ne répond jamais
 * suspend le rendu de la page, et le moteur finit par servir le shell client —
 * en HTTP 200, sans écrire la moindre erreur. Le site paraît fonctionner et ne
 * renvoie plus rien aux crawlers.
 *
 * `timeout` mesure le temps **entre deux émissions**, ce qui couvre aussi bien
 * une connexion qui n'aboutit pas qu'une réponse qui s'interrompt en cours de
 * transfert. L'erreur émise est une erreur comme une autre : les `catchError`
 * déjà en place la traitent sans modification.
 *
 * À n'enregistrer que dans `app.config.server.ts`. Côté navigateur, un appel
 * lent dégrade l'affichage d'un composant ; il ne prive pas le site entier de
 * son rendu.
 */
export const ssrHttpTimeoutInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(timeout(resolveSsrHttpTimeoutMs()));
