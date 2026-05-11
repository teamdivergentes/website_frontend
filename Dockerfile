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
# Stage 3: Production (Nginx)
# ================================
FROM nginx:alpine AS production

# Apply latest security patches
RUN apk update && apk upgrade --no-cache && rm -rf /var/cache/apk/*

# Create a non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# Copy custom nginx configuration as template (will be processed by entrypoint.sh)
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy the built application from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create cache directory for proxy uploads and set permissions
RUN mkdir -p /var/cache/nginx/uploads && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
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

# Use entrypoint to inject runtime config
ENTRYPOINT ["/entrypoint.sh"]
