# Déploiement du rendu serveur (SSR) — procédure de mise en production

**EPIC-29** · dernière mise à jour : 2026-08-04

Ce document couvre le passage du frontend d'une SPA servie par Nginx à une application rendue côté serveur. C'est le changement d'infrastructure le plus large du frontend depuis sa création : l'image de production change de base, un second process apparaît dans le conteneur, et le routage Nginx du site public est réécrit.

**À lire en entier avant toute promotion en production.**

---

## 1. Ce qui change réellement

| | Avant | Après |
|---|---|---|
| Image de base | `nginx:alpine` | `node:22-alpine` + paquet `nginx` |
| Process dans le conteneur | Nginx | Nginx **et** Node (`127.0.0.1:4000`) |
| Shell client | `index.html` | `index.csr.html` |
| `location /` | `try_files … /index.html` | disque, sinon `proxy_pass` vers Node |
| Meta OG des pages publiques | injectées au démarrage, identiques partout | rendues par page, à chaque requête |
| `/health` | 200 dès que Nginx tourne | interroge Node |
| Port exposé | 80 | 80 — **inchangé** |

**Ce qui ne change pas** : Traefik, le `docker-compose`, le rôle Ansible `website`, les noms de service, le port 80, les volumes. Aucune migration de base, aucun état persistant.

---

## 2. Variables d'environnement

| Variable | Obligatoire | Défaut | Rôle |
|---|---|---|---|
| `BACKEND_URL` | déjà en place | `http://backend:3000` | proxy Nginx **et** repli pour les appels du rendu serveur |
| `SITE_URL` | **oui** | — | origine des `og:url` et des liens canoniques, et source des hôtes autorisés |
| `SSR_API_BASE_URL` | non | `BACKEND_URL` | origine des appels API pendant le rendu, si on veut la découpler du proxy |
| `NG_ALLOWED_HOSTS` | non | calculé depuis `SITE_URL` | liste d'hôtes autorisés, séparés par des virgules |
| `SSR_HTTP_TIMEOUT_MS` | non | `5000` | délai au-delà duquel un appel émis pendant le rendu est abandonné |
| `OG_IMAGE` | non | bannière de charte | image OG par défaut des pages sans visuel propre |
| `ROBOTS_ALLOW` | déjà en place | `false` | indexation |

> **`SITE_URL` devient critique.** Elle ne servait qu'à `robots.txt` et à `config.json`. Elle détermine désormais aussi les hôtes autorisés au rendu. Si elle est absente ou fausse en preprod, **le site répond 200 mais sert un HTML vide** (voir §5).

---

## 3. Ordre de déploiement

1. Déployer en **preprod** uniquement.
2. Dérouler l'intégralité de la recette du §4. Aucune étape n'est optionnelle.
3. Vérifier les previews sur les validateurs sociaux officiels.
4. Laisser tourner **au moins 24 h** en preprod. Les défauts de ce lot — fuite mémoire du process de rendu, cache mal réglé, dérive de charge — ne se voient pas en cinq minutes.
5. Promouvoir en production, puis refaire les points 1 à 6 de la recette sur le domaine de production.

---

## 4. Recette — à dérouler intégralement

Poser `BASE=https://preprod.teamdivergentes.fr`, puis le domaine de production.

### 4.1 Le rendu serveur fonctionne

```bash
curl -s -A "Discordbot/2.0" "$BASE/articles/<slug-d-un-article>" | grep -E '<title>|og:description|og:image|canonical'
```

Attendu : le titre, la description et l'image **de l'article**. Un `<title>` générique ou un `__OG_TITLE__` signale un rendu serveur inactif.

### 4.2 Le HTML contient du contenu, pas seulement des meta

```bash
curl -s "$BASE/articles/<slug>" | grep -c "<un mot du corps de l'article>"
```

Attendu : au moins 1. **C'est la vérification la plus importante de cette recette.** Un HTML qui porte les bonnes meta mais aucun contenu signale que les appels API échouent pendant le rendu — le site paraît fonctionner alors qu'il ne renvoie rien aux crawlers.

### 4.3 Les headers de sécurité sont tous là

```bash
for u in / /articles /admin/users /robots.txt; do
  echo "== $u"
  curl -sI "$BASE$u" | grep -icE 'content-security-policy|strict-transport-security|x-frame-options|x-content-type-options|referrer-policy|permissions-policy|x-robots-tag'
done
```

Attendu : **7 sur chaque URL**. Une valeur inférieure signifie qu'un `add_header` a été oublié dans un bloc `location` : dans Nginx, un `add_header` en `location` écrase **tous** ceux du niveau `server`. Le défaut est silencieux, il ne se voit sur aucune page.

### 4.4 Les routes privées ne sont pas rendues côté serveur

```bash
curl -s "$BASE/admin/users" | grep -E '<title>'
curl -s "$BASE/profile"     | grep -E '<title>'
```

Attendu : le titre générique du site, pas un titre de page. Et **jamais** `__OG_TITLE__` : ce serait le shell figé du bundle serveur.

### 4.5 Rien d'autre n'a bougé

```bash
for u in /team /shop /stream /evenements /graphic-chart /jeux; do
  curl -s -o /dev/null -w "$u %{http_code} -> %{redirect_url}\n" "$BASE$u"
done
curl -s "$BASE/robots.txt" | head -3
curl -s "$BASE/assets/config.json"
curl -s -o /dev/null -w "sitemap %{http_code}\n" "$BASE/sitemap.xml"
curl -s -o /dev/null -w "map %{http_code}\n" "$BASE/main.js.map"     # doit être 404
```

Attendu : six redirections 301, un `robots.txt` en texte, un `config.json` en JSON, un sitemap en 200, une source map en 404.

> `robots.txt` et `config.json` sont les deux fichiers que le proxy SSR a réellement cassés pendant le développement : ils n'ont pas d'extension d'asset reconnue et partaient vers Node, qui répondait une page « Page non trouvée » en HTTP 200. Un `robots.txt` cassé, c'est le référencement du site entier.

### 4.6 La supervision du process de rendu

```bash
docker exec <conteneur> sh -c 'kill $(pgrep -f server.mjs | head -1)'
docker ps -a --filter name=<conteneur>
```

Attendu : le conteneur passe en `Exited (1)` sous ~5 s, avec `FATAL: le serveur SSR s'est arrete` dans les logs, puis il est redémarré par la politique de redémarrage. **Un conteneur qui reste `Up` après ce test est un conteneur qui servira des 502 en silence.**

### 4.7 Le microcache

```bash
curl -sI "$BASE/articles" | grep -i x-cache   # MISS
curl -sI "$BASE/articles" | grep -i x-cache   # HIT
curl -sI --cookie "dvg_auth_token=x" "$BASE/articles" | grep -i x-cache   # BYPASS
```

Le `BYPASS` en présence d'un cookie de session est ce qui garantit qu'une page rendue pour un visiteur authentifié n'est jamais resservie à un anonyme.

### 4.8 Fraîcheur du contenu — le gain propre au SSR

Publier un article depuis l'admin, puis, **sans redéployer ni redémarrer le conteneur** :

```bash
sleep 60 && curl -s -A "Discordbot/2.0" "$BASE/articles/<nouveau-slug>" | grep '<title>'
```

Attendu : le titre du nouvel article. Le `sleep` couvre le microcache de 60 s.

### 4.9 Validateurs sociaux

Sur au moins trois URLs — un article, une fiche joueur, une page statique :

- Facebook Sharing Debugger
- LinkedIn Post Inspector
- Twitter Card Validator
- un partage réel sur Discord

---

## 4bis. Ce que la preprod a appris — 2026-08-07

La preprod a servi un **shell client pendant deux jours** sans que rien ne le signale. Le site répondait 200, `/health` répondait `{"status":"ok"}`, les smoke tests étaient verts, et les previews Discord affichaient `__OG_TITLE__`.

Trois enseignements, tous transposés en garde-fous :

**Un smoke test qui ne lit que le code HTTP ne voit pas cette panne.** C'est la démonstration grandeur nature du §5. Le workflow de déploiement vérifie désormais l'absence de placeholders `__OG_*__` sur la page d'accueil des deux environnements, et le rôle Ansible interroge le conteneur après chaque déploiement.

**Une sonde en boucle locale ne teste pas ce que reçoit un visiteur.** La première version de la vérification Ansible interrogeait `http://127.0.0.1:80/` depuis le conteneur, sans en-tête `Host`. Elle est passée au vert pendant que le smoke test externe échouait. L'en-tête `Host` est précisément la donnée que le moteur de rendu compare à sa liste d'hôtes autorisés : une requête `Host: 127.0.0.1` emprunte un chemin que personne ne prend. **Toute sonde doit porter le domaine public de l'environnement.**

**Un tag d'image flottant ne garantit pas que le conteneur tourne dessus.** `:PREPROD` et `:RELEASE` changent de digest sans que le `docker-compose.yml` bouge. Les tâches de pull utilisaient bien `force_source: true`, mais rien ne recréait ensuite le conteneur. Les stacks passent désormais par `pull: always`, et une entrée `force_recreate` du workflow permet de recréer un conteneur resté dans un état dégradé sans intervenir à la main sur le VPS.

### Un appel qui pend suspend le rendu de tout le site

Mesuré le 2026-08-08 sur l'image de production, contre un backend qui accepte la connexion et ne répond jamais :

| Configuration | Résultat |
|---|---|
| Sans délai effectif (`SSR_HTTP_TIMEOUT_MS=600000`) | **aucune réponse au bout de 45 s** |
| Avec le délai par défaut de 5 s | page rendue entièrement, en 10,5 s |

Un appel qui **échoue** était déjà rattrapé partout — les initialiseurs ont leur `catchError`, les pages leur callback d'erreur. Un appel qui **pend** ne l'était nulle part : rien ne le fait échouer, donc rien ne le rattrape. Angular attend la stabilité de l'application avant de sérialiser le HTML, si bien qu'une seule requête sans réponse suspend le rendu de la page. Derrière Nginx, cela finit en 504 ou en shell client, sans qu'aucune erreur ne soit écrite.

`ssrHttpTimeoutInterceptor` borne cette durée. L'erreur qu'il émet est une erreur comme une autre : les `catchError` déjà en place la traitent sans modification, et la page se rend sans la donnée manquante.

Les 10,5 s du cas pathologique viennent de deux appels séquentiels qui expirent l'un après l'autre. C'est lent, mais c'est une page servie plutôt qu'une absence de réponse — et seul un backend en panne y conduit.

> **Diagnostic non clos.** Le rendu serveur fonctionne dans l'image de production testée en local avec l'environnement exact de la preprod, et il fonctionnait depuis l'intérieur du conteneur preprod. La bascule vers le rendu client au travers de Traefik n'est pas encore expliquée. Piste ouverte : une dégradation dans le temps — le rendu répondait juste après la recréation du conteneur, plus quelques minutes après. À reprendre en observant le comportement immédiatement après un redémarrage, puis à intervalles réguliers.

---

## 5. Les trois défauts qui ne se voient pas

Ils partagent la même caractéristique : le site répond **HTTP 200** et paraît fonctionner.

| Défaut | Symptôme | Détection |
|---|---|---|
| Hôte non autorisé | voir ci-dessous — **400 sur tout le site**, ou HTML vide en 200 | §4.1 |
| URL d'API non résolue | HTTP 200, titre et meta corrects, **corps vide de données** | §4.2 — compter le contenu, pas les meta |
| `add_header` oublié dans une `location` | CSP retirée de tout le site public | §4.3 — compter les headers |

### Hôte non autorisé — deux comportements distincts

Vérifié le 2026-08-04 sur `@angular/ssr` 20.3 :

| Situation | Réponse |
|---|---|
| `allowedHosts` renseigné, hôte de la requête absent de la liste | **HTTP 400 sur toutes les pages publiques** |
| `allowedHosts` vide | HTTP 200, mais rendu client : HTML vide, placeholders `__OG_*__` intacts |

Le premier cas est celui qui se produira en production, puisque `server.ts` calcule toujours une liste non vide. Il est brutal mais **visible immédiatement** : le site entier répond 400.

Le second est le cas dangereux, parce qu'il ressemble à un site qui fonctionne. Il ne peut survenir que si quelqu'un vide la liste — d'où l'intérêt de ne jamais la rendre optionnelle.

Dans les deux cas, la cause est la même : `SITE_URL` absente ou ne correspondant pas au domaine servi.

### La défaillance vraiment silencieuse

La deuxième ligne du tableau est la seule qui ne se voie sur rien : HTTP 200, `<title>` correct, `og:description` correcte, et un corps de page sans la moindre donnée. Un test qui ne vérifierait que les meta tags passerait au vert. C'est pour cela que §4.2 existe, et que les tests E2E assertent sur le contenu métier.

Les deux régressions ont été simulées le 2026-08-04 sur l'image de production : les tests E2E `ssr-meta-tags.e2e.spec.ts` les détectent, avec trois échecs chacune.

---

## 6. Rollback

Redéployer le tag d'image précédent. Aucune migration de base, aucun état persistant : le retour arrière est immédiat et sans effet de bord.

Il n'existe **pas** de bascule permettant de désactiver le rendu serveur sans changer d'image : `location /` route vers Node dans la configuration Nginx embarquée. C'est un choix assumé — une bascule aurait doublé les chemins de code à tester.

---

## 7. Surveillance après mise en production

Les 48 premières heures :

- **Mémoire du conteneur.** Un process de rendu fuit plus facilement qu'un Nginx qui sert des fichiers. Une croissance continue sans palier justifie un retour arrière.
- **CPU pendant les passages de crawlers.** Le microcache doit les absorber ; un CPU qui monte à chaque passage signale un cache inopérant (vérifier `X-Cache-Status`).
- **Taux de 502.** Doit rester nul. Tout 502 signale un process de rendu instable.
- **Lighthouse SEO.** Le seuil bloquant de `.lighthouserc.json` (`categories:seo >= 0.9`) reste en place.
- **Search Console.** Surveiller les pages explorées et les erreurs d'exploration.

---

## 8. Vérifications faites avant cette mise en production

Recette exécutée en local sur l'image Docker de production, le 2026-08-04 :

| Point | Résultat |
|---|---|
| Rendu serveur de 8 pages publiques, titre et description propres | conforme |
| Contenu métier et JSON-LD présents dans le HTML brut | conforme |
| 7 headers de sécurité sur page SSR, fichier statique et route admin | conforme |
| 6 redirections 301 SEO | conforme |
| Rate limiting `/api/auth/login` | conforme (429 puis 503) |
| Source maps | 404 |
| `robots.txt`, `assets/config.json` | servis depuis le disque |
| `/admin/**`, `/auth/**`, `/profile` en rendu client | conforme |
| Accès direct à `/index.csr.html` | 404, comme voulu |
| Microcache : MISS, HIT, BYPASS sur cookie de session | conforme |
| Mort du process de rendu → arrêt du conteneur | conforme, en ~5 s |
| Suite de tests unitaires | 2128 tests, 0 échec |

**Non vérifié en local, à couvrir en preprod** : comportement sous charge réelle, tenue mémoire dans la durée, previews sur les validateurs sociaux officiels, et rendu sur un vrai domaine derrière Traefik en HTTPS.
