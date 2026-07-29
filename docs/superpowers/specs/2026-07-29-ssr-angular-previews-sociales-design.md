# SSR Angular pour les previews sociales et le SEO — Spec de design

**Date** : 2026-07-29
**Périmètre** : `website_frontend` + `vps_ansible` (aucune évolution d'API ni de schéma de base)
**Origine** : relance PO du 2026-07-29 — « peu importe le lien que je prends, si je l'envoie j'aurai toujours le même message / description du site »
**EPIC** : EPIC-29 — Previews sociales et SEO par rendu serveur
**Décision majeure** : cette spec **remplace la direction technique** d'EPIC-29 (prerendering statique) par du **SSR runtime**

---

## 1. Contexte et diagnostic

Le PO avait déjà posé cette question le 2026-05-21. L'audit prod du 2026-05-27 avait classé le sujet **blocage SEO #1**. L'EPIC-29 a été rédigée, jamais démarrée : aucune branche `feat/epic-29-prerendering` n'existe. La relance du 2026-07-29 confirme que le problème est toujours vivant en production.

Vérification en prod le 2026-07-29, avec un user-agent de crawler social :

```bash
curl -s -A "facebookexternalhit/1.1" https://teamdivergentes.fr/<route> | grep -E 'og:title|og:description|<title>'
```

| Route testée | `<title>` retourné |
|---|---|
| `/` | `Team Divergentes - Structure Esport` |
| `/boutique` | `Team Divergentes - Structure Esport` |
| `/articles` | `Team Divergentes - Structure Esport` |
| `/structure/equipes` | `Team Divergentes - Structure Esport` |

Identique sur les quatre, `og:description` comprise.

### Chaîne de causalité

| # | Maillon | Preuve |
|---|---------|--------|
| C1 | Nginx sert le même `index.html` pour toute route inconnue | `nginx.conf` — `location / { try_files $uri $uri/ /index.html; }` |
| C2 | Les valeurs OG sont injectées **une fois au démarrage du conteneur**, globales au site | `entrypoint.sh` — substitution `awk` des placeholders `__OG_TITLE__`, `__OG_DESCRIPTION__`, `__OG_IMAGE__` depuis `/api/config` |
| C3 | `SeoService` fait correctement son travail par page, mais **en JavaScript après chargement** | `src/app/shared/services/seo.service.ts` — `meta.updateTag()` sur `og:*`, `twitter:*`, JSON-LD |
| C4 | Les scrapers de liens n'exécutent pas de JavaScript | Discord, WhatsApp, Slack, Facebook, LinkedIn, X, iMessage, Signal |

Conséquence mesurée : **partage social cassé sur 100 % des pages**. Googlebot exécute le JS en seconde vague, donc le SEO organique est dégradé sans être nul. Bingbot et les crawlers IA (GPTBot, ClaudeBot, PerplexityBot) ne voient rien.

Effet secondaire de C2 : modifier `og_description` dans l'admin n'a **aucun effet tant que le conteneur n'est pas redémarré**. Défaut réel, corrigé mécaniquement par le SSR.

### Pourquoi le SSR plutôt que le prerendering

EPIC-29 avait tranché pour `outputMode: 'static'` en écartant le SSR runtime, jugé « overkill ». Décision PO du 2026-07-29 : **pérenniser**, donc SSR runtime. Les raisons qui font pencher la balance :

| Critère | Prerender statique | SSR runtime |
|---|---|---|
| Article publié après le build | Invisible jusqu'au prochain déploiement | Rendu immédiatement |
| Produit boutique, stock, prix | Figés à l'heure du build | À jour à chaque requête |
| Nombre de routes dynamiques | Doit être borné (top N) sous peine de faire exploser le build CI | Sans objet |
| Build CI | Allongé proportionnellement au nombre de routes | Inchangé |
| Nonces CSP par requête (EPIC-30 / SEC-004) | Impossible, le HTML est figé | Possible |
| Infra à maintenir | Aucune | Un process Node |

Le point décisif est le premier : sur un site qui publie des articles et vend des produits, un HTML figé au build reprend le même problème sous une autre forme.

---

## 2. Décisions validées

Trois arbitrages, validés par le PO le 2026-07-29 :

| # | Décision |
|---|----------|
| **A** | **EPIC-29 est pivotée**, pas remplacée. Le numéro, le diagnostic, les métriques cibles et les liens entrants sont conservés. La direction technique est réécrite. |
| **B** | **Nginx reste en frontal dans le même conteneur**, Node SSR derrière sur `127.0.0.1:4000`. Traefik, le rôle Ansible `website` et le `docker-compose` ne bougent pas. |
| **C** | **Rendu serveur sur le périmètre public uniquement.** `/admin/**`, `/auth/**` et `/profile` restent en rendu client. |

### Architecture cible

```
Traefik :443
   └─ conteneur website-<env>-frontend :80  [nginx]
        ├─ /api/, /uploads/       → backend:3000        (inchangé)
        ├─ *.js *.css *.webp ...  → disque dist/browser (inchangé)
        ├─ 7 redirects 301 SEO    → inchangés
        └─ tout le reste          → 127.0.0.1:4000  [node ssr]
                                        └─ fetch http://backend:3000
```

---

## 3. Périmètre

### Dans le périmètre

- Configuration SSR Angular 20 (`@angular/ssr` est déjà compatible, aucune montée de version)
- Table de rendu par route (`RenderMode.Server` public / `RenderMode.Client` admin)
- Mise en conformité serveur du code du périmètre public
- Résolution de l'URL de base API côté serveur
- Dockerfile bi-runtime, configuration Nginx, entrypoint, healthcheck, microcache
- Tests E2E sur le HTML brut et validation par les debuggers sociaux officiels

### Hors périmètre

- Rendu serveur des pages admin (aucun bénéfice SEO, routes sous `authGuard`)
- Refonte de `SeoService` (livrée en EPIC-23 et EPIC-25, déjà conforme serveur)
- Optimisation Core Web Vitals (EPIC-32)
- Nonces CSP (EPIC-30 / SEC-004) — débloqués par cette EPIC mais livrés séparément
- Prerendering au build des pages purement statiques — optimisation possible **après** livraison, non retenue au premier jet

---

## 4. Lot E1 — Mise en conformité serveur du code public

**C'est le lot le plus risqué de l'EPIC, et le préalable bloquant.** La configuration SSR elle-même est mécanique ; ce lot touche du code qui fonctionne aujourd'hui en production.

### Audit réalisé le 2026-07-29

Recherche des accès à `window`, `document`, `localStorage`, `sessionStorage` et `navigator` dans `src/`, hors `admin/`, `auth/` et fichiers de test : **17 fichiers concernés, dont 14 sans garde `isPlatformBrowser`**.

| Fichier | Garde | Gravité |
|---|---|---|
| `src/shared/layouts/main-layout/main-layout.ts` | Non | **Bloquant total** |
| `src/shared/headers/header/header.ts` | Non | Élevée |
| `src/shared/services/cookie-consent.service.ts` | Non | Élevée |
| `src/shared/services/matomo.service.ts` | Non | Élevée |
| `src/shared/services/analytics.service.ts` | Non | Élevée |
| `src/app/app.config.ts` | Non | Élevée |
| `src/app/pages/home.ts` | Non | Moyenne |
| `src/app/pages/boutique/boutique.ts` | Non | Moyenne |
| `src/app/pages/twitch/twitch.component.ts` | Non | Moyenne |
| `src/app/pages/articles/article-detail/article-detail.component.ts` | Non | Moyenne |
| `src/app/pages/not-found/not-found.ts` | Non | Faible |
| `src/app/pages/legal/retractation/retractation.ts` | Non | Faible |
| `src/app/shared/components/editor-blocks-renderer/editor-blocks-renderer.component.ts` | Non | Moyenne |
| `src/app/shared/services/cart.service.ts` | Non, mais `globalThis.localStorage?.` | Déjà sûr |
| `src/app/pages/articles/articles-page.component.ts` | Oui | Conforme |
| `src/app/shared/services/seo.service.ts` | Oui | Conforme |
| `src/shared/services/runtime-config.service.ts` | Oui | Conforme |

### Le cas bloquant

`src/shared/layouts/main-layout/main-layout.ts:25` :

```ts
constructor() {
    if (window.matchMedia('(max-width: 599px)').matches) return;
```

`MainLayout` enveloppe **toutes** les routes publiques et l'appel est dans le constructeur, donc exécuté au rendu serveur de n'importe quelle page. Sans correction, le SSR échoue sur 100 % du périmètre. Le même fichier accède ensuite à `document.querySelectorAll`, `document.getElementById`, `window.getComputedStyle` et `window.innerWidth` pour sa logique de scroll-snap.

### Règle de correction

Les comportements purement visuels et interactifs (scroll-snap, matchMedia, mesures de layout) ne doivent **pas** s'exécuter au rendu serveur : ils n'ont pas de sens sans navigateur et n'apportent rien au HTML envoyé aux crawlers. Ils sont donc encadrés par `isPlatformBrowser(inject(PLATFORM_ID))` et non par un polyfill de `window`.

Un polyfill global de type `domino` est explicitement écarté : il masquerait les vrais problèmes et produirait un HTML rendu dans un DOM factice, difficile à diagnostiquer.

### Critère d'acceptation du lot

E1 est mergeable **seul**, sans SSR actif, et sans effet de bord observable en navigateur. La non-régression est vérifiée par la suite de tests existante plus une recette manuelle sur les pages touchées.

---

## 5. Lot E1 bis — URL de base API côté serveur

Blocage distinct du précédent, tout aussi certain.

`src/environments/environment.prod.ts` :

```ts
export const environment = {
  production: true,
  apiUrl: '' // Vide, les services ajoutent /api
};
```

`src/shared/services/api/api.service.ts` construit donc des URLs relatives (`/api/articles`). En navigateur, Nginx résout. **Côté Node, une URL relative n'a pas d'origine** : `HttpClient` lève une erreur et le composant rend un état vide.

Conséquence si ce point est manqué : le SSR produit un HTML valide mais **sans contenu** — soit exactement le problème actuel, en plus coûteux. Une page vide rendue côté serveur est pire que la situation d'aujourd'hui, parce qu'elle a l'air de fonctionner.

**Correction retenue** : un intercepteur HTTP actif uniquement côté serveur préfixe les URLs relatives par une origine absolue lue dans une variable d'environnement (`SSR_API_BASE_URL`, valeur `http://backend:3000` en conteneur). Le comportement navigateur reste strictement inchangé — l'intercepteur ne s'enregistre que dans `app.config.server.ts`.

`withHttpTransferCache`, actif par défaut avec `provideClientHydration()`, évite que le navigateur refasse les mêmes appels après hydratation.

---

## 6. Lot F1 — Socle SSR Angular

| Fichier | Nature | Contenu |
|---|---|---|
| `angular.json` | modifié | `"outputMode": "server"`, `"ssr": { "entry": "src/server.ts" }` |
| `src/server.ts` | nouveau | `AngularNodeAppEngine` + Express, écoute `:4000`, `allowedHosts` |
| `src/app/app.routes.server.ts` | nouveau | table de rendu par route |
| `src/app/app.config.server.ts` | nouveau | `provideServerRendering(withRoutes(serverRoutes))` + intercepteur d'URL de base |
| `src/app/app.config.ts` | modifié | ajout de `provideClientHydration(withEventReplay())` |

### Table de rendu

`RenderMode.Server` sur : `/`, `/contact`, `/boutique`, `/boutique/:slug`, `/boutique/panier`, `/boutique/merci`, `/structure`, `/structure/sponsors`, `/structure/palmares`, `/structure/equipes`, `/structure/equipes/:teamId`, `/structure/equipes/:teamId/joueur/:playerSlug`, `/structure/equipes/:teamId/coach/:slug`, `/structure/recrutement`, `/structure/recrutement/:slug`, `/structure/recrutement/postuler`, `/twitch`, `/articles`, `/articles/:slug`, `/privacy-optout`, `/mentions-legales`, `/politique-de-confidentialite`, `/conditions-generales-de-vente`, `/retractation`, `/404`.

`RenderMode.Client` sur : `/admin/**`, `/auth/**`, `/profile`.

### Points de vigilance

- **`allowedHosts` est obligatoire.** Sans lui, le moteur Angular rejette les requêtes proxifiées. Valeurs : `teamdivergentes.fr`, le domaine de preprod, et `localhost` en développement.
- **`provideClientHydration()` doit figurer dans la configuration serveur comme dans la configuration client**, sinon erreur `NG0505` au runtime.
- L'ordre `provideAppInitializer` / `RuntimeConfigService` doit être revérifié côté serveur : `assets/config.json` est généré par `entrypoint.sh` et lu au démarrage. Le piège `APP_INITIALIZER` déjà documenté dans `CLAUDE.md` s'applique ici.

---

## 7. Lot F2 — Intégration Docker et Nginx

### Dockerfile

L'image de production passe de `nginx:alpine` à `node:22-alpine` avec `apk add nginx`. Elle embarque `dist/frontend/browser` **et** `dist/frontend/server`. L'exécution en utilisateur non-root est conservée.

### nginx.conf

| Changement | Détail |
|---|---|
| `location /` | `proxy_pass http://127.0.0.1:4000;` en remplacement de `try_files $uri $uri/ /index.html;` |
| Headers de sécurité | **Répétés intégralement** dans la nouvelle `location /` |
| Microcache HTML | `proxy_cache` 60 s sur les réponses 200 du SSR |
| Assets statiques | inchangés, servis depuis le disque sans passer par Node |
| Redirects 301, rate limiting, proxy `/api` et `/uploads`, cache uploads | inchangés |

Le piège Nginx est déjà consigné dans `WEB/CLAUDE.md` : `add_header` dans un bloc `location` **écrase tous** les `add_header` du niveau `server`. La nouvelle `location /` doit donc réémettre CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy et X-Robots-Tag. Un oubli ici retire silencieusement la CSP de tout le site public.

Le microcache a un rôle concret : sans lui, chaque passage de crawler déclenche un rendu Angular complet plus les appels backend associés. Une rafale de bots sociaux sur un article partagé coûterait autant de rendus que de bots.

### entrypoint.sh

- Lance Node en arrière-plan, puis Nginx au premier plan, avec supervision : **si Node meurt, le conteneur meurt**. Servir du 502 en silence pendant des jours est le scénario à éviter.
- L'injection `awk` des placeholders `__OG_*__` **est conservée** : `index.html` reste servi tel quel pour les routes admin en rendu client.
- Génération de `assets/config.json` et de `robots.txt` : inchangée.

### Healthcheck

Le `location /health` actuel renvoie 200 dès que Nginx tourne, même si Node est mort. Il doit sonder Node, sinon Traefik router du trafic vers un conteneur incapable de rendre une page.

---

## 8. Lot E2 — Validation

### Tests automatisés

- **E2E Playwright** : `request.get(url)` sans contexte navigateur, donc sans exécution de JS, pour vérifier `<title>`, `<meta name="description">` et `og:title|og:description|og:image|og:url` sur une page statique, un article, une fiche joueur, une fiche coach et un produit boutique.
- **Tests unitaires** : couverture de l'intercepteur d'URL de base serveur et des gardes `isPlatformBrowser` ajoutées.
- **Lighthouse CI** : le seuil bloquant `categories:seo >= 0.9` de `.lighthouserc.json` reste en place, sur les mêmes URLs.

### Recette manuelle

- Facebook Sharing Debugger, LinkedIn Post Inspector, Twitter Card Validator sur trois URLs types
- Partage réel d'un lien d'article sur Discord
- Vérification des headers de sécurité en preprod, en particulier la présence de la CSP sur une page publique

---

## 9. Gestion des erreurs et rollback

| Scénario | Comportement attendu |
|---|---|
| Node indisponible | Nginx renvoie 502 sur les pages publiques, healthcheck en échec, conteneur redémarré. Pas de fallback silencieux. |
| Backend indisponible au rendu | La page rend son état d'erreur ou de squelette, comme aujourd'hui côté navigateur. Pas de page blanche. |
| Régression constatée en production | Redéploiement du tag d'image précédent. Aucune migration de base, aucun état persistant : le rollback est immédiat. |

Ordre de déploiement : preprod, recette manuelle complète, puis production.

---

## 10. Ordre des lots

```
E1  Conformité serveur du code public      ─┐
E1b URL de base API côté serveur           ─┴─→ F1  Socle SSR ──→ F2  Infra ──→ E2  Validation
```

E1 et E1b sont indépendants l'un de l'autre et mergeables séparément, sans SSR actif. F1 est sans effet visible tant que F2 n'est pas livré. Une PR par lot.

---

## 11. Critères de sortie de l'EPIC

- `curl -A "Discordbot/2.0" https://teamdivergentes.fr/articles/<slug>` retourne le titre, la description et l'image **de l'article**, sans exécution de JavaScript
- Idem sur une fiche joueur, une fiche coach, un produit boutique et une page statique
- Partage réel sur Discord : la carte correspond à la page partagée
- Un article publié via l'admin est correctement prévisualisé **sans redéploiement ni redémarrage de conteneur**
- Aucune régression de headers de sécurité en preprod ni en production
- Lighthouse SEO ≥ 0,9 maintenu sur les quatre URLs auditées
- VQO ≥ 9,5/10 sur tous les domaines

---

## 12. Impacts sur les autres EPICs

| EPIC | Impact |
|---|---|
| **EPIC-30 / SEC-004** (nonces CSP) | **Débloqué, et mieux que prévu.** Un serveur de rendu peut générer un nonce par requête ; un HTML prerenderé ne le pouvait pas. |
| **EPIC-23 / enabler `prerender-static-pages`** | Reste marqué comme promu en EPIC-29. La direction technique qu'il décrivait est abandonnée au profit du SSR. |
| **EPIC-31** (SEO follow-up batch 3) | Sans dépendance. Les correctifs SEO indépendants du rendu restent séparés. |
| **EPIC-32** (Core Web Vitals) | À réévaluer après livraison : le SSR change le profil de LCP et de FCP, dans les deux sens possibles. |
