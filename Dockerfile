FROM node:20-alpine AS builder

WORKDIR /app

# Install native compilation dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev

# Copy workspace package declarations
COPY package.json tsconfig.base.json package-lock.json ./
COPY packages/seed-profiles/package.json ./packages/seed-profiles/
COPY packages/coherency-engine/package.json ./packages/coherency-engine/
COPY packages/wasm-exif/package.json ./packages/wasm-exif/
COPY packages/database-schema/package.json ./packages/database-schema/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install

# Copy source code
COPY . .

# Build all workspace packages and applications
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget python3 make g++

COPY --from=builder /app ./
RUN npm rebuild better-sqlite3
RUN mkdir -p /app/data

EXPOSE 8080
ENV PORT=8080
ENV DB_PATH=/app/data/exifguard_public.db
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

CMD ["node", "apps/api/dist/server.js"]
