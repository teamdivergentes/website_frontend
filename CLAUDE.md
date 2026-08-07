# CLAUDE.md - Frontend Angular

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular 20+ frontend for TeamDivergentes (DVG), a French esports/gaming organization website. Uses zoneless change detection, Angular Signals, standalone components, and a dual styling approach (Bootstrap for public pages, Angular Material for admin).

## Common Commands

```bash
# Development server (opens browser, proxy to backend)
npm start

# Production build
npm run build

# Lint (ESLint)
npm run lint

# Run all tests (Karma/Jasmine)
npm test

# Run a single test file
npx ng test --include="**/path-to-file.spec.ts"
```

---

## Architecture

### Source Structure

```
src/
├── app/
│   ├── admin/                  # Admin panel (protected routes)
│   │   ├── components/         # Sidebar, header
│   │   ├── dashboard/          # Admin dashboard
│   │   ├── layout/             # Admin layout wrapper
│   │   └── pages/              # CRUD pages (8 modules)
│   │       ├── users/          # User management + dialogs
│   │       ├── roles/          # Role + permission management
│   │       ├── teams/          # Teams + members management
│   │       ├── games/          # Game catalog management
│   │       ├── sponsors/       # Sponsors + images + links
│   │       ├── staff/          # Staff member management
│   │       ├── recruitment/    # Job postings management
│   │       └── config/         # App configuration
│   ├── auth/                   # Login (register commented out)
│   ├── data/                   # Static/mock data
│   ├── pages/                  # Public pages
│   │   ├── home/               # Homepage (hero, carousel)
│   │   ├── contact/            # Contact form
│   │   ├── shop/               # Merchandise
│   │   ├── structure/          # Structure hub
│   │   ├── sponsors/           # Sponsors showcase
│   │   ├── equipes/            # Teams listing + detail
│   │   ├── recrutement/        # Jobs listing + detail + apply
│   │   ├── profile/            # User profile
│   │   └── not-found/          # 404 page
│   ├── shared/                 # App-level shared code
│   │   ├── components/         # image-upload (drag-drop)
│   │   ├── guards/             # Re-exports from src/shared
│   │   ├── layouts/            # main-layout (public wrapper)
│   │   ├── models/             # Domain models (config, staff, game, team, sponsor, recruitment)
│   │   ├── pipes/              # safe pipe
│   │   └── services/           # Domain services + api subdir
│   ├── app.config.ts           # Providers (zoneless, router, HTTP interceptors)
│   └── app.routes.ts           # Route definitions with lazy loading
├── shared/                     # Global shared code
│   ├── components/             # slider, shop-item, icon-svg, icon-link, logo-with-hover
│   ├── guards/                 # authGuard, permissionGuard, roleGuard
│   ├── headers/                # Header component
│   ├── interceptors/           # Auth interceptor (JWT token injection)
│   ├── layouts/                # MainLayout, footer
│   ├── models/                 # Core models (user, auth, icon-types)
│   └── services/
│       ├── api/                # ApiService, AuthService, UsersService, RolesService, ProfileService
│       ├── screen-size.service.ts
│       ├── analytics.service.ts     # Google Analytics (gtag)
│       └── runtime-config.service.ts # Runtime config from /assets/config.json
├── environments/               # Environment configs (dev/prod)
└── styles/                     # Global SCSS partials
```

### Key Patterns

- **Standalone components**: All components use `standalone: true`
- **Zoneless change detection**: `provideZonelessChangeDetection()` - state managed via Signals
- **Lazy loading**: All routes use `loadComponent()` for code splitting
- **Signals for state**: `AuthService` and `ConfigService` use `signal()`, `computed()`
- **Functional guards**: Guards use `CanActivateFn` pattern with `inject()`
- **Dual styling**: Bootstrap 5 for public pages, Angular Material scoped to `.mat-app` for admin
- **Skeleton loading**: Tout contenu dynamique (charge depuis l'API ou un service) doit afficher une **animation skeleton CSS** pendant le chargement. Ne jamais laisser de zone vide ou de spinner generique quand un skeleton est possible. Les skeletons doivent reproduire la forme du contenu attendu (texte, images, cartes, tableaux). Utiliser des classes CSS dediees (`.skeleton`, `.skeleton-text`, `.skeleton-card`, etc.) avec une animation `pulse` ou `shimmer`. Seul le contenu hardcode (labels statiques, navigation, titres de section) n'a pas besoin de skeleton.

### Route Structure

**Public routes** (wrapped in `MainLayout`):
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Homepage with hero, carousel |
| `/contact` | Contact | Contact form |
| `/shop` | Shop | Merchandise page |
| `/structure` | Structure | Organization structure |
| `/structure/sponsors` | Sponsors | Sponsors showcase |
| `/structure/recrutement` | Recruitment | Job listings |
| `/structure/recrutement/:id/:slug` | JobDetail | Job posting detail |
| `/structure/recrutement/postuler` | ApplicationForm | Job application |
| `/structure/equipes` | Equipes | Teams listing |
| `/structure/equipes/:teamId` | TeamDetail | Team detail |
| `/404` | NotFound | 404 page |

**Authentication routes:**
| Route | Component |
|-------|-----------|
| `/auth/login` | Login |

**Admin routes** (require `authGuard` + `permissionGuard`):
| Route | Permission | Description |
|-------|-----------|-------------|
| `/admin` | - | Dashboard |
| `/admin/users` | `users:read` | User CRUD |
| `/admin/roles` | `roles:read` | Role CRUD |
| `/admin/teams` | `teams:read` | Team CRUD |
| `/admin/games` | `games:read` | Game CRUD |
| `/admin/sponsors` | `sponsors:read` | Sponsor CRUD |
| `/admin/sponsors/:id/images` | `sponsors:read` | Images d'un sponsor |
| `/admin/sponsors/:id/liens` | `sponsors:read` | Liens d'un sponsor |
| `/admin/articles` | `articles:read` | Articles CRUD |
| `/admin/articles/categories` | `articles:read` | Catégories d'articles |
| `/admin/config` | `config:read` | Configuration |
| `/admin/staff` | `staff:read` | Staff CRUD |
| `/admin/recruitment` | `recrutement:read` | Recruitment CRUD |

**Profile route:**
| Route | Guard |
|-------|-------|
| `/profile` | `authGuard` |

### Services Architecture

**Global API Services** (`src/shared/services/api/`):
- `ApiService` - Base HTTP (get, post, put, patch, delete)
- `AuthService` - JWT auth via cookie `httpOnly`, avec **Signals** (userSignal, loadingSignal, initializedSignal)
  - Computed: `isAuthenticated`, `user`, `role`, `permissions`, `hasPermission()`
  - Methods: `login()`, `logout()`, `loadProfile()`, `refreshToken()`
- `UsersService`, `RolesService`, `ProfileService`

**Domain Services** (`src/app/shared/services/`):
- `ConfigService` - App config with **Signals** (page visibility, site settings)
- `UploadService` - Image upload with progress tracking
- `TeamsService`, `GamesService`, `StaffService`, `SponsorsService`
- `ContactService`, `RecruitmentService`

**Utility Services** (`src/shared/services/`):
- `ScreenSizeService` - Responsive breakpoint detection
- `AnalyticsService` - Google Analytics (gtag) with SPA page view tracking
- `RuntimeConfigService` - Loads `/assets/config.json` at startup

### Guards & Interceptors

**Guards:**
- `authGuard` - Requires authentication (token + profile loaded)
- `permissionGuard` - Checks route `data.permission` against user permissions
- `roleGuard` - Available but not used in current routes

**Interceptors:**
- `authInterceptor` - Adds `Authorization: Bearer {token}`, handles 401 (auto-logout)

### API Integration

- Base API service at `src/shared/services/api/api.service.ts`
- Dev proxy: `proxy.conf.json` rewrites `/api` to backend
- Production: Nginx proxies `/api/` and `/uploads/` to backend:3000
- Environment URLs: dev = `http://localhost:3000`, prod = `''` (relative)

---

## Styling

### Color Palette (DVG Brand)

```scss
$green: #32D299;         // Primary accent
$darkGreen: #28413B;     // Dark variant
$background: #0C0D0C;    // Main background (dark theme)
$light-black: #101111;   // Secondary background
$black: #090909;         // Deepest black
$error: #f44336;         // Error state
```

### Fonts

Toutes auto-hebergees en woff2 dans `src/assets/fonts/`, declarees dans `_typography.scss`.
**Aucune requete vers un domaine tiers.**

- **Bebas Neue** — titres, navigation (`--font-display`)
- **Nunito** — corps, labels, UI (`--font-body`), variable font 200-1000
- **Montserrat** — apercu du flocage sur la fiche produit uniquement. Donnee produit, pas police
  d'interface : elle ne suit pas le site s'il change de police
- **Material Icons** — icones du panel admin, par ligatures

### Style Architecture
- `_variables.scss` - Colors, breakpoints (mobile: 599px, tablet: 600px, desktop: 1025px)
- `_theme.scss` - Material theme scoped to `.mat-app` (admin only)
- `_typography.scss` - **Echelle typographique et roles de police du site public**
- `_spacing.scss` - **Echelle d'espacement et conteneurs de page**
- `_colors.scss` - **Roles de couleur du site public**
- `_buttons.scss` - **Familles de boutons**
- `_text.scss` - Utilitaires de texte (hover, alignement)
- `_containers.scss` - Conteneurs historiques, en cours de remplacement par `_spacing.scss`
- `_material-overrides.scss` - Material customizations
- `_admin-shared.scss` / `_admin-tokens.scss` - Admin-only

**Key insight:** Material Design is **isolated to admin panel** via `.mat-app` class. Public pages use Bootstrap + custom SCSS.

---

## Dialogue ou page routee — la regle du panel admin

Un formulaire d'administration passe en **dialogue** si et seulement si les trois conditions sont
reunies :

1. **8 controles maximum** — un upload d'image compte pour 1 ;
2. **aucun sous-editeur** — Editor.js, WYSIWYG, editeur de code, table editable ;
3. **aucune liste enfant geree dans le meme ecran** — pas de CRUD imbrique.

Si **une seule** condition est violee, c'est une **page routee** : `/admin/<module>/new` et
`/admin/<module>/edit/:id`.

**Tailles.** `sm` 440px pour 3 champs au plus, `md` 600px de 4 a 8 champs — et rien d'autre. **Tout
dialogue au-dela de 600px est le signal qu'il aurait du etre une page.** Les deux paliers
transitoires ont disparu d'`AdminDialogService` avec leur dernier appelant : `xl` (1200px) avec le
staff de coaching, `lg` (920px) avec les liens de sponsor. `AdminDialogSize` ne porte donc plus que
`sm` et `md` : **le type est le verrou de la regle**, demander un dialogue plus large ne compile
plus. Ne pas y ajouter de palier.

**Un dialogue ne contient jamais un second dialogue.** Le panel n'en comptait qu'un seul cas — la
gestion des categories d'articles, ouverte en `md` depuis la liste des articles et ouvrant a son
tour le formulaire de categorie en `sm`. Il est parti le 2026-08-02 : la liste est devenue
`/admin/articles/categories`, et le formulaire **reste** un dialogue `sm`. C'est le point important
de ce cas : ce n'est pas le dialogue enfant qui violait la regle, c'est son parent. Un dialogue
ouvert depuis une page est conforme des lors qu'il satisfait les trois conditions.

### Pourquoi cette regle existe

Le critere implicite qu'elle remplace etait « est-ce que ca tenait dans une modale quand je l'ai
ecrit », pas la complexite reelle. L'audit du 2026-07-29 avait releve quatre patterns coexistants
sans justification ecrite, et des ecarts que personne n'avait choisis : `recruitment` faisait 920px
et 11 champs avec scroll interne — en remplissant un champ long, on perdait de vue le bouton
Enregistrer — pendant qu'`article-editor` etait une page routee pour 4 champs de metadonnees.

Une page routee est **adressable** (une URL de support se partage), **navigable au clavier sans
piege de focus**, et compatible avec le **retour arriere du navigateur**. Aucun des six gros
dialogues d'origine n'offrait ces trois proprietes.

### Ce qu'une page de formulaire doit porter

- Un `<app-page-header>` avec un bouton de retour en `[leading]`.
- Une garde de sortie si le formulaire est modifie et non enregistre.
- Une entree dans `SUBPAGE_LABELS` (`src/app/admin/shared/admin-breadcrumb.ts`), sans quoi le fil
  d'Ariane s'arrete au module parent.
- Le retour a la liste apres enregistrement, la liste rechargeant ses donnees.
## Formalismes du site public — NON NEGOCIABLES

Ces regles viennent de l'EPIC-42. **Elles ne sont pas des recommandations.** Trois fichiers partages
existaient avant elles — `_text.scss`, `_containers.scss`, `DESIGN_SYSTEM.md` — tous documentes, tous
contournes, parce que rien n'obligeait a s'en servir. Le resultat : 15 blocs SCSS reimplementant le
meme titre, 7 largeurs de page, des gouttieres de 16, 24, 106 et 108px.

**Une regle tenue par la seule discipline n'est pas tenue.** D'ou des composants qui imposent, et non
des classes qu'on peut ignorer.

### 1. Typographie — `styles/_typography.scss`

Sept paliers, du plus grand au plus petit : `.heading-display`, `.heading-1` a `.heading-5`,
`.heading-label`. Modificateurs : `.heading--accent` (vert), `.heading--center`,
`.heading--sentence` (annule les capitales), `.heading__highlight` (fragment en degrade).

Ces classes portent un **contrat complet** : famille, graisse, casse, interlettrage, interligne,
couleur, marge. **Une page qui les utilise n'a plus AUCUNE propriete de titre a declarer.**

- Ne jamais redeclarer `font-family`, `letter-spacing`, `text-transform` sur un titre.
- Ne jamais ecrire `font-size` en dur sur un titre : prendre le palier le plus proche.
- `.heading--sentence` pour tout titre affichant une **donnee** (titre d'article, nom de produit) :
  le contrat force les capitales, ce qui ne convient pas a du contenu saisi par un redacteur.

### 2. Polices — roles, jamais de noms

```scss
font-family: var(--font-display);   // titres, navigation  (Bebas Neue)
font-family: var(--font-body);      // tout le reste       (Nunito)
```

**Deux roles, deux polices d'interface.** Ne plus jamais ecrire
`font-family: 'Bebas Neue', sans-serif;` dans une page : changer la police du site entier doit rester
une seule ligne a editer. `check-public-typography.mjs` echoue le build sur toute police litterale.

Une troisieme police demande une raison ecrite. Une seule existe : Montserrat, qui reproduit un
flocage fabricant sur la fiche produit — donnee produit, pas choix d'interface.

> Les proprietes personnalisees sont **sensibles a la casse**. Le projet a vecu avec 29 declarations
> `var(--font-Bebas-Neue)` qui ne referencaient rien et retombaient silencieusement sur l'heritage :
> les titres du corps des articles s'affichaient dans la police du parent. Le verrou interdit
> desormais de referencer un role inexistant.

### 3. Enveloppe de page — `dvg-page`

**Toute page publique passe par `<dvg-page>`.** Elle fournit la largeur, la gouttiere (26px) et le
rythme vertical (`clamp(40px, 6vw, 80px)`).

| `container` | Largeur | Pour |
|-------------|---------|------|
| `xs` | 960px | lecture et formulaire — contact, legales, candidature, 404, profil |
| `sm` | 1350px | contenu et listing — articles, equipes, recrutement, twitch, sponsors, boutique |
| `none` | — | hero pleine largeur — accueil, structure |

`md` et `lg` existent mais sont hors regle : les utiliser demande une raison ecrite.

**Ne jamais redeclarer dans une page** : `max-width` d'enveloppe, `padding-inline` de gouttiere,
`padding-block` de page, `margin: 0 auto` de centrage. Les largeurs INTERNES (carte, grille, colonne
de lecture) restent legitimes — ce ne sont pas des enveloppes.

### 4. Espacement — `styles/_spacing.scss`

`--space-2xs` 4, `--space-xs` 8, `--space-sm` 12, `--space-md` 16, `--space-lg` 24, `--space-xl` 32,
`--space-2xl` 40, `--space-3xl` 60, `--space-4xl` 80. Plus `--section-gap` et `--page-padding-block`.

**`20px` et `48px` n'ont volontairement PAS de palier**, bien qu'ils fussent parmi les valeurs les
plus employees. Une echelle qui contient toutes les valeurs existantes n'uniformise rien, elle les
enterine. Un espacement de 20px converge vers 16 ou 24 selon son role.

### 5. Couleurs — roles, jamais de noms

`--text`, `--text-muted`, `--accent`, `--accent-hover`, `--surface`, `--card-bg`, `--btn-border`.

**Ne jamais redeclarer ces tokens dans une page.** Huit fichiers le faisaient, avec les memes valeurs
ecrites tantot `#{$white}` tantot `#fff`.

Les tokens `--admin-*` sont **scopes admin** et ne doivent jamais etre consommes par une page
publique : un composant public qui en utiliserait un fonctionnerait en silence au lieu d'echouer.

### 6. Boutons — `styles/_buttons.scss`

Deux familles et un modificateur de forme :

- `.btn-surface` — fond carte, bordure fine, radius 10px
- `.btn-primary` — plein vert en degrade, pilule
- `.btn-secondary` — contour vert, pilule
- `.btn--square` — passe une pilule en radius 10px

La **forme est orthogonale au style**. Devant une nouvelle valeur de radius, ajouter un modificateur
de forme, jamais une troisieme famille.

### 7. Gabarits — ce qu'ils imposent, et pourquoi

| Composant | Impose |
|-----------|--------|
| `dvg-page` | largeur, gouttiere, rythme vertical |
| `dvg-page-header` | le titre est **toujours** un `<h1>` |
| `dvg-section` | le titre est **toujours** un `<h2>` |
| `dvg-breadcrumb` | `<nav><ol>`, `aria-current` sur le dernier maillon, repli mobile |

Ces contraintes rendent impossibles trois defauts reels de la codebase : un `<h2>` place avant le
`<h1>` de sa page, une page sans aucun titre, un `<h2>` deux fois plus grand que le `<h1>` qui le
precede.

**Aucun de ces composants n'expose de point d'extension libre.** Une version de `dvg-page-header` a
expose une variable CSS surchargeable pour accommoder un hero : cela rouvrait exactement la porte que
le composant devait fermer, et a ete retire. Si une variante devient necessaire, elle passe par un
**input type a valeurs fermees**, jamais par une variable libre.

### 8. Fil d'Ariane

**En tete de page, dans le conteneur, avant le titre.** Jamais en bas de page — il a existe une
version ou il se trouvait apres le bouton « Postuler », parce qu'il avait ete pose la ou etait
l'ancien lien de retour.

**Source unique** : la page construit UN tableau `BreadcrumbItem[]`, passe a la fois a
`SeoService.getBreadcrumbListJsonLd()` et a `<dvg-breadcrumb>`. Ne jamais en construire un second
pour l'affichage — le chemin affiche doit etre le chemin declare a Google.

Les pages de detail n'ont **pas** de bouton de retour : il duplique celui du navigateur et ment quand
le visiteur arrive directement, ce qui est le cas nominal sur un site travaille pour le referencement
et le partage social.

### Ce qui a echoue, pour ne pas le refaire

- **Tirer une echelle d'un document plutot que du code.** `DESIGN_SYSTEM.md` n'etait plus a jour ; une
  premiere echelle d'espacement en est sortie sans 12px ni 20px, parmi les valeurs les plus utilisees,
  et sans le palier tablette des conteneurs — ce qui aurait casse la mise en page de toute page migree.
- **Promouvoir un token sans verifier qu'il vaut la meme chose partout.** `--border` valait `$green`
  dans equipes et `$dark-green` ailleurs : il n'a pas ete promu.
- **Deplacer un element a la position de celui qu'il remplace** sans se demander si la position lui
  convient.
- **Ajouter un point d'extension pour un besoin hypothetique.** Il n'a jamais servi, et affaiblissait
  la garantie du composant.

---

## Rendu serveur (SSR) — ce qu'il impose au code

Depuis l'EPIC-29, les pages publiques sont **rendues par un serveur Node** avant d'être envoyées au
navigateur. C'est ce qui rend les previews sociales et le contenu lisibles par les crawlers qui
n'executent pas de JavaScript.

Procedure de deploiement et recette : `docs/deploiement-ssr.md`.

### Le code du perimetre public s'execute deux fois

Une fois sous Node, une fois dans le navigateur. **Sous Node, `window`, `document`, `localStorage`,
`navigator` et `matchMedia` n'existent pas.** Un acces non protege ne provoque pas une erreur
visible : il fait echouer le rendu de la page, qui retombe en rendu client — donc en HTML vide pour
les crawlers, **en repondant 200**.

Trois facons d'ecrire du code navigateur, par ordre de preference :

```ts
// 1. Comportement purement visuel ou interactif : afterNextRender ne s'execute
//    jamais cote serveur. C'est la forme la plus sure, aucune garde a ajouter.
afterNextRender(() => { window.addEventListener('scroll', onScroll); });

// 2. @HostListener sur window/document : jamais declenche cote serveur.
@HostListener('window:scroll') onScroll(): void { … }

// 3. Ailleurs — ngOnInit, ngAfterViewInit, constructeur, subscribe, effect,
//    provideAppInitializer — la garde est obligatoire.
if (isPlatformBrowser(inject(PLATFORM_ID))) { … }
```

Pour lire le DOM, preferer `inject(DOCUMENT)` au `document` global : Angular en fournit un cote
serveur, ce qui permet au code de fonctionner dans les deux contextes. C'est ainsi que `SeoService`
emet le lien canonique et le JSON-LD **dans le HTML envoye aux bots**.

> Un `provideAppInitializer` lisant `window.innerWidth` a ete introduit sur `develop` pendant
> l'EPIC-29 : il aurait fait echouer le rendu de **toutes** les pages. Ce n'est pas une faute
> d'inattention isolee, c'est le mode de defaillance normal de ce fichier.

### Toute route publique est rendue cote serveur par defaut

`app.routes.server.ts` enumere les **exclusions** — `/admin/**`, `/auth/**`, `/profile` — et tout le
reste passe en `RenderMode.Server`. Une nouvelle page publique est donc correctement rendue sans
qu'on ait a y penser. En revanche, **toute nouvelle section privee doit y etre ajoutee**, et son
chemin declare dans `nginx.conf` pour etre servi depuis `index.csr.html`.

### Les appels HTTP du rendu serveur

`environment.prod.ts` definit `apiUrl: ''` : les services emettent des URLs relatives, que Nginx
resout dans le navigateur. Sous Node, une URL relative n'a pas d'origine. Un intercepteur enregistre
**uniquement** dans `app.config.server.ts` les prefixe par `SSR_API_BASE_URL`. Ne jamais l'ajouter a
`app.config.ts`.

### Verifier une page en local

```bash
npx ng build --configuration production
SSR_API_BASE_URL=http://localhost:3000 SITE_URL=http://localhost:4000 \
  node dist/frontend/server/server.mjs
curl -s http://localhost:4000/<route> | grep -E '<title>|og:description'
```

Verifier que la reponse contient aussi **du contenu metier**, pas seulement les meta : un HTML
correct mais vide de donnees est le mode de defaillance le plus courant, et il passe inapercu.

## Securite - Regles Obligatoires

### XSS
- Angular sanitize automatiquement les templates
- **Ne jamais** utiliser `bypassSecurityTrustHtml/Url/Style/Script/ResourceUrl` sauf necessite absolue
- Utiliser le `SafePipe` existant uniquement pour le contenu HTML de confiance (admin)

### Tokens
- JWT stocke dans un cookie `httpOnly` gere exclusivement cote serveur — aucun token en `localStorage` ni en Signal cote client
- `AuthService` ne persiste que le profil utilisateur (`userSignal`, charge via `/api/auth/me`) ; l'authentification se fait via `credentials: 'include'` sur les requetes
- Refresh proactif toutes les 6h via `/api/auth/refresh` (le cookie est renouvele cote serveur)
- Auto-logout sur 401 (sauf endpoints `/api/auth/*`)

### CSP (Content Security Policy)
- Configuree dans Nginx (pas dans l'app Angular)
- Autorise Google Analytics (`googletagmanager.com`, `google-analytics.com`)
- `unsafe-inline` et `unsafe-eval` necessaires pour Angular (a surveiller)

### Secrets
- **Aucun secret** dans le code source
- La config runtime (`config.json`) ne contient que des IDs publics (GA ID)
- Les API keys doivent etre cote backend uniquement

---

## Code Style

- **Prettier** : 100 char width, single quotes, Angular HTML parser
- **SCSS** for all styles
- **OnPush** change detection where applicable
- `trackBy` with `@for` loops
- `async` pipe for observables in templates
- Prefer Signals for state management over BehaviorSubject

---

## Notes specifiques au projet

1. **French esports site** : Contenu et labels en francais
2. **Dual styling** : Bootstrap (public) + Material (admin scoped to `.mat-app`)
3. **Zoneless** : Pas de zone.js, utiliser Signals pour la reactivite
4. **Page visibility** : Les pages publiques (shop, contact, equipes, sponsors, recrutement) sont toggleables via la config admin
5. **Google Analytics** : Injecte a runtime via `entrypoint.sh` + `config.json`
6. **Upload images** : Max 5MB, formats JPEG/PNG/WebP/GIF/SVG, cached 30j par Nginx
7. **Dark theme** : Le site public est en theme sombre (#0C0D0C background)
8. **Register desactive** : La route `/auth/register` est commentee
9. **Breakpoints** : mobile < 599px, tablet 600-1024px, desktop >= 1025px, large >= 1280px
10. **Deployment** : tag-driven (`vX.Y.Z` pour PROD, `[DEPLOY]` dans titre PR pour PREPROD)
11. **Lighthouse SEO gate BLOQUANTE** : `.lighthouserc.json` impose `categories:seo >= 0.9` en `error`. Tout meta tag manquant, attribut `alt` absent ou tag deprecie fera echouer le job `lighthouse` en CI. URLs auditees : `/`, `/articles`, `/structure/equipes`, `/structure/recrutement`. Toute nouvelle page publique doit maintenir ce seuil.
12. **OG image fallback** : `entrypoint.sh` utilise `images4k.jpg` comme fallback si `OG_IMAGE` env var et l'API backend sont indisponibles. L'image doit rester dans `src/assets/img/banniere-charte-graphique/`.
