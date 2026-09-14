# Despliegue — Backend del Foro Interuniversitario

Sprint 8. Cómo llevar el backend a staging y producción en **Railway**, cómo revertir, y qué entregar al Foro.

## 1. Arquitectura de entornos

| Entorno       | Dónde                             | Base de datos                      | Secretos                          | Uso                                                        |
| ------------- | --------------------------------- | ---------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `development` | Máquina de cada desarrollador     | `foro_posgrado_dev` (Docker local) | `.env` local                      | Desarrollo diario                                          |
| `test`        | CI y local (`npm test`)           | `foro_posgrado_test`               | Desechables                       | Pruebas automatizadas                                      |
| `staging`     | Railway, environment `staging`    | Postgres de Railway (propio)       | Variables de Railway (staging)    | Validación por los representantes antes de aprobar cambios |
| `production`  | Railway, environment `production` | Postgres de Railway (propio)       | Variables de Railway (production) | Sitio real                                                 |

**Ningún dato ni secreto se comparte entre entornos.** Los secretos se generan una vez por entorno con `openssl rand -base64 32` y viven solo en Railway (nunca en archivos del repositorio).

## 2. Flujo de ramas y despliegue

```
jonathan  ──push──▶  CI (lint, formato, tipos, audit, pruebas, build, gitleaks)
   │
   └─ PR jonathan → main (revisión + CI en verde)
                       │
                     main ──push──▶ CI ──éxito──▶ Deploy (Railway, producción)
```

- `jonathan`: rama de desarrollo. Cada push ejecuta CI.
- `main`: producción. Solo recibe cambios por **pull request** desde `jonathan`. Al fusionar, CI corre de nuevo y, si pasa, el flujo **Deploy** publica en Railway.
- Staging: en Railway, el environment `staging` se conecta a la rama `jonathan` (auto-deploy). Así cada avance queda disponible para que los representantes lo validen antes del PR a `main`.

### Protección de `main` (hacerlo una vez, requiere ser admin del repo — cuenta `rcana-2021639`)

GitHub → repositorio → _Settings → Branches → Add branch ruleset_ (o _Add rule_):

1. Branch name pattern: `main`.
2. ✅ **Require a pull request before merging** → Required approvals: **1**.
3. ✅ **Require status checks to pass before merging** → buscar y marcar: `Lint, formato, tipos y auditoría`, `Pruebas (unitarias, integración y API)`, `Compilación (panel + servidor)`, `Escaneo de secretos (gitleaks)`.
4. ✅ **Require branches to be up to date before merging**.
5. ✅ **Do not allow bypassing the above settings** (o al menos no para admins en el día a día).
6. Guardar.

Con dos cuentas (Jonathan abre el PR, rcana-2021639 lo aprueba, o viceversa) se cumple la revisión obligatoria del plan técnico.

## 3. Primer despliegue en Railway (paso a paso)

> Lo hace una persona con acceso a la cuenta de Railway del Foro. Yo no puedo crear cuentas ni manejar credenciales.

### 3.1 Proyecto y base de datos

1. Crear cuenta en railway.com (plan Hobby) y un proyecto `foro-posgrado`.
2. _New → Database → PostgreSQL_. Railway crea el servicio `Postgres` y expone `DATABASE_URL`, `PGHOST`, `PGUSER`, etc.
3. Crear un usuario **limitado** para la aplicación (igual que en local; no usar el superusuario `postgres`): abrir _Postgres → Data → Query_ (o `psql "$DATABASE_URL"`) y ejecutar, sustituyendo la contraseña por una generada:
   ```sql
   CREATE ROLE foro_app WITH LOGIN PASSWORD '<contraseña-generada>' NOSUPERUSER NOCREATEDB NOCREATEROLE;
   GRANT CONNECT ON DATABASE railway TO foro_app;
   GRANT USAGE, CREATE ON SCHEMA public TO foro_app;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO foro_app;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO foro_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO foro_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO foro_app;
   ```

### 3.2 Servicio del backend

1. _New → GitHub Repo_ → `rcana-2021639/FORO_UMES`. Railway detecta `railway.json` y construye con el `Dockerfile`.
2. _Settings → Source_: rama `main` (producción). Activar **Wait for CI** (_Check Suites_) para que no despliegue si CI falla — o dejar que lo haga el flujo `deploy.yml` (sección 2); no activar ambos a la vez para no desplegar dos veces.
3. _Settings → Networking → Generate Domain_ (URL temporal `*.up.railway.app`). Más adelante, _Custom Domain_ → `api.<dominio-del-foro>`; Railway emite el certificado SSL automáticamente. Añadir el `CNAME` que indique Railway en el DNS del dominio.
4. _Settings → Deploy_: Health check path `/_health` (ya viene de `railway.json`).

### 3.3 Variables de entorno (producción)

_Service → Variables → Raw Editor_. Generar cada secreto con `openssl rand -base64 32` (uno distinto por variable y por entorno):

```
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
PUBLIC_URL=https://api.<dominio>            # o la URL *.up.railway.app mientras no haya dominio
TRUST_PROXY=true
FRONTEND_URL=https://<dominio-del-sitio>    # CORS; varios separados por coma
LOG_LEVEL=info

APP_KEYS=<secreto1>,<secreto2>
API_TOKEN_SALT=<secreto>
ADMIN_JWT_SECRET=<secreto>
JWT_SECRET=<secreto>
TRANSFER_TOKEN_SALT=<secreto>
ENCRYPTION_KEY=<secreto>

DATABASE_CLIENT=postgres
DATABASE_HOST=${{Postgres.PGHOST}}          # referencias de Railway al servicio Postgres
DATABASE_PORT=${{Postgres.PGPORT}}
DATABASE_NAME=${{Postgres.PGDATABASE}}
DATABASE_USERNAME=foro_app
DATABASE_PASSWORD=<contraseña de foro_app>
DATABASE_SSL=false                          # red privada de Railway; true si la base es externa
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

CONTACT_NOTIFY_EMAIL=<correo del responsable de comunicación>
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=<API key de Resend>
MAIL_FROM=Foro Posgrado <no-reply@<dominio>>
MAIL_REPLY_TO=<correo del Foro>

S3_BUCKET=<bucket de R2>
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_REGION=auto
S3_ACCESS_KEY_ID=<R2 access key>
S3_SECRET_ACCESS_KEY=<R2 secret>
S3_PUBLIC_URL=https://<dominio público del bucket>

SENTRY_DSN=<DSN de Sentry>
SENTRY_ENVIRONMENT=production
```

Servicios externos que hay que crear antes (todos con nivel gratuito): **Resend** (dominio verificado para `MAIL_FROM`), **Cloudflare R2** (bucket con acceso público o dominio propio; token de API con permiso _Object Read & Write_ al bucket), **Sentry** (proyecto Node.js).

### 3.4 Staging

_Project → Environments → New_ → `staging` (duplicar desde `production`). Cambiar: servicio Postgres propio (crear otro), **todos** los secretos regenerados, `SENTRY_ENVIRONMENT=staging`, `FRONTEND_URL` del frontend de staging, rama de despliegue `jonathan`.

### 3.5 Primer arranque

1. Abrir `https://<url>/admin` y crear el **Super Admin de producción** con el correo institucional del Foro y una contraseña de 12+ caracteres (la política la exige). Guardar la contraseña en un gestor de contraseñas; entregarla por un canal seguro (nunca por correo sin cifrar).
2. En el panel: _Settings → API Tokens → Create_: nombre `frontend-ssr`, tipo **Read-only**, duración _Unlimited_. Copiar el token a las variables del frontend (Next.js, lado servidor). Solo se muestra una vez.
3. Crear las 9 universidades (o importar con `npm run seed` apuntando `DATABASE_*` a staging desde una máquina local — nunca directamente contra producción sin revisar los datos provisionales).
4. Invitar a los editores (_Settings → Users → Invite_, rol **Editor de Universidad**) y crear su **Perfil de editor**.

## 4. Checklist de validación (staging y producción)

Ejecutar después de cada despliegue importante, sustituyendo `URL`:

| #   | Comprobación                                                         | Esperado                                                                                                                 |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | `curl -i URL/_health`                                                | `204`                                                                                                                    |
| 2   | `curl URL/api/universities?sort=displayOrder`                        | 200, 9 universidades en orden, cabecera `X-Request-Id`                                                                   |
| 3   | `curl URL/api/news-items?status=draft`                               | 200 solo publicadas                                                                                                      |
| 4   | `curl -X POST URL/api/universities`                                  | 405                                                                                                                      |
| 5   | `curl URL/api/contact-messages`                                      | 403/404                                                                                                                  |
| 6   | `curl -H "Origin: https://malicioso.com" -i URL/api/universities`    | sin `Access-Control-Allow-Origin`                                                                                        |
| 7   | `curl -i URL/api/universities`                                       | cabeceras `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`                        |
| 8   | Enviar el formulario de contacto desde el sitio                      | 201 y correo recibido en `CONTACT_NOTIFY_EMAIL`                                                                          |
| 9   | Panel: entrar como editor de la universidad A                        | Ve solo lo de A; crear programa para B → 403                                                                             |
| 10  | Panel: subir un logo PNG                                             | Aparece en R2 (URL del `S3_PUBLIC_URL`)                                                                                  |
| 11  | Forzar un error (p. ej. `URL/api/universities?pagination[page]=abc`) | 400 formato estándar; nada llega a Sentry. Provocar un 500 real solo en staging → aparece en Sentry sin datos personales |
| 12  | Railway → Logs                                                       | Líneas JSON con `requestId`                                                                                              |

## 5. Respaldos y restauración

- **Automáticos**: Railway → servicio Postgres → _Backups_ → activar diarios con retención ≥ 7 días (disponible en planes de pago; verificar en la cuenta del Foro).
- **Manual / externo** (recomendado además, semanal): `./scripts/backup-db.sh backup "$DATABASE_URL"` desde una máquina con `pg_dump` 18 (o dentro de `docker run --rm -v "$PWD/backups:/backups" postgres:18-alpine ...`). Guardar los `.dump` en un almacenamiento del Foro fuera de Railway (p. ej. otro bucket de R2 privado).
- **Prueba de restauración (obligatoria antes de dar por aceptada producción)**: crear una base vacía en staging, `./scripts/backup-db.sh restore backups/<archivo>.dump "$STAGING_DATABASE_URL"`, arrancar el backend de staging contra ella y pasar el checklist de la sección 4. Un respaldo que nunca se ha restaurado no se considera confiable. Registrar la fecha de la última prueba aquí:

| Fecha       | Quién | Resultado |
| ----------- | ----- | --------- |
| (pendiente) |       |           |

Los archivos subidos (imágenes) viven en R2, no en la base: R2 conserva los objetos; para respaldarlos, activar el versionado del bucket o copiarlos periódicamente con `rclone`.

## 6. Reversión (rollback) en menos de 15 minutos

**Opción A — Railway (2 minutos)**: _Service → Deployments_ → elegir el último despliegue que funcionaba → menú **⋯ → Redeploy**. Railway vuelve a la imagen anterior sin tocar la base de datos.

**Opción B — Git**: en `main`, `git revert <commit-problemático>` y push (por PR o directamente si la protección lo permite en emergencias). CI + Deploy publican la reversión.

**Si el problema es de datos** (una migración o un cambio de content-type dejó la base inconsistente): restaurar el último respaldo (sección 5) en una base nueva de Railway y apuntar `DATABASE_*` a ella; después investigar en staging.

Strapi 5 sincroniza el esquema al arrancar y **no borra columnas** existentes por sí solo, así que volver a una versión anterior del código no destruye datos.

## 7. Entrega al Foro

Al cierre del Sprint 8 se entrega:

1. URL del panel de producción (`https://api.<dominio>/admin`) y del sitio.
2. Credenciales del primer Super Admin por canal seguro (gestor de contraseñas compartido o en persona; nunca correo sin cifrar).
3. Acceso a Railway, Resend, Cloudflare R2 y Sentry transferido a cuentas institucionales del Foro (no personales).
4. Documentación: [README.md](README.md), [SEGURIDAD.md](SEGURIDAD.md), [TESTING.md](TESTING.md), [OBSERVABILIDAD.md](OBSERVABILIDAD.md), este archivo y [openapi.yaml](openapi.yaml).
5. Pendientes conocidos: datos reales de representantes y programas por universidad; dominio definitivo; correo institucional para `CONTACT_NOTIFY_EMAIL` y `MAIL_FROM`.
