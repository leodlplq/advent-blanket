# syntax=docker/dockerfile:1

# Build: native deps may need compiling (better-sqlite3 has prebuilt musl
# binaries for common platforms, but the toolchain guarantees a fallback).
# ---- Build stage ----
FROM node:24-alpine AS build
RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm@10

WORKDIR /app
# Copy the lockfile manifests first so pnpm layer-caches the dependencies.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Runtime stage ----
FROM node:24-alpine AS runner
# su-exec: drop from root to the app user in the entrypoint, after fixing
# permissions on the mounted data volume.
RUN apk add --no-cache su-exec

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    DATA_DIR=/data \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Minimal standalone server (bundles traced node_modules, incl. the
# better-sqlite3 binary built above).
COPY --from=build /app/.next/standalone ./
# The two folders server.js does NOT copy by itself:
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
# Runtime artifacts referenced via process.cwd(): migrations + backup tool.
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts/backup.mjs ./scripts/backup.mjs

RUN mkdir -p /data \
    && addgroup -S app \
    && adduser -S app -G app \
    && chown -R app:app /app /data
COPY --chmod=0755 scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
