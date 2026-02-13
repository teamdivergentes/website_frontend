#!/bin/sh
set -e

# Génère le fichier de configuration runtime à partir des variables d'environnement
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "googleAnalyticsId": "${GOOGLE_ANALYTICS_ID:-}"
}
EOF

echo "Runtime config generated with GA ID: ${GOOGLE_ANALYTICS_ID:-<none>}"

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

# Injecte le header X-Robots-Tag dans nginx.conf en fonction de l'environnement
if [ "${ROBOTS_ALLOW:-false}" = "true" ]; then
  ROBOTS_TAG="index, follow"
else
  ROBOTS_TAG="noindex, nofollow"
fi

# Remplace le placeholder dans nginx.conf
sed -i "s|{{ROBOTS_TAG}}|${ROBOTS_TAG}|g" /etc/nginx/nginx.conf
echo "X-Robots-Tag configured: ${ROBOTS_TAG}"

# Lance Nginx
exec nginx -g "daemon off;"
