# POA Frontend - Production Dockerfile
# Multi-Stage Build with Next.js Standalone Output

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Install dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl openssl-dev libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Generate Prisma Client
RUN cd /app/packages/database && pnpm exec prisma generate

# Build arguments for Next.js public env vars (must be set at build time)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN cd /app/apps/web && pnpm run build

# ============================================
# Stage 3: Runner (Production)
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies for sharp and wget for health checks
RUN apk add --no-cache libc6-compat wget

# Install sharp globally for Next.js image optimization
RUN npm install -g sharp@0.33.2

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Tell Next.js where to find sharp
ENV NEXT_SHARP_PATH=/usr/local/lib/node_modules/sharp

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy standalone build output
# The standalone folder contains the minimal Node.js server
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start Next.js standalone server
CMD ["node", "apps/web/server.js"]
