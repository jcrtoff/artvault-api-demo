# Multi-stage build for the ArtVault API demo (Next.js SSR).
#
# Unlike artvault/frontend (Vite -> static -> nginx), this app runs a Node
# server: it uses server components / route handlers as a thin proxy so the
# ARTVAULT_API_KEY never reaches the browser (charter rule 3). That secret is
# therefore a RUNTIME env var — it is NOT a build arg and is NOT baked into the
# image. Only inject it at `docker run` / task definition time.
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (cached when package*.json unchanged)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Introduce build args after install so the dependency layer stays cached
ARG GIT_SHA=unknown
ENV NEXT_TELEMETRY_DISABLED=1

# Copy source and build the standalone bundle (next.config.ts: output:standalone)
COPY . .
RUN npm run build

# Production stage — minimal runtime, no node_modules beyond the standalone trace
FROM node:20-alpine AS runner

WORKDIR /app

ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=35105
ENV HOSTNAME=0.0.0.0
LABEL git_sha=$GIT_SHA

# Create non-root user with the UID/GID the cluster infrastructure expects
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nextjs -G nodejs

# Standalone output bundles only the server + its traced deps.
# static/ and public/ must be copied alongside it.
COPY --from=builder --chown=1001:1001 /app/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/.next/static ./.next/static
COPY --from=builder --chown=1001:1001 /app/public ./public

# Version file, mirroring artvault's images
RUN echo "$GIT_SHA" > /app/version.txt && chown 1001:1001 /app/version.txt

USER 1001:1001

EXPOSE 35105

# server.js is produced by Next's standalone output
CMD ["node", "server.js"]
