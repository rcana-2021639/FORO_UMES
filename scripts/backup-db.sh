#!/usr/bin/env bash
# Respaldo manual de la base de datos (Sprint 8, tarea 5) y prueba de restauración.
#
#   ./scripts/backup-db.sh backup  <DATABASE_URL>                 → backups/foro_YYYY-MM-DD_HHMM.dump
#   ./scripts/backup-db.sh restore <archivo.dump> <DATABASE_URL>  → restaura en la base indicada
#
# DATABASE_URL: postgres://usuario:contraseña@host:puerto/base  (Railway → servicio Postgres → Variables)
# Requiere pg_dump / pg_restore 18 (Windows: incluidos con PostgreSQL o `docker run postgres:18-alpine`).
# NUNCA restaurar sobre producción sin haberlo probado antes en staging o en una base vacía.
set -euo pipefail

cmd="${1:-}"
case "$cmd" in
  backup)
    url="${2:?Falta DATABASE_URL}"
    mkdir -p backups
    out="backups/foro_$(date +%Y-%m-%d_%H%M).dump"
    pg_dump --format=custom --no-owner --no-privileges --file="$out" "$url"
    echo "Respaldo escrito en $out ($(du -h "$out" | cut -f1))"
    ;;
  restore)
    file="${2:?Falta el archivo .dump}"
    url="${3:?Falta DATABASE_URL de destino}"
    echo "Restaurando $file en $url ..."
    pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$url" "$file"
    echo "Restauración completada. Verifica: psql \"$url\" -c 'SELECT count(*) FROM universities;'"
    ;;
  *)
    echo "Uso: $0 backup <DATABASE_URL> | restore <archivo.dump> <DATABASE_URL>" >&2
    exit 1
    ;;
esac
