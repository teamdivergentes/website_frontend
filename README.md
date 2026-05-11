# Frontend Angular - DVG

[![CI](https://github.com/teamdivergentes/website_frontend/actions/workflows/cicd.yml/badge.svg?branch=main)](https://github.com/teamdivergentes/website_frontend/actions/workflows/cicd.yml)
[![E2E Full-Stack](https://github.com/teamdivergentes/website_frontend/actions/workflows/e2e-fullstack.yml/badge.svg?branch=main)](https://github.com/teamdivergentes/website_frontend/actions/workflows/e2e-fullstack.yml)
[![Quality Gate Status](https://sonarqube.tellebma.fr/api/project_badges/quality_gate?project=dvg-frontend&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Coverage](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=coverage&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Lines of Code](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=ncloc&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)

[![Maintainability](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=sqale_rating&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Reliability](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=reliability_rating&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Security](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=security_rating&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Bugs](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=bugs&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Vulnerabilities](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=vulnerabilities&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Code Smells](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=code_smells&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Technical Debt](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=sqale_index&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)
[![Duplicated Lines](https://sonarqube.tellebma.fr/api/project_badges/measure?project=dvg-frontend&metric=duplicated_lines_density&token=sqb_da1105da3a4600f76d69a743dc7d49fa3e6d387f)](https://sonarqube.tellebma.fr/dashboard?id=dvg-frontend)

[![Angular](https://img.shields.io/badge/Angular-20%2B-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com)
[![Material](https://img.shields.io/badge/Angular%20Material-20-607D8B?logo=materialdesign&logoColor=white)](https://material.angular.dev)
[![Playwright](https://img.shields.io/badge/Tests-Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-FE5196?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![semantic-release](https://img.shields.io/badge/%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079)](https://github.com/semantic-release/semantic-release)

Application frontend Angular pour la TeamDivergentes.

> **Qualité :** la CI bloque tout push qui casse la Quality Gate SonarQube (Sonar way). Voir [docs/SONARQUBE.md](./docs/SONARQUBE.md).

## 🚀 Démarrage rapide

### Prérequis
- Node.js 20+
- npm

### Installation
```bash
npm install
```

### Développement
```bash
npm start
```

### Build
```bash
npm run build
```

## 📚 Documentation

- [CI/CD](./docs/devops/DEVSECOPS.md)
- [Configuration Docker](Dockerfile)
- [Configuration Nginx](Nginx.conf)

## 🔧 Scripts disponibles

- `npm start` - Lance le serveur de développement
- `npm run build` - Build de production
- `npm run lint` - Vérification ESLint
- `npm test` - Tests unitaires

## CI/CD

Le projet utilise GitHub Actions pour l'intégration et le déploiement continus.

### Pipeline automatique

- **Pull Request** : Build + Lint + Semgrep + Docker + Rapport PR
- **Push sur main** : Pipeline complet + Déploiement automatique en PREPROD
- **Tag `v*.*.*`** : Pipeline complet + Déploiement automatique en PROD

### Déploiement manuel PREPROD

Ajouter `[DEPLOY]` dans le titre de la PR :
```
[DEPLOY] Feature: nouvelle fonctionnalité
```

### Secrets GitHub à configurer

Les secrets suivants doivent être configurés dans `Settings > Secrets and variables > Actions` du repository :

| Secret | Description |
|--------|-------------|
| `SEMGREP_APP_TOKEN` | Token d'authentification Semgrep AppSec Platform |
| `DEPLOY_REPO` | Repository cible pour le déploiement |
| `DEPLOY_TOKEN` | Token d'authentification pour le déploiement |

> `GITHUB_TOKEN` est fourni automatiquement par GitHub Actions (login GHCR, commentaires PR).

### Variables d'environnement CI

| Variable | Valeur | Usage |
|----------|--------|-------|
| `NODE_VERSION` | `20` | Version Node.js utilisée dans tous les jobs |
