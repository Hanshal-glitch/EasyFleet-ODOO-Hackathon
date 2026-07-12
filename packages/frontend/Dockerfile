# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/
RUN npm ci

# Copy source
COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

# Build
RUN npm run build --workspace=@transport-ops/frontend

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Add nginx config for SPA routing if needed (optional, fallback to index.html)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]