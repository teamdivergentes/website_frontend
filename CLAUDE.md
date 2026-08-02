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
- **Bebas Neue** - Display headings
- **Athiti** - Body text (200-700 weights)
- **Asar** - Decorative use
- **Material Icons** - Admin panel icons

### Style Architecture
- `_variables.scss` - Colors, breakpoints (mobile: 599px, tablet: 600px, desktop: 1025px)
- `_theme.scss` - Material theme scoped to `.mat-app` (admin only)
- `_text.scss` - Typography
- `_containers.scss` - Layout utilities
- `_material-overrides.scss` - Material customizations
- `_admin-shared.scss` - Admin-only styles

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

---

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
