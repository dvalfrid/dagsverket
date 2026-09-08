# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- dependencies -------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build ------------------------------------------------------------------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Dummy DB URL: `next build` only needs the generated client, not a live DB.
ENV DATABASE_URL="file:/tmp/build.db"
RUN npx prisma generate && npm run build

# --- runtime --------------------------------------------------------------
FROM base AS runner
LABEL org.opencontainers.image.source="https://github.com/dvalfrid/dagsverket" \
      org.opencontainers.image.description="Dagsverket — family dashboard" \
      org.opencontainers.image.licenses="MIT"
ENV NODE_ENV=production
COPY --from=build /app ./
RUN mkdir -p /data && chown -R node:node /app /data
USER node

EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
ENTRYPOINT ["sh", "./docker/entrypoint.sh"]
