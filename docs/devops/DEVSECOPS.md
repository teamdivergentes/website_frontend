# 🚀 DevOps - Frontend Angular

## Vue d'ensemble

Cette section documente l'ensemble de l'infrastructure DevOps pour le frontend Angular, incluant la CI/CD, le déploiement, ~~la sécurité et la maintenance~~.

## 📋 Table des matières

### 🔄 [CI/CD Pipeline](ci-cd-pipeline.md)
- Architecture du pipeline
- Workflows GitHub Actions
- Gestion des environnements
- Stratégies de déploiement

### 🐳 [Déploiement](deployment.md)
- Guide de déploiement
- Configuration des environnements
- Commandes Docker
- Dépannage


## 🏗️ Architecture DevOps

```mermaid
graph TB
    A[Code Push] --> B[CI Pipeline]
    B --> C[Build Angular]
    B --> D[Tests & Linting]
    B --> E[Security Scan]
    C --> F[Docker Build]
    D --> F
    E --> F
    F --> G[Image Registry]
    G --> H[Deployment]
    H --> I[PREPROD]
    H --> J[PROD]
    
    K[PR Reports] --> L[Documentation]
    M[README Updates] --> L
    N[Security Alerts] --> L
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style G fill:#fff3e0
    style H fill:#e8f5e8
    style L fill:#fce4ec
```

## 🔧 Outils utilisés

| Catégorie | Outils | Description |
|-----------|--------|-------------|
| **CI/CD** | GitHub Actions | Pipeline d'intégration continue |
| **Build** | Angular CLI, npm | Compilation et packaging |
| **Tests** | ESLint, Semgrep | Qualité et sécurité du code |
| **Containers** | Docker, nginx | Containerisation et serveur web |
| **Registry** | GitHub Container Registry | Stockage des images |
| **Deploy** | Coolify API | Déploiement automatique |
| **Monitoring** | GitHub API | Rapports et métriques |
