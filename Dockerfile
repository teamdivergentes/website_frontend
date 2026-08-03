# ================================
# Stage 1: Dependencies
# ================================
FROM node:22-alpine AS dependencies

WORKDIR /app

# Copy package files + .npmrc (legacy-peer-deps required for @ng-bootstrap@19 + Angular 20.x)
COPY package*.json .npmrc ./

# Install all dependencies (cached if package-lock unchanged)
RUN npm ci --no-audit --no-fund

# ================================
# Stage 2: Builder
# ================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the Angular application for production
RUN npm run build -- --configuration=production

# ================================
# Stage 3: Production (Node SSR + Nginx)
# ================================
#
# EPIC-29 — l'image passe de nginx:alpine a node:22-alpine + nginx.
# Nginx reste en frontal : il porte la CSP, les headers de securite, le rate
# limiting, les 7 redirects 301 SEO, le proxy /api et /uploads et le cache des
# uploads. Les reimplementer en Express aurait ete un chantier a part entiere
# pour un gain nul, avec un risque eleve de regression de securite.
FROM node:22-alpine AS production

# Nginx et les outils dont l'entrypoint a besoin (envsubst, wget)
RUN apk update && apk upgrade --no-cache && \
    apk add --no-cache nginx gettext libcap && \
    rm -rf /var/cache/apk/*

# L'image nginx:alpine officielle posait cette capability pour nous ; le paquet
# apk, non. Sans elle, Nginx lance en utilisateur non-root ne peut pas ecouter
# sur le port 80 (« bind() to 0.0.0.0:80 failed (13: Permission denied) »).
#
# L'alternative — ecouter sur un port > 1024 — obligerait a modifier le
# docker-compose, le role Ansible website et le label Traefik. La decision PO
# etant que l'infra ne bouge pas, on garde le port 80 et on donne au seul
# binaire nginx le droit minimal de s'y lier.
RUN setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx

# Create a non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

WORKDIR /app

# Copy custom nginx configuration as template (will be processed by entrypoint.sh)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Assets statiques, servis directement par Nginx depuis le disque : ils ne
# passent jamais par Node.
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Bundle de rendu serveur.
COPY --from=builder /app/dist/frontend/server /app/server

# Les dependances de production sont necessaires au runtime Node (express,
# @angular/ssr et leurs transitives), contrairement a l'image Nginx precedente
# qui ne servait que des fichiers statiques.
COPY --from=builder /app/package.json /app/package-lock.json /app/.npmrc /app/
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create cache directories for proxy uploads and SSR microcache, and set permissions.
# /var/lib/nginx est le prefixe du paquet nginx d'Alpine — different de celui de
# l'image nginx:alpine. Sans ces droits, Nginx echoue au demarrage sur
# « could not open error log file », avant meme de lire notre configuration.
RUN mkdir -p /var/cache/nginx/uploads /var/cache/nginx/ssr \
             /var/lib/nginx/logs /var/lib/nginx/tmp && \
    chown -R nginx-user:nginx-user /var/lib/nginx && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx && \
    chown -R nginx-user:nginx-user /app && \
    touch /etc/nginx/nginx.conf && \
    chown nginx-user:nginx-user /etc/nginx/nginx.conf && \
    chown nginx-user:nginx-user /etc/nginx/nginx.conf.template && \
    mkdir -p /run && \
    chown -R nginx-user:nginx-user /run && \
    chmod 755 /run

# Switch to non-root user
USER nginx-user

# Expose port 80
EXPOSE 80

# La sonde passe par Nginx, qui relaie vers Node : elle valide donc la chaine
# entiere. Sonder Node directement laisserait passer un Nginx mort — constate en
# recette, le conteneur restait « healthy » sans plus rien servir.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1/health || exit 1

# Use entrypoint to inject runtime config
ENTRYPOINT ["/entrypoint.sh"]
