#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/portfolio_db_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

docker exec portfolio-db pg_dump -U postgres portfolio_db | gzip > "$FILE"

echo "Backup saved: $FILE"
