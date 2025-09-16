#!/bin/bash

# Script pour valider les gates de qualité basés sur devsecops.yml
# Usage: ./validate-quality-gates.sh

set -e

CONFIG_FILE="devsecops.yml"

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "❌ Erreur: Fichier $CONFIG_FILE non trouvé"
    exit 1
fi

echo "🔍 Validation des gates de qualité..."

# Fonction pour extraire une valeur du YAML
get_config_value() {
    local key="$1"
    grep -E "^\s*${key}:" "$CONFIG_FILE" | head -1 | sed -E 's/.*:\s*"?([^"]*)"?.*/\1/' | tr -d ' '
}

# Fonction pour valider un seuil
validate_threshold() {
    local name="$1"
    local current="$2"
    local max="$3"
    
    if [[ -z "$max" || "$max" == "null" ]]; then
        echo "⚠️  $name: Seuil non défini"
        return 0
    fi
    
    if (( current > max )); then
        echo "❌ $name: $current > $max (seuil dépassé)"
        return 1
    else
        echo "✅ $name: $current <= $max (OK)"
        return 0
    fi
}

# Rendre le script get-config-value.sh exécutable
chmod +x ./.github/scripts/get-config-value.sh

# Extraire les seuils de configuration
ESLINT_MAX_WARNINGS=$(get_config_value "max_warnings")
ESLINT_MAX_ERRORS=$(get_config_value "max_errors")
SEMGREP_MAX_CRITICAL=$(get_config_value "max_critical")
SEMGREP_MAX_HIGH=$(get_config_value "max_high")
SEMGREP_MAX_MEDIUM=$(get_config_value "max_medium")
SEMGREP_MAX_LOW=$(get_config_value "max_low")
NPM_AUDIT_MAX_CRITICAL=$(get_config_value "max_critical")
NPM_AUDIT_MAX_HIGH=$(get_config_value "max_high")
NPM_AUDIT_MAX_MEDIUM=$(get_config_value "max_medium")
NPM_AUDIT_MAX_LOW=$(get_config_value "max_low")
BUNDLE_MAX_SIZE_MB=$(get_config_value "max_size_mb")
BUNDLE_MAX_CHUNKS=$(get_config_value "max_chunks")
DOCKER_MAX_SIZE_MB=$(get_config_value "max_size_mb")
DOCKER_MAX_LAYERS=$(get_config_value "max_layers")
UNIT_COVERAGE_THRESHOLD=$(get_config_value "coverage_threshold")
UNIT_MAX_FAILURES=$(get_config_value "max_failures")

echo ""
echo "📊 Seuils de qualité configurés:"
echo "  - ESLint: max_warnings=$ESLINT_MAX_WARNINGS, max_errors=$ESLINT_MAX_ERRORS"
echo "  - Semgrep: critical=$SEMGREP_MAX_CRITICAL, high=$SEMGREP_MAX_HIGH, medium=$SEMGREP_MAX_MEDIUM, low=$SEMGREP_MAX_LOW"
echo "  - NPM Audit: critical=$NPM_AUDIT_MAX_CRITICAL, high=$NPM_AUDIT_MAX_HIGH, medium=$NPM_AUDIT_MAX_MEDIUM, low=$NPM_AUDIT_MAX_LOW"
echo "  - Bundle: max_size=${BUNDLE_MAX_SIZE_MB}MB, max_chunks=$BUNDLE_MAX_CHUNKS"
echo "  - Docker: max_size=${DOCKER_MAX_SIZE_MB}MB, max_layers=$DOCKER_MAX_LAYERS"
echo "  - Unit Tests: coverage=${UNIT_COVERAGE_THRESHOLD}%, max_failures=$UNIT_MAX_FAILURES"

echo ""
echo "✅ Configuration des gates de qualité chargée depuis $CONFIG_FILE"
echo "💡 Ces seuils seront utilisés par les scripts de validation du pipeline CI/CD"
