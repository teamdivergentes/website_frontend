#!/bin/bash

# Script pour extraire une valeur du fichier devsecops.yml
# Usage: ./get-config-value.sh <chemin_yaml>
# Exemple: ./get-config-value.sh "project.version"

set -e

CONFIG_FILE="devsecops.yml"
YAML_PATH="$1"

if [[ -z "$YAML_PATH" ]]; then
    echo "❌ Erreur: Chemin YAML requis"
    echo "Usage: $0 <chemin_yaml>"
    echo "Exemple: $0 'project.version'"
    exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ Erreur: Fichier $CONFIG_FILE non trouvé"
    exit 1
fi

# Extraire la valeur en utilisant une approche simple
# Convertir le chemin YAML en pattern de recherche
# Ex: "project.version" -> "version:"
# Ex: "quality.eslint.enabled" -> "enabled:"

# Diviser le chemin par les points
IFS='.' read -ra PARTS <<< "$YAML_PATH"

# Prendre le dernier élément comme clé
KEY="${PARTS[-1]}"

# Chercher la ligne contenant la clé et extraire la valeur
VALUE=$(grep -E "^\s*${KEY}:" "$CONFIG_FILE" | head -1 | sed -E 's/.*:\s*"?([^"]*)"?.*/\1/' | tr -d ' ')

if [[ -z "$VALUE" ]]; then
    echo "❌ Erreur: Clé '$YAML_PATH' non trouvée dans $CONFIG_FILE"
    exit 1
fi

echo "$VALUE"
