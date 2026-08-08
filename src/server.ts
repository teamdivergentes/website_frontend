import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

/**
 * Hotes autorises a etre rendus cote serveur.
 *
 * Sans cette liste, le moteur Angular refuse la requete proxifiee par Nginx et
 * **retombe silencieusement en rendu client** : la reponse reste un HTTP 200,
 * mais avec un `<app-root>` vide et les placeholders `__OG_*__` non substitues.
 * Autrement dit, exactement le defaut que l'EPIC-29 corrige, sans aucun signal
 * d'erreur cote client. C'est le piege le plus couteux de ce lot.
 *
 * `NG_ALLOWED_HOSTS` reste prioritaire pour ajouter un domaine sans rebuild.
 */
function resolveAllowedHosts(): string[] {
  const fromEnv = process.env['NG_ALLOWED_HOSTS']
    ?.split(',')
    .map(host => host.trim())
    .filter(Boolean);

  if (fromEnv?.length) return fromEnv;

  const hosts = new Set(['teamdivergentes.fr', 'www.teamdivergentes.fr', 'localhost', '127.0.0.1']);

  // Le domaine de preprod n'est pas connu a la compilation : il vient de
  // SITE_URL, deja injectee dans le conteneur pour robots.txt et config.json.
  const siteUrl = process.env['SITE_URL']?.trim();
  if (siteUrl) {
    try {
      hosts.add(new URL(siteUrl).hostname);
    } catch {
      console.warn(`[ssr] SITE_URL invalide, ignoree pour allowedHosts : ${siteUrl}`);
    }
  }

  return [...hosts];
}

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: resolveAllowedHosts(),
  // Nginx est le seul point d'entree du conteneur et reecrit lui-meme les
  // en-tetes X-Forwarded-* : un client ne peut pas les forger.
  //
  // La liste est explicite plutot que `true`. `true` designe une constante
  // interne d'`@angular/ssr` — for, host, port, proto, prefix — et le moteur
  // **retombe en rendu client** des qu'il recoit un `x-forwarded-*` qui n'y
  // figure pas, en repondant tout de meme HTTP 200. C'est ce qui est arrive
  // avec le `X-Forwarded-Server` de Traefik : la preprod a servi un shell vide
  // aux crawlers pendant trois jours pour un en-tete que personne ne lisait.
  //
  // Enumerer ce que l'on accepte rend la dependance visible ici, plutot que
  // dans une constante d'une version de bibliotheque. Nginx supprime tout le
  // reste avant de relayer.
  // Les quatre en-tetes que Traefik pose et que Nginx relaie. `x-forwarded-port`
  // en fait partie : l'omettre suffit a reproduire la panne, puisque le moteur
  // deoptimise sur **tout** `x-forwarded-*` non liste, y compris ceux qu'il
  // n'utilise pas.
  trustProxyHeaders: [
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-port',
    'x-forwarded-for',
  ],
});

/**
 * Sonde de vivacite du process de rendu.
 *
 * Le `location /health` de Nginx repond 200 des que Nginx tourne, meme si Node
 * est mort — Traefik continuerait alors a router du trafic vers un conteneur
 * incapable de rendre une page. C'est ce point que Nginx interroge desormais.
 */
app.get('/health/ssr', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Fichiers statiques de `dist/frontend/browser`.
 *
 * En conteneur, Nginx sert deja les assets depuis le disque sans passer par
 * Node. Ce middleware ne sert donc qu'au lancement direct du serveur SSR, en
 * developpement ou pour une verification manuelle.
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Toutes les autres requetes passent par le moteur de rendu Angular.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then(response => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Demarre le serveur quand ce module est le point d'entree.
 * Sous `ng serve`, c'est l'outillage Angular qui appelle le handler exporte.
 */
if (isMainModule(import.meta.url)) {
  const port = Number(process.env['SSR_PORT'] ?? process.env['PORT'] ?? 4000);
  const host = process.env['SSR_HOST'] ?? '127.0.0.1';

  app.listen(port, host, () => {
    console.log(`[ssr] Angular server listening on http://${host}:${port}`);
  });
}

/**
 * Handler consomme par Angular CLI et par les outils de dev.
 */
export const reqHandler = createNodeRequestHandler(app);
