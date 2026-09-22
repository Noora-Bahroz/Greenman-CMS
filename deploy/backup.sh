#!/usr/bin/env bash
#
# backup.sh - Consistent backup of the Greenman CMS data.
#
# SQLite with WAL mode is not safe to copy mid-write, so we briefly stop the
# CMS container (NO public downtime: the website is static on Vercel, this
# server only hosts admin/editing), tar the live SQLite + uploaded media,
# then restart. Keeps the last KEEP backups.
#
set -euo pipefail

cd "$(dirname "$0")"

COMPOSE_FILE=docker-compose.yml
DATA_DIR=${DATA_DIR:-./server-data/db}
MEDIA_DIR=${MEDIA_DIR:-./server-data/media}
BACKUP_DIR=${BACKUP_DIR:-./server-data/backups}
KEEP=${KEEP:-14}
TS=$(date -u +%Y%m%dT%H%M%SZ)
COMPOSE_CMD="${COMPOSE:-docker} compose -f $COMPOSE_FILE"

mkdir -p "$DATA_DIR" "$MEDIA_DIR" "$BACKUP_DIR"

echo ">> Stopping CMS for a consistent snapshot..."
$COMPOSE_CMD stop cms
restore() { $COMPOSE_CMD start cms >/dev/null 2>&1 || true; }
trap restore EXIT

echo ">> Archiving SQLite + media..."
tar -czf "$BACKUP_DIR/db-$TS.tar.gz" -C "$DATA_DIR" .
tar -czf "$BACKUP_DIR/media-$TS.tar.gz" -C "$MEDIA_DIR" .

echo ">> Restarting CMS..."
restore
trap - EXIT

echo ">> Pruning backups older than keep=$KEEP..."
ls -1t "$BACKUP_DIR"/db-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f --
ls -1t "$BACKUP_DIR"/media-*.tar.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f --

echo ">> Backup complete:"
ls -lh "$BACKUP_DIR" | grep "$TS" || true