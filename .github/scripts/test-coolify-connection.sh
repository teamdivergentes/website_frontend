#!/bin/bash

# Script de test pour vérifier la connexion Coolify
# Usage: ./test-coolify-connection.sh <coolify-url> <coolify-api-key> <coolify-app-id>

set -e

if [ $# -ne 3 ]; then
    echo "❌ Usage: $0 <coolify-url> <coolify-api-key> <coolify-app-id>"
    exit 1
fi

COOLIFY_URL="$1"
COOLIFY_API_KEY="$2"
COOLIFY_APP_ID="$3"

echo "🔍 Test de connexion Coolify"
echo "URL: $COOLIFY_URL"
echo "App ID: $COOLIFY_APP_ID"
echo "API Key: ${COOLIFY_API_KEY:0:10}..."

# Test 1: Vérifier que l'API est accessible
echo "📡 Test 1: Vérification de l'accessibilité de l'API..."
health_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" "$COOLIFY_URL/api/health" || echo "HTTP_STATUS:000")

if [ $? -ne 0 ]; then
    echo "❌ Impossible de joindre l'API Coolify"
    exit 1
fi

http_status=$(echo "$health_response" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$http_status" = "200" ]; then
    echo "✅ API Coolify accessible"
else
    echo "⚠️ API Coolify répond avec le code: $http_status"
fi

# Test 2: Vérifier l'authentification
echo "🔐 Test 2: Vérification de l'authentification..."
auth_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -H "Authorization: Bearer $COOLIFY_API_KEY" "$COOLIFY_URL/api/v1/applications" || echo "HTTP_STATUS:000")

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la vérification de l'authentification"
    exit 1
fi

http_status=$(echo "$auth_response" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$http_status" = "200" ]; then
    echo "✅ Authentification réussie"
else
    echo "❌ Échec de l'authentification: HTTP $http_status"
    echo "Réponse: $(echo "$auth_response" | grep -v "HTTP_STATUS:")"
    exit 1
fi

# Test 3: Vérifier que l'application existe
echo "📱 Test 3: Vérification de l'application..."
app_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -H "Authorization: Bearer $COOLIFY_API_KEY" "$COOLIFY_URL/api/v1/applications/$COOLIFY_APP_ID" || echo "HTTP_STATUS:000")

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la vérification de l'application"
    exit 1
fi

http_status=$(echo "$app_response" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$http_status" = "200" ]; then
    echo "✅ Application trouvée"
    app_name=$(echo "$app_response" | grep -v "HTTP_STATUS:" | jq -r '.name // "N/A"')
    echo "Nom de l'application: $app_name"
else
    echo "❌ Application non trouvée: HTTP $http_status"
    echo "Réponse: $(echo "$app_response" | grep -v "HTTP_STATUS:")"
    exit 1
fi

# Test 4: Test de mise à jour de configuration
echo "🔧 Test 4: Test de mise à jour de configuration..."
update_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X PATCH "$COOLIFY_URL/api/v1/applications/$COOLIFY_APP_ID" \
  -H "Authorization: Bearer $COOLIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "docker_registry_image_name": "ghcr.io/teamdivergentes/website_frontend/dvg_web_frontend",
    "docker_registry_image_tag": "test-tag",
    "instant_deploy": false
  }' || echo "HTTP_STATUS:000")

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du test de mise à jour"
    exit 1
fi

http_status=$(echo "$update_response" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$http_status" = "200" ]; then
    echo "✅ Mise à jour de configuration réussie"
else
    echo "❌ Échec de la mise à jour: HTTP $http_status"
    echo "Réponse: $(echo "$update_response" | grep -v "HTTP_STATUS:")"
    exit 1
fi

echo "🎉 Tous les tests sont passés avec succès !"
