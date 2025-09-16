#!/bin/bash

# Script pour générer le rapport de Pull Request
# Usage: ./generate-pr-report.sh

set -e

# Vérifier les variables requises
if [[ -z "$BUILD_STATUS" || -z "$LINT_STATUS" || -z "$SEMGREP_STATUS" || -z "$DOCKER_STATUS" ]]; then
    echo "❌ Variables manquantes pour générer le rapport PR"
    exit 1
fi

# Déterminer le statut global
if [[ "$BUILD_STATUS" == "success" && "$LINT_STATUS" == "success" && "$SEMGREP_STATUS" == "success" && "$DOCKER_STATUS" == "success" ]]; then
    OVERALL_STATUS="✅ SUCCESS"
    STATUS_EMOJI="🎉"
else
    OVERALL_STATUS="❌ FAILED"
    STATUS_EMOJI="⚠️"
fi

# Générer le rapport
cat << EOF > pr_report.md
## ${STATUS_EMOJI} Rapport de Build - Frontend Angular

### 📊 Statut global
**${OVERALL_STATUS}**

### 🔧 Détails du build
| Composant | Statut | Description |
|-----------|--------|------------|
| **Build** | $BUILD_STATUS | Build Angular production |
| **Linter** | $LINT_STATUS | Vérification qualité de code ESLint |
| **Sécurité** | $SEMGREP_STATUS | Analyse de sécurité Semgrep |
| **Docker** | $DOCKER_STATUS | Build de l'image conteneur |

### 🐳 Image Docker
**Tag de l'image :** \`${IMAGE_TAG}\`
**Tags disponibles :**
- **Tag SHA :** \`${IMAGE_TAG}\` (commit complet)
- **Tag workflow :** \`${WORKFLOW_TAG}\` (${TAG_SUFFIX})
- **Tag version :** \`${VERSION_TAG}\` (version + type + SHA)

**Commandes pour récupérer l'image :**
\`\`\`bash
# Dernière version du type (recommandé)
docker pull ${WORKFLOW_TAG}

# Version spécifique avec SHA
docker pull ${VERSION_TAG}

# Version complète avec SHA complet
docker pull ${IMAGE_TAG}
\`\`\`

**Commandes pour lancer l'image :**
\`\`\`bash
# Avec le tag workflow (recommandé)
docker run -d -p 8080:80 --name frontend ${WORKFLOW_TAG}

# Avec le tag version
docker run -d -p 8080:80 --name frontend ${VERSION_TAG}

# Avec le tag SHA complet
docker run -d -p 8080:80 --name frontend ${IMAGE_TAG}
\`\`\`

**Accès :** http://localhost:8080

### 📋 Informations sur le build
- **Commit :** \`${GITHUB_SHA}\`
- **Branche :** \`${GITHUB_HEAD_REF}\`
- **Déclenché par :** ${GITHUB_ACTOR}
- **Date du build :** $(date -u '+%Y-%m-%d %H:%M:%S UTC')

---
*Ce rapport a été généré automatiquement par le pipeline CI/CD.*
EOF

echo "✅ Rapport PR généré: pr_report.md"
