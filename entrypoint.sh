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
if [ "${ROBOTS_ALLOW:-false}" = "true" ]; then
  cat > /usr/share/nginx/html/robots.txt << 'ROBOTS'
User-agent: *
Allow: /
Sitemap: https://teamdivergentes.fr/sitemap.xml
ROBOTS
  echo "robots.txt generated: Allow indexing"
else
  cat > /usr/share/nginx/html/robots.txt << 'ROBOTS'
User-agent: *
Disallow: /
ROBOTS
  echo "robots.txt generated: Disallow indexing"
fi

# Génère sitemap.xml si l'indexation est autorisée
if [ "${ROBOTS_ALLOW:-false}" = "true" ]; then
  cat > /usr/share/nginx/html/sitemap.xml << 'SITEMAP'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://teamdivergentes.fr/</loc><priority>1.0</priority></url>
  <url><loc>https://teamdivergentes.fr/contact</loc><priority>0.7</priority></url>
  <url><loc>https://teamdivergentes.fr/structure</loc><priority>0.8</priority></url>
  <url><loc>https://teamdivergentes.fr/structure/equipes</loc><priority>0.8</priority></url>
  <url><loc>https://teamdivergentes.fr/structure/sponsors</loc><priority>0.6</priority></url>
  <url><loc>https://teamdivergentes.fr/structure/recrutement</loc><priority>0.7</priority></url>
</urlset>
SITEMAP
  echo "sitemap.xml generated"
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
