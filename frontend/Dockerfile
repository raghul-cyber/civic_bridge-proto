# ============================================================
# CivicBridge Frontend — Multi-Stage Dockerfile
# Stage 1: Build Next.js static export
# Stage 2: Serve via nginx:alpine
# ============================================================

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy source and build
COPY . .

# Build frontend application
RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:1.25-alpine AS production

LABEL maintainer="CivicBridge <admin@civicbridge.org>"
LABEL description="CivicBridge frontend — static site"

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files (Vite builds to /dist)
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
