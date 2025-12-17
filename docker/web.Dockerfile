FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl openssl-dev

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/

# Install dependencies - use --no-frozen-lockfile to allow updates for hoisting config changes
RUN pnpm install

# Copy source code
COPY . .

# Generate Prisma Client from root workdir
RUN cd /app/packages/database && pnpm exec prisma generate || true

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run next using pnpm from web directory
WORKDIR /app/apps/web
CMD ["pnpm", "dev"]
