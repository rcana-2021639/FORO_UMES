#!/bin/bash
# Se ejecuta UNA sola vez, cuando el volumen de PostgreSQL se crea por primera vez.
# Crea el usuario de aplicación con permisos limitados únicamente a la base del Foro.
# La aplicación (Strapi) se conecta con este usuario, nunca con el superusuario.
set -euo pipefail

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE "$APP_DB_USER" WITH LOGIN PASSWORD '$APP_DB_PASSWORD' NOSUPERUSER NOCREATEDB NOCREATEROLE;

    GRANT CONNECT ON DATABASE "$POSTGRES_DB" TO "$APP_DB_USER";

    -- Strapi crea y modifica tablas en el esquema public: necesita USAGE + CREATE ahí.
    GRANT USAGE, CREATE ON SCHEMA public TO "$APP_DB_USER";
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "$APP_DB_USER";
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "$APP_DB_USER";
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO "$APP_DB_USER";
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO "$APP_DB_USER";
EOSQL
