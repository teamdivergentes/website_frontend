#!/bin/sh
set -e

# Default backend URL (works for local docker-compose where service is named "backend")
BACKEND_URL=${BACKEND_URL:-http://backend:3000}
export BACKEND_URL

# Compute X-Robots-Tag value based on environment
if [ "${ROBOTS_ALLOW:-false}" = "true" ]; then
  ROBOTS_TAG="index, follow"
else
  ROBOTS_TAG="noindex, nofollow"
fi
export ROBOTS_TAG

# Inject variables into nginx config (only substitute these variables, not $uri/$host/etc.)
envsubst '${BACKEND_URL} ${ROBOTS_TAG}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Génère le fichier de configuration runtime à partir des variables d'environnement
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "googleAnalyticsId": "${GOOGLE_ANALYTICS_ID:-}",
  "matomoUrl": "${MATOMO_URL:-}",
  "matomoSiteId": "${MATOMO_SITE_ID:-}"
}
EOF

echo "Runtime config generated with GA ID: ${GOOGLE_ANALYTICS_ID:-<none>}, Matomo URL: ${MATOMO_URL:-<none>}, Matomo Site ID: ${MATOMO_SITE_ID:-<none>}"
echo "Backend URL: ${BACKEND_URL}"

# Génère robots.txt en fonction de l'environnement
SITE_URL="${SITE_URL:-https://teamdivergentes.fr}"

if [ "${ROBOTS_ALLOW:-false}" = "true" ]; then
  cat > /usr/share/nginx/html/robots.txt << ROBOTS
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/
Disallow: /profile
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
ROBOTS
  echo "robots.txt generated: Allow indexing (admin/auth/profile/api disallowed)"
else
  cat > /usr/share/nginx/html/robots.txt << 'ROBOTS'
User-agent: *
Disallow: /
ROBOTS
  echo "robots.txt generated: Disallow indexing"
fi

# Sitemap.xml is now served dynamically by the backend API
echo "sitemap.xml: served dynamically by backend at /sitemap.xml"

echo "X-Robots-Tag configured: ${ROBOTS_TAG}"

# Injection des meta Open Graph dans index.html
INDEX_HTML="/usr/share/nginx/html/index.html"

# Tente de récupérer les configs OG depuis l'API backend
OG_TITLE_VAL="${OG_TITLE:-Team Divergentes | Organisation Esportive}"
OG_DESC_VAL="${OG_DESCRIPTION:-Team Divergentes, organisation e-sportive créée en 2017. Découvrez nos joueurs, nos équipes et rejoignez l aventure !}"
OG_IMAGE_VAL="${OG_IMAGE:-https://teamdivergentes.fr/assets/img/banniere-charte-graphique/images4k.jpg}"

API_RESPONSE=$(wget -qO- "${BACKEND_URL}/api/config" 2>/dev/null || echo "")

if [ -n "$API_RESPONSE" ]; then
  # Extraire og_title
  API_OG_TITLE=$(echo "$API_RESPONSE" | sed -n 's/.*"key":"og_title"[^}]*"value":"\([^"]*\)".*/\1/p')
  if [ -n "$API_OG_TITLE" ]; then
    OG_TITLE_VAL="$API_OG_TITLE"
  fi

  # Extraire og_description
  API_OG_DESC=$(echo "$API_RESPONSE" | sed -n 's/.*"key":"og_description"[^}]*"value":"\([^"]*\)".*/\1/p')
  if [ -n "$API_OG_DESC" ]; then
    OG_DESC_VAL="$API_OG_DESC"
  fi

  # Extraire og_image
  API_OG_IMAGE=$(echo "$API_RESPONSE" | sed -n 's/.*"key":"og_image"[^}]*"value":"\([^"]*\)".*/\1/p')
  if [ -n "$API_OG_IMAGE" ]; then
    OG_IMAGE_VAL="$API_OG_IMAGE"
  fi

  echo "OG meta tags loaded from API"
else
  echo "API unavailable, using fallback env vars for OG meta tags"
fi

# Convertir les chemins relatifs d'image en URL absolues
if echo "$OG_IMAGE_VAL" | grep -q "^/uploads/"; then
  OG_IMAGE_VAL="${SITE_URL}${OG_IMAGE_VAL}"
fi

# Remplacer les placeholders dans index.html (awk gère les caractères spéciaux sans problème de délimiteur)
export OG_TITLE_VAL OG_DESC_VAL OG_IMAGE_VAL
awk '{
  line = $0
  while ((idx = index(line, "__OG_TITLE__")) > 0)
    line = substr(line, 1, idx-1) ENVIRON["OG_TITLE_VAL"] substr(line, idx + 12)
  while ((idx = index(line, "__OG_DESCRIPTION__")) > 0)
    line = substr(line, 1, idx-1) ENVIRON["OG_DESC_VAL"] substr(line, idx + 18)
  while ((idx = index(line, "__OG_IMAGE__")) > 0)
    line = substr(line, 1, idx-1) ENVIRON["OG_IMAGE_VAL"] substr(line, idx + 12)
  print line
}' "$INDEX_HTML" > "${INDEX_HTML}.tmp" && mv "${INDEX_HTML}.tmp" "$INDEX_HTML"

echo "OG meta tags injected: title='${OG_TITLE_VAL}', image='${OG_IMAGE_VAL}'"

# Lance Nginx
exec nginx -g "daemon off;"
