# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular 20+ frontend application for TeamDivergentes (DVG), a French esports/gaming organization website. Uses zoneless change detection, Angular Signals, and standalone components.

## Common Commands

```bash
# Development server (opens browser automatically)
npm start

# Production build
npm run build

# Lint (ESLint)
npm run lint

# Run all tests
npm test

# Run a single test file
npx ng test --include="**/path-to-file.spec.ts"
```

## Architecture

### Source Structure

```
src/
├── app/                    # Main application code
│   ├── admin/             # Admin panel (protected routes)
│   │   ├── components/    # Admin-specific components (sidebar, header)
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── layout/        # Admin layout wrapper
│   │   └── pages/         # Admin CRUD pages (users, roles, teams, sponsors, config, staff)
│   ├── auth/              # Authentication pages (login, register)
│   ├── data/              # Static data files (mock data)
│   ├── pages/             # Public pages (home, contact, shop, structure, equipes, sponsors)
│   ├── shared/            # App-level shared code (admin-focused)
│   │   ├── components/    # Reusable admin components (image-upload)
│   │   ├── guards/        # Re-exports from src/shared
│   │   ├── models/        # Admin-specific models (config, staff)
│   │   ├── pipes/         # Custom pipes (safe pipe)
│   │   └── services/      # Admin services (config, staff, upload)
│   ├── app.config.ts      # App providers (zoneless, router, HTTP interceptors)
│   └── app.routes.ts      # Route definitions with lazy loading
├── shared/                 # Global shared code (used across app)
│   ├── components/        # UI components (slider, shop-item, icon-svg, icon-link)
│   ├── guards/            # Route guards (auth, role, permission)
│   ├── headers/           # Header component
│   ├── interceptors/      # HTTP interceptors (auth token)
│   ├── layouts/           # Layout components (main-layout, footer)
│   ├── models/            # Core models (user, auth, icon-types)
│   └── services/api/      # API services (api, auth, users)
├── environments/          # Environment configs
└── styles/                # Global SCSS
```

### Key Patterns

- **Standalone components**: All components use `standalone: true`
- **Zoneless change detection**: Uses `provideZonelessChangeDetection()` - state managed via Signals
- **Lazy loading**: All routes use `loadComponent()` for code splitting
- **Signals for state**: `AuthService` uses Angular Signals (`signal()`, `computed()`) for reactive state
- **Functional guards**: Guards use `CanActivateFn` pattern with `inject()`

### Route Structure

- `/auth/*` - Public authentication routes
- `/admin/*` - Protected admin routes (requires `authGuard`, pages require `permissionGuard`)
- `/` - Public site with `MainLayout` wrapper

### API Integration

- Base API service at `src/shared/services/api/api.service.ts`
- Auth interceptor adds JWT token to requests
- API URL configured in `src/environments/environment.ts` (default: `http://localhost:3000`)
- Proxy configured in `proxy.conf.json` to rewrite `/api` to backend

## Code Style

- **Prettier** config in `package.json`: 100 char width, single quotes, Angular HTML parser
- **SCSS** for styles (configured in `angular.json`)
- Use `OnPush` change detection where applicable
- Prefer `trackBy` with `@for` loops
- Use `async` pipe for observables in templates

## Review Format

When reviewing code, use this structure:
1. Points positifs (what's done well)
2. Points a ameliorer (improvements needed)
3. Suggestions ou alternatives

Priority levels:
- **majeur** - Critical issues
- **mineur** - Minor improvements
- **suggestion** - Optional enhancements
