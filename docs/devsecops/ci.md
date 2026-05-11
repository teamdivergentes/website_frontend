# CI/CD — Guide des jobs et quality gates

## Architecture des jobs

```
build
├── lint         (bloquant : 0 error + 0 warning ESLint)
├── test         (bloquant : seuils coverage Karma + Sonar QG)
│   └── sonarqube (bloquant : DVG-Strict Quality Gate)
├── semgrep      (bloquant sur main/tag uniquement)
├── e2e          (non-bloquant : warn on failure)
├── lighthouse   (bloquant : SEO >= 90, accessible >= 90)
└── mutation-test (non-bloquant : informatif)
    └── docker   (bloquant si lint+test+sonar passent)
        ├── scan-image
        ├── deploy-preprod (push develop ou PR [DEPLOY])
        └── deploy-prod   (tag vX.Y.Z uniquement)
```

## Jobs bloquants et leurs criteres

### `build`

- Angular production build (`ng build --configuration=production`)
- Echoue si erreur TypeScript ou bundle > 3MB

### `lint`

- `npm run lint` qui execute `eslint . --max-warnings=0`
- **Tout warning = echec** (pas seulement les erreurs)
- Config : `eslint.config.js` (flat config ESLint 10+)

### `test`

- `npm run test:coverage` (Karma + ChromeHeadlessCI)
- Seuils de couverture bloquants (dans `karma.conf.cjs`) :
  - statements >= 65%
  - branches >= 55%
  - functions >= 60%
  - lines >= 65%
- Objectif cible EPIC-19 : lines >= 80%, branches >= 70%

### `sonarqube`

- Analyse SonarQube + Quality Gate DVG-Strict
- Quality Gate conditions (New Code) :
  - 0 nouveau probleme de securite
  - Coverage >= 80% sur le nouveau code
  - <= 3% de lignes dupliquees sur le nouveau code
  - 100% des nouveaux security hotspots reviewes
- Voir `docs/SONARQUBE.md` pour les details complets

### `lighthouse`

- Audit Lighthouse CI sur 4 pages : `/`, `/articles`, `/structure/equipes`, `/structure/recrutement`
- Seuils bloquants : SEO >= 90 (error), Accessibility >= 90 (error)
- Seuils non-bloquants : Performance >= 70 (warn), Best Practices >= 80 (warn)
- Declenche sur push `develop`, push `main`, PR approuvee, `/run-lighthouse`, `workflow_dispatch`

### `docker`

- Construit et pousse l'image Docker sur GHCR
- Ne tourne PAS si lint ou test ou sonarqube ont echoue
- Condition : `sonarqube.result != 'failure' && sonarqube.result != 'cancelled'`

## Jobs non-bloquants (informatifs)

- `e2e` : Playwright, `continue-on-error: true`
- `mutation-test` : Stryker, `continue-on-error: true`
- `semgrep` : SAST, uniquement sur main/tag/dispatch — bloquant dans ce contexte

## Debugger un echec CI

### Echec lint

```bash
# Local
cd frontend
npm run lint

# Fixer automatiquement
npm run lint -- --fix
```

### Echec coverage

```bash
# Local (avec rapport HTML)
npm run test:coverage
open coverage/frontend/index.html
```

Les seuils sont dans `karma.conf.cjs` (section `coverageReporter.check.global`).

### Echec Sonar QG

Le job `sonarqube` dumpe automatiquement les conditions en echec dans les logs CI.
Voir aussi `docs/SONARQUBE.md` pour la procedure complete.

### Echec Lighthouse

```bash
# Local avec LHCI
npx lhci autorun --config=.lighthouserc.json
```

Verifier que les URLs auditees ont bien les meta tags SEO (og:title, og:description, og:image, canonical).

## Rapports disponibles

| Job | Artifact | Retention |
|-----|---------|-----------|
| test | `coverage-report` (lcov.info) | 1 jour |
| e2e | `playwright-report` + `playwright-test-results` | 7 jours |
| mutation-test | `stryker-mutation-report` | 7 jours |
| lighthouse | `lighthouse-results` | 7 jours |
| docker | image sur GHCR | variable |

## Branch protection `main` (a configurer dans GitHub)

Required status checks :
- `build`
- `lint`
- `test`
- `sonarqube`
- `docker`

Regles supplementaires :
- Require branches up-to-date before merge
- Require 1 approving review minimum
- Dismiss stale reviews on new push
