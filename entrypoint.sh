#!/bin/sh
set -e

# Génère le fichier de configuration runtime à partir des variables d'environnement
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "googleAnalyticsId": "${GOOGLE_ANALYTICS_ID:-}"
}
EOF

echo "Runtime config generated with GA ID: ${GOOGLE_ANALYTICS_ID:-<none>}"

# Lance Nginx
exec nginx -g "daemon off;"
