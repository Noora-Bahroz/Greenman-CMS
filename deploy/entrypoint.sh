#!/usr/bin/env sh
# Entrypoint for the Greenman CMS container.
# On first boot (empty production DB) it creates the SQLite schema via
# `payload db:push` before starting the server.
set -e

if [ ! -f "/app/data/payload.db" ] && [ "$SKIP_DB_PUSH" != "true" ]; then
  echo "[entrypoint] No SQLite DB found - creating schema (db:push)..."
  NODE_ENV=development npm run db:push
else
  echo "[entrypoint] SQLite DB present - skipping db:push."
fi

exec "$@"