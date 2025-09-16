#!/bin/bash

# Script pour appliquer les gates de qualité basés sur devsecops.yml
# Usage: ./apply-quality-gates.sh <type> <valeur_actuelle>
# Exemple: ./apply-quality-gates.sh "eslint_warnings" 5

set -e

CONFIG_FILE="devsecops.yml"
GATE_TYPE="$1"
CURRENT_VALUE="$2"

if [[ -z "$GATE_TYPE" || -z "$CURRENT_VALUE" ]]; then
    echo "❌ Erreur: Type de gate et valeur actuelle requis"
    echo "Usage: $0 <type> <valeur_actuelle>"
    echo "Types disponibles: eslint_warnings, eslint_errors, semgrep_critical, semgrep_high, semgrep_medium, semgrep_low, npm_audit_critical, npm_audit_high, npm_audit_medium, npm_audit_low, bundle_size_mb, bundle_chunks, docker_size_mb, docker_layers, unit_coverage, unit_failures"
    exit 1
fi

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ Erreur: Fichier $CONFIG_FILE non trouvé"
    exit 1
fi

# Fonction pour extraire une valeur du YAML
get_config_value() {
    local key="$1"
    grep -E "^\s*${key}:" "$CONFIG_FILE" | head -1 | sed -E 's/.*:\s*"?([^"]*)"?.*/\1/' | tr -d ' '
}

# Rendre le script get-config-value.sh exécutable
chmod +x ./.github/scripts/get-config-value.sh

# Déterminer le seuil selon le type de gate
case "$GATE_TYPE" in
    "eslint_warnings")
        MAX_VALUE=$(get_config_value "max_warnings")
        GATE_NAME="ESLint Warnings"
        ;;
    "eslint_errors")
        MAX_VALUE=$(get_config_value "max_errors")
        GATE_NAME="ESLint Errors"
        ;;
    "semgrep_critical")
        MAX_VALUE=$(get_config_value "max_critical")
        GATE_NAME="Semgrep Critical"
        ;;
    "semgrep_high")
        MAX_VALUE=$(get_config_value "max_high")
        GATE_NAME="Semgrep High"
        ;;
    "semgrep_medium")
        MAX_VALUE=$(get_config_value "max_medium")
        GATE_NAME="Semgrep Medium"
        ;;
    "semgrep_low")
        MAX_VALUE=$(get_config_value "max_low")
        GATE_NAME="Semgrep Low"
        ;;
    "npm_audit_critical")
        MAX_VALUE=$(get_config_value "max_critical")
        GATE_NAME="NPM Audit Critical"
        ;;
    "npm_audit_high")
        MAX_VALUE=$(get_config_value "max_high")
        GATE_NAME="NPM Audit High"
        ;;
    "npm_audit_medium")
        MAX_VALUE=$(get_config_value "max_medium")
        GATE_NAME="NPM Audit Medium"
        ;;
    "npm_audit_low")
        MAX_VALUE=$(get_config_value "max_low")
        GATE_NAME="NPM Audit Low"
        ;;
    "bundle_size_mb")
        MAX_VALUE=$(get_config_value "max_size_mb")
        GATE_NAME="Bundle Size (MB)"
        ;;
    "bundle_chunks")
        MAX_VALUE=$(get_config_value "max_chunks")
        GATE_NAME="Bundle Chunks"
        ;;
    "docker_size_mb")
        MAX_VALUE=$(get_config_value "max_size_mb")
        GATE_NAME="Docker Size (MB)"
        ;;
    "docker_layers")
        MAX_VALUE=$(get_config_value "max_layers")
        GATE_NAME="Docker Layers"
        ;;
    "unit_coverage")
        MAX_VALUE=$(get_config_value "coverage_threshold")
        GATE_NAME="Unit Test Coverage (%)"
        ;;
    "unit_failures")
        MAX_VALUE=$(get_config_value "max_failures")
        GATE_NAME="Unit Test Failures"
        ;;
    *)
        echo "❌ Erreur: Type de gate '$GATE_TYPE' non reconnu"
        exit 1
        ;;
esac

# Valider le seuil
if [[ -z "$MAX_VALUE" || "$MAX_VALUE" == "null" ]]; then
    echo "⚠️  $GATE_NAME: Seuil non défini dans $CONFIG_FILE"
    exit 0
fi

if (( CURRENT_VALUE > MAX_VALUE )); then
    echo "❌ $GATE_NAME: $CURRENT_VALUE > $MAX_VALUE (seuil dépassé)"
    exit 1
else
    echo "✅ $GATE_NAME: $CURRENT_VALUE <= $MAX_VALUE (OK)"
    exit 0
fi
