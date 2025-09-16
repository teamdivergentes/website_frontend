#!/bin/bash

# Script pour mettre à jour le README avec les informations de build
# Usage: ./update-readme.sh <image-tag> <workflow-tag> <tag-suffix> <build-status> <lint-status> <semgrep-status>

set -e

IMAGE_TAG="$1"
WORKFLOW_TAG="$2"
TAG_SUFFIX="$3"
BUILD_STATUS="$4"
LINT_STATUS="$5"
SEMGREP_STATUS="$6"
GITHUB_SHA="$7"
GITHUB_HEAD_REF="$8"
GITHUB_ACTOR="$9"
BUILD_TIME="${10}"

# Couleurs pour les statuts
if [[ "$BUILD_STATUS" == "success" && "$LINT_STATUS" == "success" && "$SEMGREP_STATUS" == "success" ]]; then
    STATUS_EMOJI="✅"
    STATUS_TEXT="SUCCESS"
    STATUS_COLOR="green"
else
    STATUS_EMOJI="❌"
    STATUS_TEXT="FAILED"
    STATUS_COLOR="red"
fi

# Créer l'en-tête de build
cat > build_header.md << EOF
---
## 🚀 Informations de Build

| Information | Valeur |
|-------------|--------|
| **Statut** | ${STATUS_EMOJI} ${STATUS_TEXT} |
| **Type de build** | ${TAG_SUFFIX} |
| **Image Docker** | \`${IMAGE_TAG}\` |
| **Tag workflow** | \`${WORKFLOW_TAG}\` |
| **Commit** | \`${GITHUB_SHA}\` |
| **Branche** | \`${GITHUB_HEAD_REF}\` |
| **Build par** | ${GITHUB_ACTOR} |
| **Date/Heure** | ${BUILD_TIME} |

### 📊 Résultats des Analyses
- **Build Angular** : ${BUILD_STATUS}
- **ESLint** : ${LINT_STATUS}
- **Semgrep** : ${SEMGREP_STATUS}

### 🐳 Commandes Docker
\`\`\`bash
# Récupérer l'image
docker pull ${IMAGE_TAG}

# Lancer l'application
docker run -d -p 8080:80 --name frontend ${IMAGE_TAG}
\`\`\`

**Accès :** http://localhost:8080

---
EOF

# Lire le README existant
if [[ -f "README.md" ]]; then
    # Supprimer l'ancien en-tête de build s'il existe
    sed '/^---$/,/^---$/d' README.md > README_temp.md
    
    # Ajouter le nouvel en-tête au début
    cat build_header.md README_temp.md > README.md
    
    # Nettoyer
    rm README_temp.md build_header.md
else
    # Créer un nouveau README
    cat build_header.md > README.md
    rm build_header.md
fi

echo "README.md mis à jour avec les informations de build"
