#!/bin/bash

# Indian Railway Safety System - Automated PostgreSQL Backup Script
# Retention policy: 7 days locally, rotate older logs

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
DB_NAME="${SUPABASE_DB_NAME:-railway_safety}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
DB_HOST="${SUPABASE_DB_HOST:-postgres}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
STATUS_LOG_FILE="${BACKUP_DIR}/backup_status.log"

DATE=$(date +"%Y-%m-%d_%H%M%S")
FILENAME="${BACKUP_DIR}/${DB_NAME}_backup_${DATE}.sql"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "[IR-Backup] Starting database backup for '${DB_NAME}' at $(date)..." | tee -a "${STATUS_LOG_FILE}"

# Execute logical database dump
PGPASSWORD="${SUPABASE_DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -F p \
  -b \
  -v \
  -f "${FILENAME}" "${DB_NAME}"

if [ $? -eq 0 ]; then
  # Validate dump file size is greater than 0
  if [ -s "${FILENAME}" ]; then
    echo "[IR-Backup] Database dump completed successfully and verified ✅ -> ${FILENAME}" | tee -a "${STATUS_LOG_FILE}"
    # Gzip the backup to save disk space
    gzip "${FILENAME}"
    echo "[IR-Backup] Backup compressed successfully ✅ -> ${FILENAME}.gz" | tee -a "${STATUS_LOG_FILE}"
    echo "[$(date)] SUCCESS: Database backup complete. File: ${FILENAME}.gz" >> "${STATUS_LOG_FILE}"
  else
    echo "[IR-Backup] ERROR: Database dump verification failed. Dump file is empty (0 bytes) ❌" >&2 | tee -a "${STATUS_LOG_FILE}"
    echo "[$(date)] ERROR: Backup failed. Dump file size is 0 bytes." >> "${STATUS_LOG_FILE}"
    exit 1
  fi
else
  echo "[IR-Backup] ERROR: Database dump failed ❌" >&2 | tee -a "${STATUS_LOG_FILE}"
  echo "[$(date)] ERROR: Backup failed. pg_dump execution error." >> "${STATUS_LOG_FILE}"
  exit 1
fi

# Clean up local backups older than 7 days
echo "[IR-Backup] Cleaning up backups older than 7 days..." | tee -a "${STATUS_LOG_FILE}"
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +7 -exec rm -f {} \; -print | tee -a "${STATUS_LOG_FILE}"

echo "[IR-Backup] Backup job finished successfully ✅" | tee -a "${STATUS_LOG_FILE}"
