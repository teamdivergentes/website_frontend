#!/bin/bash

# Script pour vérifier et éviter les boucles infinies
# Usage: ./check-infinite-loop.sh

set -e

echo "🔍 Vérification des boucles infinies..."

# Vérifier si le dernier commit est déjà un commit automatique
LAST_COMMIT_MSG=$(git log -1 --pretty=%B)

if [[ "$LAST_COMMIT_MSG" == *"Update README with build info"* ]]; then
    echo "⚠️  Dernier commit détecté comme mise à jour automatique du README"
    echo "🛑 Arrêt pour éviter une boucle infinie"
    exit 0
fi

echo "✅ Aucune boucle détectée, continuation du workflow"
