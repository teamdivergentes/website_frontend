#!/bin/sh
set -e

# Default backend URL (works for local docker-compose where service is named "backend")
BACKEND_URL=${BACKEND_URL:-http://backend:3000}
export BACKEND_URL

# Inject BACKEND_URL into nginx config (only substitute this variable, not $uri/$host/etc.)
envsubst '${BACKEND_URL}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Génère le fichier de configuration runtime à partir des variables d'environnement
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "googleAnalyticsId": "${GOOGLE_ANALYTICS_ID:-}"
}
EOF

echo "Runtime config generated with GA ID: ${GOOGLE_ANALYTICS_ID:-<none>}"
echo "Backend URL: ${BACKEND_URL}"

# Lance Nginx
exec nginx -g "daemon off;"
