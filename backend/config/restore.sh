#!/bin/bash

# Indian Railway Safety System - Automated PostgreSQL Restore/Recovery Script
# Usage: ./restore.sh <backup_file.sql.gz> [--force]

BACKUP_FILE="$1"
FORCE_RESTORE="$2"

# Configuration
DB_NAME="${SUPABASE_DB_NAME:-railway_safety}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_HOST="${SUPABASE_DB_HOST:-postgres}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
BACKUP_DIR="/var/backups/postgres"
RESTORE_LOG="${BACKUP_DIR}/restore_status.log"

mkdir -p "$(dirname "${RESTORE_LOG}")"

echo "[IR-Restore] Initializing recovery at $(date)..." | tee -a "${RESTORE_LOG}"

# Check arguments
if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup_file.sql.gz> [--force]" | tee -a "${RESTORE_LOG}"
  exit 1
fi

# Verify backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file '${BACKUP_FILE}' not found." | tee -a "${RESTORE_LOG}"
  exit 1
fi

# Confirmation prompt
if [ "${FORCE_RESTORE}" != "--force" ]; then
  read -p "⚠️ WARNING: You are about to restore the database '${DB_NAME}'. This will overwrite current data. Continue? (y/N) " confirm
  if [[ ! "$confirm" =~ ^[yY]$ ]]; then
    echo "Restore cancelled by user." | tee -a "${RESTORE_LOG}"
    exit 0
  fi
fi

# Decompress and execute
echo "[IR-Restore] Restoring database '${DB_NAME}' from '${BACKUP_FILE}'..." | tee -a "${RESTORE_LOG}"

# Test connection first
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}"
if [ $? -ne 0 ]; then
  echo "ERROR: Database server is unreachable." | tee -a "${RESTORE_LOG}"
  exit 1
fi

# Stream gunzip directly into psql to avoid extracting massive files to disk
PGPASSWORD="${SUPABASE_DB_PASSWORD}" gunzip -c "${BACKUP_FILE}" | psql \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  -v ON_ERROR_STOP=1

if [ $? -eq 0 ]; then
  echo "[IR-Restore] SUCCESS: Database restored successfully from ${BACKUP_FILE} ✅" | tee -a "${RESTORE_LOG}"
  echo "[$(date)] SUCCESS: Database restore complete from ${BACKUP_FILE}" >> "${RESTORE_LOG}"
else
  echo "[IR-Restore] ERROR: Database restoration failed ❌" >&2 | tee -a "${RESTORE_LOG}"
  echo "[$(date)] ERROR: Restore failed from ${BACKUP_FILE}" >> "${RESTORE_LOG}"
  exit 1
fi
