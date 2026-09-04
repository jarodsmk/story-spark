# Multi-stage Dockerfile for StorySpark with Express API & MongoDB client
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 1: Build the React + TypeScript frontend
FROM base AS builder
COPY . .
RUN npm run build

# Stage 2: Production runtime image containing Node backend + static server / supervisor
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV MONGODB_URI=mongodb://mongodb:27017
ENV MONGODB_DB_NAME=storyspark

# Install nginx & gettext for serving frontend and reverse proxying
RUN apk add --no-cache nginx

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy node dependencies & server source code
COPY --from=base /app/node_modules ./node_modules
COPY package*.json ./
COPY src/server ./src/server
COPY tsconfig.json ./
COPY nginx.conf /etc/nginx/http.d/default.conf

# Add startup script to run both Node MongoDB backend and Nginx in container
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'npx tsx src/server/index.ts &' >> /app/start.sh && \
    echo 'nginx -g "daemon off;"' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["/app/start.sh"]

