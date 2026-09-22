#!/usr/bin/env sh
# Entrypoint for the Greenman CMS container.
# On first boot (no SQLite DB at /app/data/payload.db) it provisions the app:
#   1. applies the baseline SQLite schema via `payload migrate`
#      (payload 3.90 shipping NODE_ENV=production expects `migrate`, not `db:push`),
#   2. imports the catalogue from /app/frontend/data (scripts/phase5/import.ts),
#   3. seeds the blog articles from /app/frontend/blog.html (scripts/phase6/seed-blogs.ts).
# The import/seed scripts read P5_DB_URI (falling back silently to a dev default),
# so align it with DATABASE_URI before running them.
# Set SKIP_PROVISION=true to disable the whole first-boot provisioning step.
set -e

if [ -z "$P5_DB_URI" ] && [ -n "$DATABASE_URI" ]; then
  export P5_DB_URI="$DATABASE_URI"
fi

if [ ! -f "/app/data/payload.db" ] && [ "$SKIP_PROVISION" != "true" ]; then
  echo "[entrypoint] No SQLite DB found - migrating schema, importing catalogue, seeding blogs..."
  NODE_ENV=production npx payload migrate
  NODE_ENV=production npx tsx scripts/phase5/import.ts
  NODE_ENV=production npx tsx scripts/phase6/seed-blogs.ts
else
  echo "[entrypoint] SQLite DB present (or SKIP_PROVISION=true) - skipping schema + data provisioning."
fi

exec "$@"