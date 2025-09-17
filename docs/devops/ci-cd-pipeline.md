# 🔄 CI/CD Pipeline

## Vue d'ensemble

Le pipeline CI/CD unifié automatise la construction, les tests, la sécurité et le déploiement de l'application frontend Angular dans un seul workflow optimisé.

## 🏗️ Architecture du pipeline

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
    I --> J[Push to Registry]
    J --> K{Type de build}
    K -->|PR avec [DEPLOY]| L[Deploy PREPROD]
    K -->|main| M[Deploy PREPROD]
    K -->|tag vXX.YY.ZZ| N[Deploy PROD]
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

## 📋 Workflow Unifié

### CICD (`cicd.yml`)

**Déclenchement :**
- Push sur `main`
- Push sur les tags `vXX.YY.ZZ`
- Pull requests

**Jobs :**

| Job | Description | Dépendances | Conditions |
|-----|-------------|-------------|------------|
| `build` | Compilation Angular production | - | - |
| `lint` | Analyse ESLint | `build` | Si build réussit |
| `semgrep` | Analyse de sécurité | `build` | Si build réussit |
| `docker` | Build et push image Docker | `build`, `lint`, `semgrep` | Si tous les jobs précédents réussissent |
| `deploy-preprod` | Déploiement PREPROD | `build`, `lint`, `semgrep`, `docker` | Si CI réussit ET (main OU PR avec [DEPLOY]) |
| `deploy-prod` | Déploiement PROD | `build`, `lint`, `semgrep`, `docker` | Si CI réussit ET tag v* |
| `pr-report` | Génération rapport PR | `build`, `lint`, `semgrep`, `docker`, `deploy-preprod`, `deploy-prod` | Si PR |
| `workflow-status` | Vérification statut final | Tous les jobs | Toujours |

## 🏷️ Stratégie de tagging

| Contexte | Tag | Description |
|----------|-----|-------------|
| **Pull Request** | `unstable` | Version de test |
| **Branche develop** | `dev` | Version de développement |
| **Branche main** | `RC` | Release Candidate |
| **Tag vXX.YY.ZZ** | `RELEASE` | Version de production |

## 🔧 Configuration

### Variables d'environnement

```yaml
env:
  NODE_VERSION: 20
  BUILD_STATUS: ${{ needs.build.result }}
  LINT_STATUS: ${{ needs.lint.result }}
  SEMGREP_STATUS: ${{ needs.semgrep.result }}
  DOCKER_STATUS: ${{ needs.docker.result }}
  DEPLOY_PREPROD_STATUS: ${{ needs.deploy-preprod.result || 'skipped' }}
  DEPLOY_PROD_STATUS: ${{ needs.deploy-prod.result || 'skipped' }}
  IMAGE_TAG: ${{ needs.docker.outputs.image-tag }}
  WORKFLOW_TAG: ${{ needs.docker.outputs.workflow-tag }}
  TAG_SUFFIX: ${{ needs.docker.outputs.tag-suffix }}
```

### Configuration déploiement

Les paramètres de déploiement sont configurables dans `devsecops.yml` :

```yaml
deployment:
  timeout_minutes: 5          # Timeout maximum du déploiement
  check_interval_seconds: 10  # Intervalle entre les vérifications
  max_retries: 30            # Nombre maximum de tentatives
```

**Personnalisation :**
- ⏱️ **Timeout** : Ajustez selon la complexité de vos déploiements
- 🔄 **Intervalle** : Fréquence de vérification du statut
- 🔢 **Tentatives** : Calculées automatiquement (timeout ÷ intervalle)

### Secrets requis

| Secret | Description | Obligatoire |
|--------|-------------|-------------|
| `COOLIFY_URL` | URL instance Coolify | ✅ |
| `COOLIFY_API_KEY` | Clé API Coolify | ✅ |
| `COOLIFY_APPID_PREPROD_FRONTEND` | ID app PREPROD | ✅ |
| `COOLIFY_APPID_PROD_FRONTEND` | ID app PROD | ✅ |
| `IMAGE_NAME` | Nom de l'image Docker | ✅ |
| `SEMGREP_APP_TOKEN` | Token Semgrep (optionnel) | ❌ |

## 🛠️ Scripts automatisés

### Scripts dans `.github/scripts/`

| Script | Fonction | Usage |
|--------|----------|-------|
| `determine-tags.sh` | Détermine les tags Docker | Job `docker` |
| `generate-pr-report.sh` | Génère rapport PR | Job `pr-report` |
| `deploy.sh` | Script générique de déploiement | Jobs `deploy-preprod` et `deploy-prod` |
| `get-config-value.sh` | Utilitaire de récupération de configuration | Scripts de déploiement |

**Architecture simplifiée :**
- 🔧 **Script unique** : `deploy.sh` contient toute la logique de déploiement
- 🎯 **Usage direct** : Appelé directement depuis le workflow avec l'environnement en paramètre
- 📦 **Réutilisabilité** : Un seul script à maintenir pour tous les environnements
- ⚙️ **Configuration centralisée** : Paramètres de déploiement dans `devsecops.yml`

**Fonctionnalités des scripts de déploiement :**
- ✅ Configuration Coolify automatique
- ✅ Déclenchement du déploiement
- ✅ Suivi en temps réel (timeout configurable)
- ✅ Gestion d'erreurs robuste
- ✅ Logs détaillés pour le debugging
- ✅ Validation des environnements (PREPROD/PROD)
- ✅ Configuration flexible via `devsecops.yml`
| `publish-pr-comment.cjs` | Publie commentaire PR | Job `pr-report` |
| `check-infinite-loop.sh` | Évite les boucles infinies | Job `pr-report` |
| `update-readme.sh` | Met à jour README | Job `pr-report` |
| `commit-and-push.sh` | Commit et push sécurisé | Job `pr-report` |

## 🔍 Qualité et sécurité

### Tests automatisés

1. **Build Angular** : Compilation en mode production
2. **ESLint** : Analyse de qualité du code
3. **Semgrep** : Analyse de sécurité
4. **Docker** : Construction d'image sécurisée

### Critères de succès

- ✅ Build Angular réussi
- ✅ ESLint sans erreur
- ✅ Semgrep sans vulnérabilité critique
- ✅ Image Docker construite et poussée

### Mise à jour README

Le README est automatiquement mis à jour avec :

- **Informations de build** en temps réel
- **Statuts des analyses** (Build, ESLint, Semgrep)
- **Commandes Docker** prêtes à l'emploi
- **Métadonnées** du build

### Rapport PR enrichi

Le rapport PR inclut maintenant :

- **Statuts complets** : Build, Lint, Semgrep, Docker, Déploiements
- **Informations de déploiement** : Statuts PREPROD et PROD
- **URLs des environnements** : Liens directs vers les environnements
- **Déploiement sur demande** : Instructions pour `[DEPLOY]`
- **Sections repliables** : Interface propre et organisée

## 🚀 Déploiement

### Environnements

| Environnement | Déclencheur | Tag Docker | Description |
|---------------|-------------|------------|-------------|
| **PREPROD** | Push sur `main` | `RC` | Tests de recette |
| **PREPROD** | PR avec `[DEPLOY]` | `unstable` | Test sur demande |
| **PROD** | Tag `vXX.YY.ZZ` | `RELEASE` | Production |

### Déploiement sur demande

Pour déclencher un déploiement PREPROD depuis une Pull Request, ajoutez `[DEPLOY]` dans le titre :

- `[DEPLOY] Ajout de nouvelles fonctionnalités`
- `Feature: Amélioration UX [DEPLOY]`
- `[DEPLOY] Fix: Correction du bug critique`

### Optimisations

- **Scans conditionnels** : Lint et Semgrep ne s'exécutent que si le build réussit
- **Docker conditionnel** : L'image Docker n'est construite que si tous les scans précédents réussissent
- **Déploiement intelligent** : Les déploiements ne se déclenchent que si le CI complet réussit



---

*Pour plus de détails, voir [Déploiement](deployment.md) et [Workflow détaillé](workflow-detailed.md).*
