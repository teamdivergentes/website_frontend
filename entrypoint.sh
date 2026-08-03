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

# Génère le fichier de configuration runtime à partir des variables d'environnement.
# Ce fichier n'est lu que par le navigateur : le rendu serveur lit les mêmes
# variables directement dans son environnement (RuntimeConfigService).
cat > /usr/share/nginx/html/assets/config.json << EOF
{
  "googleAnalyticsId": "${GOOGLE_ANALYTICS_ID:-}",
  "matomoUrl": "${MATOMO_URL:-}",
  "matomoSiteId": "${MATOMO_SITE_ID:-}",
  "siteUrl": "${SITE_URL:-}",
  "ogImage": "${OG_IMAGE:-}"
}
EOF

echo "Runtime config generated with GA ID: ${GOOGLE_ANALYTICS_ID:-<none>}, Matomo URL: ${MATOMO_URL:-<none>}, Matomo Site ID: ${MATOMO_SITE_ID:-<none>}, Site URL: ${SITE_URL:-<none>}"
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

# Injection des meta Open Graph dans le shell client.
#
# EPIC-29 : en outputMode server, le build ne produit plus index.html mais
# index.csr.html. Ce fichier n'est plus servi qu'aux routes en rendu client
# (/admin/**, /auth/**) — les pages publiques reçoivent un HTML rendu par Node,
# dont les meta sont produites par SeoService page par page.
INDEX_HTML="/usr/share/nginx/html/index.csr.html"

if [ ! -f "$INDEX_HTML" ]; then
  echo "FATAL: $INDEX_HTML introuvable — le build n'a pas produit le shell client attendu." >&2
  exit 1
fi

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

# ============================================================================
# EPIC-29 — démarrage supervisé du serveur de rendu et de Nginx
# ============================================================================
#
# Les deux process vivent dans le même conteneur. La règle est simple : si l'un
# des deux meurt, le conteneur meurt. Servir des 502 en silence pendant des
# jours, avec un conteneur marqué « healthy », est le scénario à éviter.

# L'image OG par défaut du rendu serveur suit la même résolution que celle du
# shell client, API backend comprise.
OG_IMAGE="$OG_IMAGE_VAL"
export OG_IMAGE

# Origine des appels HTTP émis pendant le rendu. BACKEND_URL sert de repli, ce
# qui évite d'avoir à déclarer une variable de plus côté Ansible.
SSR_API_BASE_URL="${SSR_API_BASE_URL:-$BACKEND_URL}"
export SSR_API_BASE_URL SITE_URL

echo "SSR: API base URL = ${SSR_API_BASE_URL}"

node /app/server/server.mjs &
SSR_PID=$!

# Attente active du port : démarrer Nginx avant que Node n'écoute ferait servir
# des 502 aux toutes premières requêtes après un déploiement.
i=0
until wget -q --spider "http://127.0.0.1:4000/health/ssr" 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "FATAL: le serveur SSR n'a pas repondu apres 60s" >&2
    kill "$SSR_PID" 2>/dev/null || true
    exit 1
  fi
  # Inutile d'attendre la fin du délai si le process est déjà mort.
  if ! kill -0 "$SSR_PID" 2>/dev/null; then
    echo "FATAL: le serveur SSR s'est arrete au demarrage" >&2
    exit 1
  fi
  sleep 1
done

echo "SSR: serveur de rendu pret sur 127.0.0.1:4000"

nginx -g "daemon off;" &
NGINX_PID=$!

# Surveillance des deux process.
#
# `wait -n` serait plus direct, mais son comportement n'est pas garanti sur le
# shell d'Alpine : une version qui l'ignore laisserait le conteneur tourner avec
# un Nginx mort — vérifié en recette, le conteneur restait « healthy » alors
# qu'il ne servait plus rien. Une boucle de surveillance explicite fonctionne
# partout et échoue de façon visible.
while kill -0 "$SSR_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 5
done

if ! kill -0 "$SSR_PID" 2>/dev/null; then
  echo "FATAL: le serveur SSR s'est arrete — arret du conteneur" >&2
else
  echo "FATAL: Nginx s'est arrete — arret du conteneur" >&2
fi

kill "$SSR_PID" "$NGINX_PID" 2>/dev/null || true
exit 1
