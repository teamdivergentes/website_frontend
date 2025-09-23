# Multi-stage build for Angular application
# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm install --no-audit --no-fund

# Copy source code
COPY . .

# Build the Angular application for production
RUN npm run build -- --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Labels Docker pour les métadonnées de build
LABEL org.opencontainers.image.title="DVG Web Frontend"
LABEL org.opencontainers.image.description="Frontend Angular pour l'application DVG Web - Build unstable (SUCCESS)"
LABEL org.opencontainers.image.version="v1.0.0"
LABEL org.opencontainers.image.revision="abc123"
LABEL org.opencontainers.image.source="https://github.com/teamdivergente/frontend"
LABEL org.opencontainers.image.created="2025-09-16 18:48:08 UTC"
LABEL org.opencontainers.image.authors="tellebma"
LABEL org.opencontainers.image.url="https://github.com/teamdivergentes/website_frontend"
LABEL org.opencontainers.image.documentation="https://github.com/teamdivergentes/website_frontend#readme"
LABEL org.opencontainers.image.licenses="UNLICENSED"
LABEL build.status="SUCCESS"
LABEL build.type="unstable"
LABEL build.image.tag="test-image"
LABEL build.workflow.tag="v1.0.0"
LABEL build.branch="feature/test"
LABEL build.commit="abc123"
LABEL build.actor="tellebma"
LABEL build.angular="success"
LABEL build.lint="success"
LABEL build.semgrep="success"
LABEL build.time="2025-09-16 18:48:08 UTC"

# Create a non-root user for security
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built application from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copy public assets if they exist
COPY --from=builder /app/public /usr/share/nginx/html

# Install curl before switching to non-root user
RUN apk add --no-cache curl

# Set proper ownership and permissions
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    mkdir -p /run && \
    chown -R nginx-user:nginx-user /run && \
    chmod 755 /run

# Switch to non-root user
USER nginx-user

# Expose port 80
EXPOSE 80
# Health check using wget instead of curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
