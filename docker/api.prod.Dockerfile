# POA Backend - Production Dockerfile
# Multi-Stage Build for optimized production image

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma compatibility with Alpine
RUN apk add --no-cache openssl openssl-dev

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package files first (for better Docker layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client
RUN cd /app/packages/database && pnpm exec prisma generate

# Build shared package
RUN cd /app/packages/shared && pnpm run build

# Build the database package
RUN cd /app/packages/database && pnpm run build

# Build the API
RUN cd /app/apps/api && pnpm run build

# ============================================
# Stage 2: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL (required for Prisma at runtime)
RUN apk add --no-cache openssl

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy built files and dependencies from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy email templates to the correct location in dist
COPY --from=builder /app/apps/api/src/email/templates ./apps/api/dist/apps/api/src/email/templates

# Copy DB wait script for startup readiness check
COPY --from=builder /app/docker/wait-for-db.js ./docker/wait-for-db.js

WORKDIR /app/apps/api

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Run DB wait check, then migrations, then start the application
CMD ["sh", "-c", "node /app/docker/wait-for-db.js && cd /app/packages/database && npx prisma migrate deploy || echo 'WARNING: Migration failed, starting app anyway'; cd /app/apps/api && node dist/apps/api/src/main.js"]
