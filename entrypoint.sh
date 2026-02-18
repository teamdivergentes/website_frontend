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
  "googleAnalyticsId": "${GOOGLE_ANALYTICS_ID:-}"
}
EOF

echo "Runtime config generated with GA ID: ${GOOGLE_ANALYTICS_ID:-<none>}"
echo "Backend URL: ${BACKEND_URL}"

# Génère robots.txt en fonction de l'environnement
SITE_URL="${SITE_URL:-https://teamdivergentes.fr}"

if [ "${ROBOTS_ALLOW:-false}" = "true" ]; then
  cat > /usr/share/nginx/html/robots.txt << ROBOTS
User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml
ROBOTS
  echo "robots.txt generated: Allow indexing"
else
  cat > /usr/share/nginx/html/robots.txt << 'ROBOTS'
User-agent: *
Disallow: /
ROBOTS
  echo "robots.txt generated: Disallow indexing"
fi

# Génère sitemap.xml depuis sitemap.json si l'indexation est autorisée
if [ "${ROBOTS_ALLOW:-false}" = "true" ]; then
  SITEMAP_JSON="/usr/share/nginx/html/sitemap.json"
  SITEMAP_XML="/usr/share/nginx/html/sitemap.xml"

  echo '<?xml version="1.0" encoding="UTF-8"?>' > "$SITEMAP_XML"
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' >> "$SITEMAP_XML"

  # Parse sitemap.json (Alpine has no jq by default, use sed/awk)
  # Each entry: { "path": "/...", "priority": "0.8", "changefreq": "weekly" }
  while IFS= read -r line; do
    path=$(echo "$line" | sed -n 's/.*"path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    priority=$(echo "$line" | sed -n 's/.*"priority"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    changefreq=$(echo "$line" | sed -n 's/.*"changefreq"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')

    if [ -n "$path" ]; then
      echo "  <url><loc>${SITE_URL}${path}</loc><changefreq>${changefreq:-weekly}</changefreq><priority>${priority:-0.5}</priority></url>" >> "$SITEMAP_XML"
    fi
  done < "$SITEMAP_JSON"

  echo '</urlset>' >> "$SITEMAP_XML"
  echo "sitemap.xml generated from sitemap.json ($(grep -c '<url>' "$SITEMAP_XML") URLs)"
fi

echo "X-Robots-Tag configured: ${ROBOTS_TAG}"

# Injection des meta Open Graph dans index.html
INDEX_HTML="/usr/share/nginx/html/index.html"

# Tente de récupérer les configs OG depuis l'API backend
OG_TITLE_VAL="${OG_TITLE:-Team Divergentes | Organisation Esportive}"
OG_DESC_VAL="${OG_DESCRIPTION:-Team Divergentes, organisation e-sportive créée en 2017. Découvrez nos joueurs, nos équipes et rejoignez l aventure !}"
OG_IMAGE_VAL="${OG_IMAGE:-}"

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

# Échapper les caractères spéciaux pour sed (délimiteur | utilisé ensuite)
OG_TITLE_ESC=$(printf '%s\n' "$OG_TITLE_VAL" | sed 's@[&|\\]@\\&@g')
OG_DESC_ESC=$(printf '%s\n' "$OG_DESC_VAL" | sed 's@[&|\\]@\\&@g')
OG_IMAGE_ESC=$(printf '%s\n' "$OG_IMAGE_VAL" | sed 's@[&|\\]@\\&@g')

# Remplacer les placeholders dans index.html
sed -i "s|__OG_TITLE__|${OG_TITLE_ESC}|g" "$INDEX_HTML"
sed -i "s|__OG_DESCRIPTION__|${OG_DESC_ESC}|g" "$INDEX_HTML"
sed -i "s|__OG_IMAGE__|${OG_IMAGE_ESC}|g" "$INDEX_HTML"

echo "OG meta tags injected: title='${OG_TITLE_VAL}', image='${OG_IMAGE_VAL}'"

# Lance Nginx
exec nginx -g "daemon off;"
