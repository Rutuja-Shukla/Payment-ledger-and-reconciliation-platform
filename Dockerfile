# syntax=docker/dockerfile:1
# ------------------------------------------------------------------------------
# Production Multi-Stage Dockerfile for React SPA Frontend
# ------------------------------------------------------------------------------

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (utilizing Docker layer caching)
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --frozen-lockfile || npm install

# Copy source code and config
COPY tsconfig.json vite.config.ts index.html metadata.json ./
COPY src/ ./src/
COPY public/ ./public/ 2>/dev/null || true

# Build production bundle
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Serve with Production Nginx
# ------------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# Install curl/wget for healthchecks
RUN apk add --no-cache curl wget

# Remove default nginx config and web root
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy custom reverse proxy & SPA configuration
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled SPA static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port (3000)
EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --spider -q http://127.0.0.1:3000/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
