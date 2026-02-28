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
- `AuthService` - JWT auth with **Signals** (tokenSignal, userSignal, loadingSignal)
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

## Nginx Configuration (Production)

**Proxy:**
- `/api/` -> `http://backend:3000` (priority `^~` prefix)
- `/uploads/` -> `http://backend:3000` with **30-day caching** (immutable)

**Security Headers:**
- X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
- HSTS (max-age=31536000)
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation, microphone, camera disabled
- CSP with Google Analytics allowlist

**Performance:**
- Gzip compression (level 6)
- Static asset caching: 1 year (js, css, images, fonts)
- Upload caching: 30 days (500MB zone)
- Rate limiting: `/api/auth/login` at 10 req/min

**SPA Routing:** `try_files $uri $uri/ /index.html`

---

## Docker Configuration

**Multi-stage build:**
1. Dependencies - `node:20-alpine`, `npm ci`
2. Builder - `ng build --configuration=production`
3. Production - `nginx:alpine`, non-root user `nginx-user` (uid 1001)

**entrypoint.sh:** Generates `/assets/config.json` with `GOOGLE_ANALYTICS_ID` env var, then starts Nginx.

**Health check:** `GET /health` returns "healthy"

---

## Environment Configuration

**Development** (`environment.ts`):
```typescript
production: false
apiUrl: 'http://localhost:3000'
```

**Production** (`environment.prod.ts`):
```typescript
production: true
apiUrl: ''  // Relative URLs through Nginx proxy
```

**Runtime** (generated by entrypoint.sh):
```json
{ "googleAnalyticsId": "G-XXXXXXXXXX" }
```

---

## CI/CD

Unified workflow (`.github/workflows/cicd.yml`). Docker images pushed to `ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend`.

- PR: Build + Lint + Semgrep + Docker build (tag `unstable-{branch}`)
- Push to main: All checks + Docker push (tag `PREPROD`) + Auto-deploy via Ansible
- Tag `v*.*.*`: All checks + Docker push (tag `RELEASE`) + Auto-deploy PROD
- `[DEPLOY]` in PR title: Manual PREPROD deployment

**Required secrets:** `SEMGREP_APP_TOKEN`, `DEPLOY_REPO`, `DEPLOY_TOKEN`

---

## Key Dependencies

| Package | Usage |
|---------|-------|
| `@angular/*` v20.2 | Framework (standalone, zoneless) |
| `@angular/material` v20.2 | Admin UI components |
| `@angular/cdk` v20.2 | Dialogs, overlays |
| `bootstrap` v5.3 | Public pages styling |
| `@fortawesome/angular-fontawesome` v3 | Font Awesome icons |
| `@ng-bootstrap/ng-bootstrap` v19 | Bootstrap Angular components |
| `rxjs` v7.8 | Reactive programming |

---

## Outils MCP et Plugins

### Context7

Utiliser `resolve-library-id` puis `query-docs` pour consulter la documentation a jour de :
- **Angular** : standalone components, signals, zoneless, routing, forms
- **Angular Material** : components, theming, CDK
- **RxJS** : operators, patterns
- **Bootstrap** : grid, utilities, components

### Playwright

Tester l'application via le navigateur headless :
- **Navigation** : Verifier le rendu des pages publiques et admin
- **Formulaires** : Tester login, contact, inscription job
- **Responsive** : Tester les breakpoints (mobile, tablet, desktop)
- **Erreurs** : Verifier l'absence d'erreurs console
- **A11y** : Utiliser `browser_snapshot` pour l'arbre d'accessibilite

### Chrome DevTools / Lighthouse

Auditer les performances et la qualite :
- **Performance** : `performance_start_trace` avec `reload=true, autoStop=true`
- **Core Web Vitals** : LCP < 2.5s, CLS < 0.1, FID < 100ms
- **Emulation** : Tester en mobile (`emulate` viewport), slow network, dark mode
- **Network** : Verifier les headers de securite, la compression gzip
- **Console** : Detecter les erreurs et warnings JS

### Figma

Pour le design-to-code :
- `get_design_context` : Generer du code Angular depuis les maquettes Figma
- `get_screenshot` : Comparer visuellement l'implementation vs le design
- `get_variable_defs` : Recuperer les variables de design (couleurs, spacings)

---

## SEO - Regles et Bonnes Pratiques

### Pages publiques

Chaque page publique doit avoir :
- **`<title>`** unique et descriptif (via `CustomTitleStrategy` + route data)
- **`<meta name="description">`** unique par page
- **Un seul `<h1>`** par page, hierarchie logique (h1 > h2 > h3)
- **Images** avec attributs `alt` descriptifs
- **URLs propres** : `/structure/equipes/lol` plutot que `/teams?id=1`

### Performance SEO
- **Lazy loading** des images hors viewport (`loading="lazy"`)
- **Code splitting** via lazy loading des routes (deja en place)
- **Compression gzip** (Nginx, deja configure)
- **Cache statique** 1 an sur les assets (deja configure)
- **Bundle budgets** : 2MB warning, 3MB error

### Donnees structurees
- **JSON-LD** pour l'organisation, les equipes, les offres d'emploi
- **Open Graph** meta tags pour le partage social
- Fichier `robots.txt` et `sitemap.xml` a la racine

### Limitations actuelles
- **Pas de SSR** (Angular 20+ SPA) - le contenu est rendu cote client
- **Title generique** dans `index.html` ("Frontend") - a ameliorer
- **Pas de meta description** dans `index.html`
- `lang="en"` dans `index.html` - devrait etre `lang="fr"`

---

## Securite - Regles Obligatoires

### XSS
- Angular sanitize automatiquement les templates
- **Ne jamais** utiliser `bypassSecurityTrustHtml/Url/Style/Script/ResourceUrl` sauf necessite absolue
- Utiliser le `SafePipe` existant uniquement pour le contenu HTML de confiance (admin)

### Tokens
- JWT stocke dans `localStorage` (via `tokenSignal`)
- L'interceptor ajoute automatiquement le Bearer token
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

## Models & Interfaces

**Core models** (`src/shared/models/`):
- `User`, `Role` - Auth/user types with `PermissionGroup`
- `LoginRequest`, `RegisterRequest`, `AuthResponse`
- `PaginatedResponse<T>`, `UserSearchParams`

**Domain models** (`src/app/shared/models/`):
- `ConfigResponse` - Key-value config
- `Game` - Game catalog (key, name, image, active)
- `Team`, `TeamWithMembers`, `TeamMember`, `TeamSocials`
- `StaffMember`, `StaffCategory` (ADMIN, HEADSTAFF, AMBASSADOR)
- `Sponsor`, `SponsorImage`, `SponsorLink`
- Recruitment models (post, application)

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

## Review Format

When reviewing code, use this structure:
1. Points positifs (what's done well)
2. Points a ameliorer (improvements needed)
3. Suggestions ou alternatives

Priority levels:
- **majeur** - Critical issues (security, accessibility, breaking change)
- **mineur** - Minor improvements (style, naming, optimization)
- **suggestion** - Optional enhancements

---

## Vibecoding Quality Orchestrator (VQO) - Agent BETA

Ce repo est audite par l'agent **BETA** dans le cadre du VQO (voir CLAUDE.md racine pour la methode complete).

### Domaines audites (frontend)

| Domaine | Poids | Criteres cles |
|---------|-------|---------------|
| **Architecture** | 20% | Standalone components, OnPush, Signals (input/output/computed), separation smart/dumb, DRY (format.utils centralise), patterns Angular 20+ (signal inputs, takeUntilDestroyed), reset des signals avant rechargement |
| **Qualite de code** | 15% | Pas de `any`, nommage coherent, pas de code mort, ARIA valide (pas de roles composites), aria-hidden sur icones decoratives, commentaires precis (pas trompeurs sur ViewEncapsulation), validation croisee des dates |
| **Testabilite** | 10% | Specs sur composants cles, provideZonelessChangeDetection() dans les tests, cas limites (null, vide, erreur), interactions testees (sort, date range), couverture des fix appliques |
| **Accessibilite** | 5% | aria-label sur sections et elements interactifs, aria-sort sur colonnes triables, aria-hidden sur icones decoratives, sr-only, role=progressbar avec valuenow/min/max, role=status sur loading, tabindex + keydown handlers, pas de roles ARIA invalides |

### Format des tickets BETA

```
ID       : BETA-001, BETA-019, BETA-031
Severite : CRITIQUE / MAJEUR / MINEUR
Fichier  : chemin absolu + ligne
Probleme : description precise
Fix      : code avant → code apres
```

### Patterns valides identifies (EPIC-9)

- `forkJoin` + `catchError(of(null))` par observable pour affichage de donnees partielles
- `takeUntilDestroyed(this.destroyRef)` sur toutes les souscriptions
- Reset de tous les data signals a `null` avant rechargement dans `loadAllData()`
- `Chart.register()` idempotent dans chaque composant standalone (pas de provider centralise)
- `ViewEncapsulation.None` + prefixage manuel par selecteur hote pour les overrides Material
- `computed()` pour les valeurs derivees (totalSessions, chartData, sortedPages)
- `aria-hidden="true"` sur toutes les `mat-icon` decoratives
- `role="status" aria-label="..."` sur les skeletons de chargement
- `tabindex="0"` + `keydown.enter` + `keydown.space` + `aria-sort` sur les `<th>` triables
