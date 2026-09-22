#!/usr/bin/env bash
#
# publish.sh - Publish CMS content to the static frontend repo.
#
# Runs the Phase 6 export inside the CMS container (against the PRODUCTION
# database), writes data/*.json into a live working copy of the frontend
# repo, then commits + pushes - which triggers a Vercel redeploy via
# Git integration (the free, reliable flow designed for handover).
#
# Runs on the server host (outside the container) and needs git + bash.
# Requires the frontend repo to be cloned/bind-mounted at FRONTEND_DIR.
#
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE=docker-compose.yml
FRONTEND_DIR=${FRONTEND_DIR:-../frontend}
GIT_REMOTE=${GIT_REMOTE:-origin}
GIT_BRANCH=${GIT_BRANCH:-main}
DRY_RUN=${DRY_RUN:-0}

if [ ! -d "$FRONTEND_DIR/.git" ]; then
  echo "error: $FRONTEND_DIR is not a git working copy." >&2
  echo "  clone it first, e.g.:  git clone <your-frontend-repo> $FRONTEND_DIR" >&2
  exit 1
fi

echo ">> Step 1/3: exporting CMS data into frontend (container)..."
out=$("${COMPOSE:-docker} compose" -f "$COMPOSE_FILE" exec -T cms npm run p6:export -- --install 2>&1)
echo "$out"

if ! grep -qE 'mismatch:\s*0' <<<"$out"; then
  echo "error: export reports mismatches - nothing was published. Investigate, then rerun." >&2
  exit 1
fi

if [ "$DRY_RUN" = "1" ]; then
  echo ">> DRY_RUN=1 - requested, skipping git commit/push."
  echo "   Inspect changes with:  git -C $FRONTEND_DIR status"
  exit 0
fi

echo ">> Step 2/3: committing data/ in $FRONTEND_DIR..."
git -C "$FRONTEND_DIR" add data/
if git -C "$FRONTEND_DIR" diff --cached --quiet; then
  echo "   no data changes to commit."
else
  git -C "$FRONTEND_DIR" commit -m "chore(data): CMS publish $(date -u +%Y-%m-%dT%H:%M:%SZ)"
fi

echo ">> Step 3/3: pushing to ${GIT_REMOTE}/${GIT_BRANCH} (Vercel auto-redeploys)..."
git -C "$FRONTEND_DIR" push "$GIT_REMOTE" "$GIT_BRANCH"

echo ">> Done."