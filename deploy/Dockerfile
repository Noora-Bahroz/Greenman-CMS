# syntax=docker/dockerfile:1

# ---- Greenman CMS (Payload 3 + Next.js) production image ----
# Runs the admin/editor + REST API and (via docker compose exec)
# the p6 publish/export pipeline against a persistent SQLite volume.

FROM node:22-bookworm-slim

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Build-time placeholder only. At runtime .env.production (env_file) overrides.
ENV PAYLOAD_SECRET=build-only-placeholder-not-used-at-runtime
ENV DATABASE_URI=file:/app/data/payload.db

WORKDIR /app

# 1) install dependencies (including devDeps so tsx publish/export run in-image)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 2) copy source, apply payload runtime patch, give runtime user ownership, then build
COPY . .
RUN node deploy/patch-payload.mjs \
    && chown -R node:node /app \
    && mkdir -p /app/data /app/media /app/scripts/phase6/out/data \
    && chmod +x /app/deploy/entrypoint.sh

USER node
RUN npm run build

EXPOSE 3000

ENTRYPOINT ["sh", "/app/deploy/entrypoint.sh"]
CMD ["npm", "start"]