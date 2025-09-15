# Documentation des Variables CI/CD

## Vue d'ensemble

Ce document décrit les variables et configurations nécessaires pour le pipeline CI/CD du projet Angular avec les intégrations ESLint, CodeQL et Semgrep.

## Variables d'environnement

### Variables globales

| Variable | Description | Valeur par défaut | Obligatoire |
|----------|-------------|-------------------|-------------|
| `NODE_VERSION` | Version de Node.js utilisée | `20` | Non |

## Variables GitHub Actions

### Variables automatiques (disponibles par défaut)

| Variable | Description | Utilisation |
|----------|-------------|-------------|
| `${{ github.actor }}` | Nom d'utilisateur qui a déclenché l'action | Authentification Docker |
| `${{ github.repository }}` | Nom du repository (owner/repo) | Tags Docker |
| `${{ github.sha }}` | Commit SHA | Tags Docker |
| `${{ github.token }}` | Token d'authentification GitHub | Authentification Docker |

### Secrets GitHub (à configurer dans les paramètres du repository)

| Secret | Description | Obligatoire | Configuration |
|--------|-------------|-------------|---------------|
| `GITHUB_TOKEN` | Token d'authentification GitHub | Non (auto-généré) | Automatique |
| `COOLIFY_URL` | Url du serveur CG| Oui | Sinon pas de déploiement |
| `COOLIFY_API_KEY` | API Key (Read + Deploy) Deploy sur Read jsp mais pratique pr débug | Oui | Sinon pas de déploiement |
| `COOLIFY_APPID_PREPROD_FRONTEND` | APP ID PREPROD | Oui | Sinon pas de déploiement |
| `COOLIFY_APPID_PROD_FRONTEND` | APP ID PROD | Oui | Sinon pas de déploiement |

## Permissions requises

### Job CodeQL
```yaml
permissions:
  actions: read
  contents: read
  security-events: write
```

Ces permissions permettent à CodeQL de :
- Lire les actions GitHub
- Lire le contenu du repository
- Écrire les événements de sécurité (alertes)

## Configuration des actions

### ESLint

**Prérequis :**
- Script `lint` dans `package.json`
- Configuration ESLint (`.eslintrc.js`, `.eslintrc.json`, etc.)

**Variables utilisées :**
- `${{ env.NODE_VERSION }}` : Version de Node.js

### CodeQL

**Prérequis :**
- Aucun (utilise les règles par défaut)

**Variables utilisées :**
- `${{ matrix.language }}` : Langage analysé (JavaScript)
- `${{ env.NODE_VERSION }}` : Version de Node.js

**Configuration :**
- Langages supportés : JavaScript, TypeScript
- Stratégie : `fail-fast: false` (continue même si une langue échoue)

### Semgrep

**Prérequis :**
- Aucun (utilise les règles par défaut)

**Variables utilisées :**
- Aucune variable personnalisée

**Configuration :**
- Règles activées :
  - `p/security-audit` : Audit de sécurité
  - `p/owasp-top-ten` : Top 10 OWASP
  - `p/javascript` : Règles JavaScript
  - `p/typescript` : Règles TypeScript
  - `p/angular` : Règles Angular
- Format de sortie : SARIF pour GitHub Security

## Configuration du repository

### 1. Activer les alertes de sécurité

1. Aller dans **Settings** > **Security** > **Code security and analysis**
2. Activer **Dependency graph**
3. Activer **Dependabot alerts**
4. Activer **Code scanning**

### 2. Configurer les permissions

Les permissions sont automatiquement configurées dans le workflow, mais vous pouvez les ajuster selon vos besoins.

### 3. Scripts package.json requis

Assurez-vous que votre `package.json` contient :

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.js",
    "build": "ng build"
  }
}
```

## Dépannage

### Problèmes courants

1. **ESLint échoue** : Vérifiez que le script `lint` existe dans `package.json`
2. **CodeQL ne trouve pas de code** : Assurez-vous que le build produit des artefacts
3. **Semgrep ne génère pas de SARIF** : Vérifiez les permissions du repository

### Logs utiles

- **ESLint** : Consultez les logs du job `lint`
- **CodeQL** : Consultez les logs du job `codeql` et l'onglet Security
- **Semgrep** : Consultez les logs du job `semgrep` et l'onglet Security

## Sécurité

### Bonnes pratiques

1. **Ne jamais exposer de secrets** dans les logs
2. **Utiliser des tokens avec des permissions minimales**
3. **Réviser régulièrement les alertes de sécurité**
4. **Maintenir les dépendances à jour**

### Alertes de sécurité

Les alertes sont automatiquement créées dans :
- **Security** > **Code scanning alerts** (CodeQL)
- **Security** > **Code scanning alerts** (Semgrep)

## Maintenance

### Mise à jour des actions

Les actions utilisées sont :
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/upload-artifact@v4`
- `docker/login-action@v3`
- `docker/build-push-action@v6`
- `github/codeql-action/init@v3`
- `github/codeql-action/analyze@v3`
- `github/codeql-action/upload-sarif@v3`
- `returntocorp/semgrep-action@v1`

### Surveillance

- Surveillez les alertes de sécurité régulièrement
- Vérifiez les échecs de build
- Maintenez les dépendances à jour
