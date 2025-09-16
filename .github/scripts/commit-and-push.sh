#!/bin/bash

# Script pour commit et push sécurisé
# Usage: ./commit-and-push.sh <tag_suffix> <github_sha>

set -e

TAG_SUFFIX="$1"
GITHUB_SHA="$2"

if [[ -z "$TAG_SUFFIX" || -z "$GITHUB_SHA" ]]; then
    echo "❌ Usage: ./commit-and-push.sh <tag_suffix> <github_sha>"
    exit 1
fi

echo "🔧 Configuration Git..."
git config --local user.email "action@github.com"
git config --local user.name "GitHub Action"

# Déterminer la branche cible
if [[ "$GITHUB_HEAD_REF" != "" ]]; then
    BRANCH="$GITHUB_HEAD_REF"
else
    BRANCH="$GITHUB_REF_NAME"
fi

echo "🌿 Branche cible: $BRANCH"

# S'assurer qu'on est sur la bonne branche
if [[ "$(git branch --show-current)" != "$BRANCH" ]]; then
    echo "🔄 Basculement vers la branche $BRANCH..."
    git checkout -B "$BRANCH"
fi

echo "📝 Vérification des changements..."
git add README.md

if git diff --staged --quiet; then
    echo "ℹ️  Aucun changement à commiter"
else
    echo "💾 Commit des changements..."
    git commit -m "Update README with build info [$TAG_SUFFIX] - $GITHUB_SHA"
    
    echo "🚀 Push des changements..."
    git push origin "$BRANCH"
    
    echo "✅ Changements poussés avec succès"
fi
