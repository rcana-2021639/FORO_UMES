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
3. _Settings → Networking → Generate Domain_ (URL temporal `*.up.railway.app`) — **solo después de crear el Super Admin (sección 3.5, paso 1)**. Más adelante, _Custom Domain_ → `api.<dominio-del-foro>`; Railway emite el certificado SSL automáticamente. Añadir el `CNAME` que indique Railway en el DNS del dominio.
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
FRONTEND_API_TOKEN=<openssl rand -hex 32>   # el MISMO valor en el servicio del frontend
LOG_LEVEL=info

APP_KEYS=<secreto1>,<secreto2>
API_TOKEN_SALT=<secreto>
ADMIN_JWT_SECRET=<secreto>
JWT_SECRET=<secreto>
TRANSFER_TOKEN_SALT=<secreto>
ENCRYPTION_KEY=<secreto>
REMOTE_TRANSFER_ENABLED=false               # `strapi transfer` remoto apagado (ver SEGURIDAD.md)

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
CONTACT_RETENTION_DAYS=365                  # lo promete el aviso de privacidad (/privacidad)
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

### 3.3.1 Variables del frontend (Next.js)

Las `NEXT_PUBLIC_*` se incrustan **al compilar**: si cambian, hay que volver a desplegar el frontend.

```
NEXT_PUBLIC_API_URL=https://api.<dominio>          # URL pública del backend, sin barra final
NEXT_PUBLIC_MEDIA_URL=https://<dominio público de R2> # el mismo S3_PUBLIC_URL del backend
NEXT_PUBLIC_SITE_URL=https://<dominio-del-sitio>   # canónicas, sitemap, robots, Open Graph
FRONTEND_API_TOKEN=<el mismo valor que en el backend>  # solo servidor: sin NEXT_PUBLIC_
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<opcional, ver 3.6>
NEXT_TELEMETRY_DISABLED=1
```

- El sitio solo se deja indexar si `NEXT_PUBLIC_SITE_URL` es `https://` y **no** está `NEXT_PUBLIC_NOINDEX=true`. En **staging** hay que poner `NEXT_PUBLIC_NOINDEX=true` para que Google no lo indexe como un duplicado de producción.
- Sin `NEXT_PUBLIC_MEDIA_URL`, las imágenes guardadas en R2 no pasarían por el optimizador de Next (el origen no estaría permitido).

### 3.4 Staging

_Project → Environments → New_ → `staging` (duplicar desde `production`). Cambiar: servicio Postgres propio (crear otro), **todos** los secretos regenerados, `SENTRY_ENVIRONMENT=staging`, `FRONTEND_URL` del frontend de staging, rama de despliegue `jonathan`.

### 3.5 Primer arranque

1. Crear el **Super Admin de producción** por consola, **antes** de generar el dominio público: mientras no existe ningún administrador, cualquiera que abra `/admin` puede registrarse como Super Admin. Con el servicio ya desplegado y sin dominio: `railway ssh` (o _Service → ⋯ → Shell_) y dentro `npx strapi admin:create-user` (pregunta los datos; así la contraseña no queda en el historial). Correo institucional del Foro y contraseña de 12+ caracteres (la política la exige). Guardarla en un gestor de contraseñas; entregarla por un canal seguro (nunca por correo sin cifrar). Recién entonces, _Generate Domain_ (sección 3.2).
2. **No** crear API Tokens para el frontend: lee la API pública sin credenciales. Lo único que comparte con el backend es `FRONTEND_API_TOKEN` (sección 3.3), que solo le da un cupo propio en el límite de tasa. Un token _Read-only_ de Strapi no aportaría nada (los controladores ya sirven solo contenido publicado) y sería una credencial sin vencimiento que nadie usa: una más que podría filtrarse.
3. Crear las 9 universidades (o importar con `npm run seed` apuntando `DATABASE_*` a staging desde una máquina local — nunca directamente contra producción sin revisar los datos provisionales).
4. Invitar a los editores (_Settings → Users → Invite_, rol **Editor de Universidad**) y crear su **Perfil de editor**.

### 3.6 Google Search Console (una vez que el dominio definitivo responde)

1. Entrar a https://search.google.com/search-console con la cuenta institucional del Foro → _Agregar propiedad_ → **Dominio** → escribir el dominio → Google da un registro `TXT` → agregarlo en el DNS del dominio. (Alternativa sin acceso al DNS: propiedad de tipo _Prefijo de URL_ con _Etiqueta HTML_, copiar solo el valor de `content` en `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` y redesplegar el frontend.)
2. _Sitemaps_ → enviar `https://<dominio-del-sitio>/sitemap.xml`.
3. _Inspección de URLs_ → la portada → _Solicitar indexación_.
4. Probar una noticia en https://search.google.com/test/rich-results (debe detectar `NewsArticle` y `BreadcrumbList`).

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

## 8. Despliegue gratuito (sin tarjeta): Vercel + Render + Supabase + Cloudinary

Para cuando el Foro no tiene presupuesto. Todo es gratis y ninguna de estas cuentas pide tarjeta. Lo que se sacrifica frente a Railway: menos memoria, sin respaldos automáticos y un servidor que se dormiría si nadie lo visita (se resuelve con un "despertador", §8.6).

| Pieza                        | Servicio (plan gratis) | Límite que importa                                                                                |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| Sitio (Next.js)              | Vercel _Hobby_         | Siempre encendido. Uso no comercial (el Foro es una iniciativa académica)                         |
| Panel y API (Strapi)         | Render _Free_          | 512 MB de RAM, 750 h/mes (alcanza para 1 servicio todo el mes); se duerme tras 15 min sin visitas |
| Base de datos                | Supabase _Free_        | 500 MB; se pausa tras 7 días sin actividad (el despertador lo evita)                              |
| Fotos subidas                | Cloudinary _Free_      | 25 créditos/mes (≈ 25 GB entre almacenamiento y descargas)                                        |
| Correo (avisos, contraseñas) | Brevo _Free_           | 300 correos al día                                                                                |
| Despertador y alertas        | UptimeRobot _Free_     | Revisa cada 5 minutos y avisa por correo si el sitio se cae                                       |

Medido en local (oct-2026): Strapi en producción usa ~335 MB con carga, dentro de los 512 MB. Por eso `render.yaml` limita el montón de Node a 320 MB y procesa las fotos en un solo hilo.

> Todas las cuentas deben quedar **a nombre del Foro** (un correo institucional), no de una persona.

### 8.1 Base de datos — Supabase

1. https://supabase.com → _Start your project_ → crear organización y proyecto `foro-posgrado`. Región: la más cercana (p. ej. _East US_). Contraseña de la base: generarla y guardarla en el gestor de contraseñas.
2. _Project Settings → Database → Connection string → **Session pooler**_ (funciona por IPv4, que es lo que tiene Render). De ahí salen `DATABASE_HOST` (`aws-0-<región>.pooler.supabase.com`), `DATABASE_USERNAME` (`postgres.<id-del-proyecto>`) y la contraseña.

### 8.2 Fotos — Cloudinary

https://cloudinary.com → crear cuenta → _Dashboard_: copiar **Cloud name**, **API Key** y **API Secret** (`CLOUDINARY_NAME`, `CLOUDINARY_KEY`, `CLOUDINARY_SECRET`). Las fotos quedan en la carpeta `foro-posgrado`.

### 8.3 Correo — Brevo

https://www.brevo.com → cuenta gratis → _SMTP & API → SMTP_: `SMTP_HOST=smtp-relay.brevo.com`, `SMTP_USER` (el login SMTP) y `SMTP_PASSWORD` (una clave SMTP nueva). Verificar el remitente que irá en `MAIL_FROM` (el correo del Foro). `CONTACT_NOTIFY_EMAIL`: a quién le llegan los mensajes del formulario.

### 8.4 Panel y API — Render

1. Fusionar los cambios en `main` (Render despliega esa rama; ver §2).
2. https://render.com → entrar con GitHub → _New → Blueprint_ → elegir el repositorio. Render lee [`render.yaml`](render.yaml), crea el servicio `foro-posgrado-api` y genera solo las claves de Strapi.
3. Llenar las variables marcadas como pendientes: las de Supabase (§8.1), Cloudinary (§8.2), Brevo (§8.3), `SUPERADMIN_*` (§8.5), `PUBLIC_URL` = `https://foro-posgrado-api.onrender.com` (la que muestre Render) y `FRONTEND_URL` = la dirección del sitio en Vercel (§8.6; se puede completar después y redesplegar).
4. _Create_. El primer despliegue tarda ~10 minutos (compila el panel). Comprobar `https://foro-posgrado-api.onrender.com/_health` → respuesta vacía con código 204.

### 8.5 Primer Super Admin (sin consola)

En el plan gratis de Render no hay consola para crear el administrador, y mientras no exista ninguno, **cualquiera** que abra `/admin` podría registrarse como Super Admin. Por eso Strapi lo crea solo al arrancar ([`src/security/initial-admin.ts`](src/security/initial-admin.ts)), antes de aceptar visitas, con estas variables:

- `SUPERADMIN_EMAIL`: correo institucional de quien administra.
- `SUPERADMIN_PASSWORD`: 12+ caracteres con mayúscula, minúscula, número y símbolo (si no cumple, no se crea y el registro lo dice).
- `SUPERADMIN_FIRSTNAME`, `SUPERADMIN_LASTNAME`: opcionales.

En cuanto se entra por primera vez a `https://<api>/admin`: **borrar `SUPERADMIN_PASSWORD`** en Render (_Environment_) y guardar. Si se deja, el registro avisa en cada arranque.

### 8.6 Sitio — Vercel

1. https://vercel.com → entrar con GitHub → _Add New → Project_ → el repositorio → **Root Directory: `frontend`**.
2. Variables (_Environment Variables_), ver §3.3.1:
   - `NEXT_PUBLIC_API_URL` = `https://foro-posgrado-api.onrender.com`
   - `NEXT_PUBLIC_MEDIA_URL` = `https://res.cloudinary.com/<cloud name>`
   - `NEXT_PUBLIC_SITE_URL` = la dirección final del sitio (al principio, la `.vercel.app` que asigne Vercel)
   - `FRONTEND_API_TOKEN` = el mismo valor que generó Render (Render → _Environment_ → ver valor)
   - `NEXT_TELEMETRY_DISABLED=1`
3. _Deploy_. La compilación lee la API: si Render estaba dormido, despertarlo antes abriendo `/_health`.
4. Volver a Render y poner `FRONTEND_URL` = la dirección del sitio (sin barra final).

**Despertador** — https://uptimerobot.com → _New monitor_ → HTTP(s) → URL `https://foro-posgrado-api.onrender.com/api/forum-summary` → cada **5 minutos** → alertas al correo del Foro. Esa ruta consulta la base, así que mantiene despiertos a Render (se duerme a los 15 min sin visitas) **y** a Supabase (se pausa a los 7 días). Un segundo monitor sobre la portada del sitio avisa si Vercel falla.

### 8.7 Después del primer despliegue

1. Checklist de la §4 (cambiando R2 por Cloudinary en la fila 10).
2. **IP real de los visitantes**: entrar al panel y revisar _Bitácora de auditoría_: la IP del inicio de sesión debe ser la tuya (búscala en https://ifconfig.me), no una de Render. Si sale otra, probar `PROXY_IP_HEADER=True-Client-IP` en Render y repetir. Sin esto, el límite de envíos del formulario de contacto contaría a todos los visitantes como uno solo.
3. Cargar la información real: crear las 9 universidades (con su **Logotipo**), invitar a los editores y crear su _Perfil de editor_ (guía en `https://<api>/guia/`, sección «Para el Super Admin»). **No** cargar los datos de simulación (`npm run seed`) en producción: son personas y fechas ficticias.
4. **Respaldo semanal** (el plan gratis de Supabase no guarda copias descargables): `./scripts/backup-db.sh backup "<cadena de conexión del Session pooler>"` y guardar el archivo fuera de Supabase.

### 8.8 Guía para los editores

La guía interactiva del panel está en `https://<api>/guia/` (la sirve Strapi desde [`public/guia/`](public/guia/), no se enlaza desde el sitio público y no se indexa). Desde el inicio del panel, la tarjeta «Cómo cargar información» lleva a ella. Para regenerar sus capturas tras un cambio del panel: `npx tsx scripts/demo-editor.ts` (cuenta de prueba local), después `node scripts/guia/capturar.mjs` y `python scripts/guia/construir.py` (instrucciones al inicio de `capturar.mjs`).
