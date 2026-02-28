# Frontend Angular - DVG

Application frontend Angular pour la TeamDivergentes.

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
