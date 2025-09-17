#!/bin/bash

# Script de déploiement générique
# Usage: ./deploy.sh <environment> <image-tag> <coolify-url> <coolify-api-key> <coolify-app-id>

set -e

# Vérification des paramètres
if [ $# -ne 5 ]; then
    echo "❌ Usage: $0 <environment> <image-tag> <coolify-url> <coolify-api-key> <coolify-app-id>"
    echo "   Exemples:"
    echo "     $0 PREPROD 1.0.0-unstable-abc123 https://coolify.example.com token app-id"
    echo "     $0 PROD 1.0.0-abc123 https://coolify.example.com token app-id"
    exit 1
fi

ENVIRONMENT="$1"
FULL_IMAGE_TAG="$2"
COOLIFY_URL="$3"
COOLIFY_API_KEY="$4"
COOLIFY_APP_ID="$5"

# Extraire seulement la partie tag (après le dernier :)
IMAGE_TAG=$(echo "$FULL_IMAGE_TAG" | sed 's/.*://')
IMAGE_NAME=$(echo "$FULL_IMAGE_TAG" | sed 's/:.*//')

# Validation de l'environnement
case "$ENVIRONMENT" in
    "PREPROD"|"PROD")
        ;;
    *)
        echo "❌ Environnement invalide: $ENVIRONMENT"
        echo "   Valeurs acceptées: PREPROD, PROD"
        exit 1
        ;;
esac

echo "🚀 Déploiement $ENVIRONMENT"
echo "📦 Image complète: $FULL_IMAGE_TAG"
echo "📦 Nom de l'image: $IMAGE_NAME"
echo "📦 Tag: $IMAGE_TAG"
echo "🏢 App ID: $COOLIFY_APP_ID"

# Étape 1: Mise à jour de la configuration Coolify
echo "🔧 Mise à jour configuration $ENVIRONMENT..."
update_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH "$COOLIFY_URL/api/v1/applications/$COOLIFY_APP_ID" \
  -H "Authorization: Bearer $COOLIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"docker_registry_image_name\": \"$IMAGE_NAME\",
    \"docker_registry_image_tag\": \"$IMAGE_TAG\",
    \"instant_deploy\": true
  }")

if [ $? -ne 0 ]; then
    echo "❌ Échec de la mise à jour de la configuration (erreur réseau)"
    exit 1
fi

# Vérifier le code de statut HTTP
http_status=$(echo "$update_response" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$http_status" != "200" ]; then
    echo "❌ Échec de la mise à jour de la configuration: HTTP $http_status"
    echo "📋 Réponse: $(echo "$update_response" | grep -v "HTTP_STATUS:")"
    exit 1
fi

echo "✅ Configuration mise à jour (HTTP $http_status)"

# Étape 2: Déclenchement du déploiement
echo "🚀 Lancement du déploiement $ENVIRONMENT..."
deploy_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET "$COOLIFY_URL/api/v1/deploy?uuid=$COOLIFY_APP_ID&force=false" \
  -H "Authorization: Bearer $COOLIFY_API_KEY")

if [ $? -ne 0 ]; then
    echo "❌ Échec du déclenchement du déploiement (erreur réseau)"
    exit 1
fi

# Vérifier le code de statut HTTP
http_status=$(echo "$deploy_response" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$http_status" != "200" ]; then
    echo "❌ Échec du déclenchement du déploiement: HTTP $http_status"
    echo "📋 Réponse: $(echo "$deploy_response" | grep -v "HTTP_STATUS:")"
    exit 1
fi

echo "✅ Déploiement déclenché (HTTP $http_status)"
echo "📋 Réponse API: $(echo "$deploy_response" | grep -v "HTTP_STATUS:")"

# Extraction de l'UUID du déploiement
deploy_response_clean=$(echo "$deploy_response" | grep -v "HTTP_STATUS:")
deployment_uuid=$(echo "$deploy_response_clean" | jq -r '.deployments[0].deployment_uuid')

if [ -z "$deployment_uuid" ] || [ "$deployment_uuid" == "null" ]; then
    echo "❌ Impossible de récupérer l'UUID du déploiement"
    echo "📋 Réponse complète: $deploy_response_clean"
    exit 1
fi

echo "🆔 UUID du déploiement: $deployment_uuid"

# Étape 3: Suivi du déploiement
echo "⏳ Suivi du déploiement en cours..."

# Récupération de la configuration de timeout
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMEOUT_MINUTES=$(cd "$SCRIPT_DIR/../.." && "$SCRIPT_DIR/get-config-value.sh" "deployment.timeout_minutes" 2>/dev/null || echo "5")
CHECK_INTERVAL=$(cd "$SCRIPT_DIR/../.." && "$SCRIPT_DIR/get-config-value.sh" "deployment.check_interval_seconds" 2>/dev/null || echo "10")
MAX_RETRIES=$(cd "$SCRIPT_DIR/../.." && "$SCRIPT_DIR/get-config-value.sh" "deployment.max_retries" 2>/dev/null || echo "30")

echo "⏱️ Configuration: ${TIMEOUT_MINUTES}min timeout, vérification toutes les ${CHECK_INTERVAL}s"

for i in $(seq 1 $MAX_RETRIES); do
    status_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X GET "$COOLIFY_URL/api/v1/deployments/$deployment_uuid" \
      -H "Authorization: Bearer $COOLIFY_API_KEY")
    
    if [ $? -ne 0 ]; then
        echo "❌ Erreur réseau lors de la vérification du statut"
        continue
    fi
    
    # Vérifier le code de statut HTTP
    http_status=$(echo "$status_response" | grep "HTTP_STATUS:" | cut -d: -f2)
    if [ "$http_status" != "200" ]; then
        echo "❌ Erreur HTTP $http_status lors de la vérification du statut"
        continue
    fi
    
    status_response_clean=$(echo "$status_response" | grep -v "HTTP_STATUS:")
    status=$(echo "$status_response_clean" | jq -r '.status')
    echo "[$i/$MAX_RETRIES] Statut actuel: $status (HTTP $http_status)"
    
    case "$status" in
        "success")
            echo "✅ Déploiement $ENVIRONMENT réussi !"
            if [ "$ENVIRONMENT" = "PREPROD" ]; then
                echo "🌐 Environnement de pré-production disponible"
            else
                echo "🌐 Environnement de production disponible"
            fi
            exit 0
            ;;
        "failed")
            echo "❌ Déploiement $ENVIRONMENT échoué"
            echo "📋 Détails de l'erreur:"
            echo "$status_response_clean" | jq -r '.error // "Aucun détail d'\''erreur disponible"'
            exit 1
            ;;
        "in_progress"|"pending"|"building"|"deploying")
            echo "⏳ Déploiement en cours..."
            ;;
        *)
            echo "⚠️ Statut inconnu: $status"
            ;;
    esac
    
    sleep $CHECK_INTERVAL
done

echo "⏱️ Timeout: le déploiement n'a pas pu être terminé dans les ${TIMEOUT_MINUTES} minutes"
echo "🔍 Vérifiez manuellement le statut dans Coolify"
exit 1
