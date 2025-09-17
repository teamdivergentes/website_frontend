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

# Générer le rapport avec sections repliables
cat << EOF > pr_report.md
## ${STATUS_EMOJI} Rapport de Build - Frontend Angular

### 📊 Statut global
**${OVERALL_STATUS}**

<details>
<summary>🔧 Détails du build</summary>

| Composant | Statut | Description |
|-----------|--------|------------|
| **Build** | $BUILD_STATUS | Build Angular production |
| **Linter** | $LINT_STATUS | Vérification qualité de code ESLint |
| **Sécurité** | $SEMGREP_STATUS | Analyse de sécurité Semgrep |
| **Docker** | $DOCKER_STATUS | Build de l'image conteneur |

</details>

<details>
<summary>🐳 Image Docker</summary>

EOF

# Vérifier si Docker a réussi
if [[ "$DOCKER_STATUS" == "success" && "$IMAGE_TAG" != "N/A" ]]; then
cat << EOF >> pr_report.md
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
EOF
else
cat << EOF >> pr_report.md
❌ **Build Docker échoué**

L'image Docker n'a pas pu être construite. Vérifiez les logs du job Docker pour plus de détails.

**Causes possibles :**
- Échec des dépendances précédentes (Build, Lint, Semgrep)
- Erreur dans le Dockerfile
- Problème de permissions

EOF
fi

cat << EOF >> pr_report.md

</details>

<details>
<summary>📋 Informations sur le build</summary>

- **Commit :** \`${GITHUB_SHA}\`
- **Branche :** \`${GITHUB_HEAD_REF}\`
- **Déclenché par :** ${GITHUB_ACTOR}
- **Date du build :** $(date -u '+%Y-%m-%d %H:%M:%S UTC')

</details>

<details>
<summary>🚀 Déploiement</summary>

EOF

# Vérifier si c'est une PR avec [DEPLOY] dans le titre
if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]]; then
  # Récupérer le titre de la PR depuis l'API GitHub
  PR_TITLE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$GITHUB_REPOSITORY/pulls/$GITHUB_EVENT_NUMBER" | \
    jq -r '.title')
  
  if [[ "$PR_TITLE" == *"[DEPLOY]"* ]]; then
    # Récupérer les URLs des environnements depuis devsecops.yml
    PREPROD_URL=$(chmod +x ./.github/scripts/get-config-value.sh && ./.github/scripts/get-config-value.sh "environments.preprod.url" 2>/dev/null || echo "https://preprod.teamdivergentes.fr")
    
    cat << EOF >> pr_report.md
✅ **Déploiement PREPROD déclenché**

Cette PR contient \`[DEPLOY]\` dans le titre, le déploiement PREPROD a été automatiquement déclenché.

**Environnement PREPROD :**
- **URL :** [${PREPROD_URL}](${PREPROD_URL})
- **Status :** ${{ needs.deploy-preprod.result || 'En cours...' }}
- **Image :** \`${WORKFLOW_TAG}\`

**Accès :** [${PREPROD_URL}](${PREPROD_URL})
EOF
  else
    cat << EOF >> pr_report.md
ℹ️ **Aucun déploiement automatique**

Pour déclencher un déploiement PREPROD, ajoutez \`[DEPLOY]\` dans le titre de cette PR.

**Exemples :**
- \`[DEPLOY] Ajout de nouvelles fonctionnalités\`
- \`Feature: Amélioration UX [DEPLOY]\`
- \`[DEPLOY] Fix: Correction du bug critique\`
EOF
  fi
else
  cat << EOF >> pr_report.md
ℹ️ **Déploiement automatique**

Le déploiement se fait automatiquement selon le type de build :
- **Push sur main** → Déploiement PREPROD
- **Tag v\*.** → Déploiement PROD
EOF
fi

cat << EOF >> pr_report.md

</details>

---
*Ce rapport a été généré automatiquement par le pipeline CI/CD.*
EOF

echo "✅ Rapport PR généré: pr_report.md"
