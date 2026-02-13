#!/bin/sh
set -e

# Génère le fichier de configuration runtime à partir des variables d'environnement
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "googleAnalyticsId": "${GOOGLE_ANALYTICS_ID:-}",
  "buildDate": "${BUILD_DATE:-}",
  "frontendVersion": "${FRONTEND_VERSION:-1.0.0}"
}
EOF

echo "Runtime config generated with GA ID: ${GOOGLE_ANALYTICS_ID:-<none>}, Build date: ${BUILD_DATE:-<none>}, Frontend version: ${FRONTEND_VERSION:-1.0.0}"

# Lance Nginx
exec nginx -g "daemon off;"
