# 🚀 Guide de Déploiement - Frontend Angular

## Vue d'ensemble du workflow

Ce projet utilise un pipeline CI/CD automatisé avec GitHub Actions pour construire, tester et déployer l'application frontend Angular.

## 🔄 Workflow de déploiement

### 1. Déclenchement automatique

Le pipeline CICD unifié se déclenche automatiquement sur :
- **Pull Requests** → Build + Tests + Image `unstable` + Rapport PR
- **Pull Requests avec `[DEPLOY]`** → Build + Tests + Image `unstable` + Déploiement PREPROD + Rapport PR
- **Push sur `main`** → Build + Tests + Image `RC` + Déploiement PREPROD
- **Tags `vXX.YY.ZZ`** → Build + Tests + Image `RELEASE` + Déploiement PROD

### 2. Étapes du pipeline optimisé

```mermaid
graph TD
    A[Code Push/PR] --> B[Trigger CICD]
    B --> C[Build Angular]
    C --> D{Build réussi?}
    D -->|Oui| E[ESLint]
    D -->|Oui| F[Semgrep Security]
    D -->|Non| O[PR Report]
    E --> H{Tous les scans OK?}
    F --> H
    H -->|Oui| I[Docker Build]
    H -->|Non| O[PR Report]
    I --> J[Push Image]
    J --> K{Type de build}
    K -->|PR avec [DEPLOY]| L[Deploy PREPROD]
    K -->|main| M[Deploy PREPROD]
    K -->|tag v*| N[Deploy PROD]
    K -->|PR| O[PR Report]
    L --> O
    M --> P[Workflow Status]
    N --> P
    O --> P
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#ffecb3
    style H fill:#ffecb3
    style I fill:#fff3e0
    style J fill:#e8f5e8
    style K fill:#fce4ec
    style L fill:#ffeb3b
    style M fill:#ffeb3b
    style N fill:#4caf50
    style O fill:#e3f2fd
    style P fill:#f3e5f5
```

### 3. Types d'images Docker

| Contexte | Tag | Description |
|----------|-----|-------------|
| **Pull Request** | `unstable` | Version de test |
| **Pull Request avec [DEPLOY]** | `unstable` | Version de test + Déploiement PREPROD |
| **Branche main** | `RC` | Release Candidate + Déploiement PREPROD |
| **Tag vXX.YY.ZZ** | `RELEASE` | Version de production + Déploiement PROD |

### 4. Déploiement sur demande

Pour déclencher un déploiement PREPROD depuis une Pull Request, ajoutez `[DEPLOY]` dans le titre :

**Exemples de titres valides :**
- `[DEPLOY] Ajout de nouvelles fonctionnalités`
- `Feature: Amélioration UX [DEPLOY]`
- `[DEPLOY] Fix: Correction du bug critique`

**Avantages :**
- Test en PREPROD avant merge sur main
- Validation rapide des changements
- Déploiement contrôlé par l'équipe

### 5. Déploiement PROD

**Déclenchement :** Push de tag `vX.Y.Z`

**Processus :**
1. ✅ Vérification des conditions CI
2. 🔧 Mise à jour configuration Coolify PROD
3. 🐳 Configuration de l'image Docker
4. 🚀 Lancement du déploiement
5. ⏳ Suivi en temps réel (max 5min)
6. ✅ Validation du déploiement

**Configuration :**
- **Image :** `ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend`
- **Tag :** `RELEASE` (version + SHA)
- **Environnement :** Production
- **URL :** https://www.teamdivergentes.fr

**Gestion d'erreurs :**
- Timeout après 5 minutes
- Retry automatique en cas d'échec temporaire
- Logs détaillés pour le debugging

## 🐳 Utilisation des images Docker

### Récupérer une image

```bash
# Image spécifique (par commit)
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:COMMIT_SHA

# Image par type de build
# Dernières versions (recommandé)
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:unstable
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:dev
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:RC
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:RELEASE

# Versions spécifiques avec SHA
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:1.0.0-unstable-abc1234
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:1.0.0-dev-abc1234
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:1.0.0-RC-abc1234
docker pull ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:1.0.0-RELEASE
```

### Lancer l'application

```bash
# Lancer l'image
docker run -d -p 8080:80 --name frontend ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend:unstable

# Accéder à l'application
open http://localhost:8080
```

### Commandes utiles

```bash
# Voir les logs
docker logs frontend

# Arrêter l'application
docker stop frontend

# Redémarrer l'application
docker restart frontend

# Supprimer l'application
docker rm frontend
```

## 🔧 Déploiement automatique

### Environnements

- **PREPROD** : Déploiement automatique sur `main`
- **PROD** : Déploiement automatique sur les tags `vXX.YY.ZZ`

### Configuration requise

Les secrets suivants doivent être configurés dans GitHub :

| Secret | Description |
|--------|-------------|
| `COOLIFY_URL` | URL de votre instance Coolify |
| `COOLIFY_API_KEY` | Clé API Coolify |
| `COOLIFY_APPID_PREPROD_FRONTEND` | ID de l'app PREPROD |
| `COOLIFY_APPID_PROD_FRONTEND` | ID de l'app PROD |
| `IMAGE_NAME` | Nom de l'image Docker |

## 📊 Monitoring et rapports

### Rapports automatiques

- **Pull Requests** : Rapport détaillé avec statuts et commandes Docker
- **README** : Mise à jour automatique avec informations de build
- **Logs** : Disponibles dans l'onglet "Actions" de GitHub

### Informations de build

Chaque build génère :
- ✅ Statut des tests (Build, ESLint, Semgrep)
- 🐳 Tags Docker (spécifique + workflow)
- 🚀 Statuts de déploiement (PREPROD, PROD)
- 📅 Date/heure du build
- 👤 Utilisateur qui a déclenché
- 🔗 Liens vers la documentation

### Rapport PR enrichi

Le rapport PR inclut maintenant :
- **Tableau complet** : Tous les statuts (Build, Lint, Semgrep, Docker, Déploiements)
- **Section déploiement** : Statuts en temps réel avec icônes appropriées
- **URLs des environnements** : Liens directs vers PREPROD et PROD
- **Instructions [DEPLOY]** : Guide pour déclencher les déploiements
- **Sections repliables** : Interface propre et organisée

## 🛠️ Développement local

### Prérequis

- Node.js 20+
- Docker (optionnel)

### Commandes de développement

```bash
# Installation
npm install

# Développement
npm start

# Build
npm run build

# Tests
npm run lint
npm test
```

### Docker local

```bash
# Construire l'image localement
docker build -t dvg-frontend:local .

# Lancer l'image
docker run -d -p 8080:80 --name dvg-frontend dvg-frontend:local
```

## 🔍 Dépannage

### Problèmes courants

1. **Build échoue** : Vérifiez les logs dans GitHub Actions
2. **Image non trouvée** : Vérifiez que le job Docker s'est exécuté
3. **Déploiement échoue** : Vérifiez les secrets Coolify
4. **Rapport PR manquant** : Vérifiez les permissions du workflow

### Logs utiles

- **GitHub Actions** : Onglet "Actions" du repository
- **Docker** : `docker logs frontend`
- **Coolify** : Interface d'administration Coolify

## 📚 Documentation complète

- [Dockerfile](Dockerfile) - Configuration de l'image
- [nginx.conf](nginx.conf) - Configuration du serveur web
- [devsecops.yml](devsecops.yml) - Configuration des gates de qualité et sécurité

---

*Pour plus de détails, voir [CI-CD pipeline](ci-cd-pipeline.md) et [Workflow détaillé](workflow-detailed.md).*
