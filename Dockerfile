# Multi-stage build for Angular application
# Stage 1: Build the Angular application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --silent

# Copy source code
COPY . .

# Build the Angular application for production
RUN npm run build -- --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the built application from builder stage
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

# Copy public assets if they exist
COPY --from=builder /app/public /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
