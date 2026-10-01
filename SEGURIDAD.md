# Seguridad — Foro Interuniversitario de Estudios de Posgrado (backend y frontend)

Documento vivo. Sprint 3: autenticación, roles y control de acceso por universidad. Sprint 5: endurecimiento (sección 10).

## 1. Modelo de acceso

Hay **dos mundos** de acceso, con mecanismos distintos:

| Mundo                                                     | Quién                                 | Mecanismo                                                                                         | Dónde se configura                   |
| --------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **Panel administrativo** (`/admin`, `/content-manager/*`) | Super Admin y Editores de Universidad | Usuarios admin de Strapi + RBAC del panel + condición `is-university-owner` + guard de escrituras | `src/security/*`, `config/admin.ts`  |
| **API REST pública** (`/api/*`)                           | Visitantes y el frontend Next.js      | Rol `Public` de users-permissions (solo lectura)                                                  | `src/security/public-permissions.ts` |

Los editores **no** usan la API REST: administran su contenido desde el panel. Por eso la política de propiedad se implementó como condición RBAC + middleware sobre las rutas del content-manager (lo que el panel realmente llama), y no como una policy sobre `/api/*` que nadie ejercitaría.

## 2. Roles

| Rol                       | Código                                              | Quién lo tiene                       | Alcance                                                                      |
| ------------------------- | --------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| **Super Admin**           | `strapi-super-admin` (nativo)                       | Equipo coordinador del Foro          | Todo: todos los content-types, usuarios, roles, perfiles de editor, bitácora |
| **Editor de Universidad** | `university-editor` (propio, creado en `bootstrap`) | Una o pocas personas por universidad | Solo el contenido de **su** universidad (ver matriz)                         |
| **Public**                | `public` (users-permissions)                        | Cualquiera, sin autenticar           | Solo lectura de contenido público                                            |

Los roles nativos `Editor` y `Author` de Strapi no se usan; no asignarlos.

### Cómo se asocia un editor a su universidad

Content-type **Perfil de editor** (`api::editor-profile.editor-profile`): relación 1→1 con el usuario del panel (`admin::user`) y N→1 con `Universidad`. Solo el Super Admin puede crearlos/editarlos. Un usuario con rol Editor de Universidad **sin** perfil no puede escribir nada (403 explicando que pida su perfil).

Alta de un editor (Super Admin, en el panel):

1. _Settings → Users → Invite new user_, rol **Editor de Universidad**. Strapi envía un enlace de invitación; la persona define su contraseña (debe cumplir la política de la sección 4).
2. _Content Manager → Perfil de editor → Create_: elegir el usuario y su universidad.

## 3. Matriz de permisos

R = leer · C = crear · U = editar · D = borrar · P = publicar/despublicar · ★ = solo registros de su propia universidad

| Content-type          | Super Admin               | Editor de Universidad                                                              | Public (API)                                                                               |
| --------------------- | ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Universidad           | R C U D                   | R ★                                                                                | R                                                                                          |
| Representante         | R C U D                   | R C U D ★                                                                          | R                                                                                          |
| Programa académico    | R C U D                   | R C U D ★                                                                          | R                                                                                          |
| Actividad             | R C U D                   | R C U ★ (puede proponer; su universidad queda siempre como participante; no borra) | R                                                                                          |
| Aporte                | R C U D P                 | R C U D solo los propios; no publica                                               | R (solo publicados)                                                                        |
| Noticia               | R C U D P                 | R C U D solo las propias; no publica                                               | R (solo publicadas)                                                                        |
| Elemento de galería   | R C U D                   | —                                                                                  | R                                                                                          |
| Mensaje de contacto   | R U D                     | —                                                                                  | — (ni lectura ni creación directa; el formulario usará `POST /api/contact` en el Sprint 4) |
| Perfil de editor      | R C U D                   | —                                                                                  | —                                                                                          |
| Bitácora de auditoría | R (la escribe el sistema) | —                                                                                  | —                                                                                          |
| Biblioteca de medios  | todo                      | ver, subir, actualizar solo los propios (no borrar)                                | —                                                                                          |

Decisiones confirmadas con el Foro (14-sep-2026):

- **Noticias y aportes**: los editores redactan borradores y ven/editan/borran **solo los que ellos crearon** (condición nativa `admin::is-creator`). **Publicar** es exclusivo del Super Admin. Ambos content-types usan Draft & Publish.
- **Actividades**: cualquier editor puede proponer una actividad y editar aquellas en las que participa su universidad; puede agregar universidades participantes pero no quitar ninguna; borrar es exclusivo del Super Admin.
- **Contenido publicado** (noticias, aportes): una vez publicado por el Super Admin, el editor autor no puede borrarlo ni despublicarlo.
- **Un usuario del panel = una universidad**: la relación 1→1 del Perfil de editor se refuerza con validación y un índice único en base de datos. Quien edite dos universidades necesita dos cuentas.
- **Biblioteca de medios**: el editor ve todos los archivos (son públicos en el sitio) pero solo puede editar/renombrar los que él subió; borrar es del Super Admin.

## 4. Cómo se hace cumplir "su propia universidad" (control por objeto, no solo por rol)

1. **Condición RBAC `admin::is-university-owner`** (`src/security/ownership-condition.ts`). Se adjunta a los permisos R/U/D del rol. Strapi la evalúa con el usuario y el permiso; devuelve un filtro (`university.id = X` o `participatingUniversities.id = X`) que limita los registros que el editor puede ver, editar o borrar. Sin perfil → `false` → sin acceso.
2. **Guard de escrituras** (`src/security/admin-guard.ts`), middleware sobre las 17 rutas de escritura del content-manager. Cubre lo que una condición no puede:
   - al **crear**, rechaza (403 `NOT_OWNER`) un `university` ajeno en el cuerpo y asigna automáticamente la universidad del editor si no viene;
   - al **editar**, impide mover un registro a otra universidad; en actividades un editor solo puede **agregar** universidades, nunca quitar a ninguna (ni a la suya ni a otra) — las bajas las hace el Super Admin;
   - en noticias y aportes, impide **borrar, despublicar o descartar** contenido que ya fue publicado (el editor puede seguir editando su borrador; el Super Admin decide si republica);
   - bloquea clonar registros para editores;
   - registra en la bitácora toda escritura exitosa.
3. La lista de content-types "con dueño" y su atributo está en un solo lugar: `src/security/ownership.ts`.

Además, `tests/integration/adversarial.test.ts` (18 casos) cubre: acciones masivas con documentos ajenos, todos los formatos de relación en el cuerpo, expulsión de universidades de actividades compartidas, editores no participantes "invitándose", borrado/despublicación de contenido publicado, edición de medios ajenos, escalada de privilegios (roles, usuarios, API tokens, content-type builder), perfiles duplicados, cambio de universidad en caliente y sondeos de fuga de datos en la API pública. Estas pruebas encontraron y cerraron 4 vulnerabilidades antes de producción (ver TESTING.md).

Verificado manualmente en el Sprint 3 con dos editores (A y B) atacando la API del panel por HTTP: A solo lista lo suyo; crear/editar/borrar/mover contenido de B → 403; quitarse de una actividad → 403; borrar actividad → 403; B (participante) sí edita la actividad. Se automatizará en el Sprint 7.

## 5. Autenticación del panel

- **Sin autorregistro**: Strapi no expone registro abierto de administradores. Solo existen `/admin/register-admin` (primer usuario, se desactiva solo tras crearlo) e invitaciones enviadas por un Super Admin.
- **Sesión de vida corta** (`config/admin.ts`): token de acceso 30 min con renovación, sesión máxima **4 h**, cierre por inactividad 1 h.
- **Política de contraseñas** (`src/middlewares/admin-security.ts`): mínimo **12 caracteres** con mayúscula, minúscula, número y símbolo. Se valida en `register-admin`, `register` (invitación), `reset-password`, `users/me` y `users/:id`. Strapi solo exigiría 8 caracteres.
- Las contraseñas se almacenan con bcrypt (nativo de Strapi). Nunca se registran en logs ni en la bitácora.
- **Límite de intentos de login**: 5 por 15 minutos por correo + IP (limitador nativo de Strapi, `config/admin.ts → rateLimit`). Respuesta 429.

## 6. Bitácora de auditoría

Strapi Community no incluye audit logs (es Enterprise). Se implementó el content-type **Bitácora de auditoría** (`api::audit-log.audit-log`), escrito por el sistema y visible solo al Super Admin.

Registra: usuario (id y correo), acción (`create`, `update`, `delete`, `publish`, `unpublish`, `bulk-*`, `login`), content-type, `documentId` afectado, un resumen (título/nombre del registro, tomado del cuerpo de la petición), IP y código de respuesta. **No** guarda contenido de campos ni contraseñas.

## 7. API pública

- Rol Public: únicamente `find` y `findOne` sobre Universidad, Representante, Programa académico, Actividad, Aporte, Noticia y Elemento de galería. Se sincroniza en cada arranque; cualquier otro permiso sobre `api::*` que alguien active a mano se **revoca** al reiniciar.
- Noticias: solo las publicadas (Draft & Publish nativo; la API pública nunca sirve borradores).
- Mensajes de contacto, perfiles de editor y bitácora: sin acceso público.
- Escrituras por API: las rutas `POST/PUT/DELETE /api/*` **no existen** (routers con `only: ['find','findOne']`), salvo `POST /api/contact`. Respuesta 404/405.
- Filtros, orden y populate limitados a una lista blanca por recurso; el resto responde `400 QUERY_NOT_ALLOWED`. Paginación máxima 50. En `populate`, cada ruta de segundo nivel se declara explícitamente (`representatives.photo`, `galleryItems.file`) y dentro de una relación solo se admiten `fields` y `populate`: sin esto, una petición encadenaba cuatro niveles (~580 KB por solicitud) o escondía filtros en el populate.
- El render en servidor de Next.js lee la API **sin credenciales** (no se crean API Tokens de Strapi: uno _Read-only_ no aportaría nada, porque los controladores ya sirven solo lo publicado, y sería una credencial sin vencimiento más). Solo se identifica con `X-Frontend-Token` = `FRONTEND_API_TOKEN` (mín. 32 caracteres, comparación en tiempo constante) para tener **su propio cupo** en el límite de tasa: todas sus consultas salen de una misma IP y, con el cupo de un visitante (120/min), cualquiera podía agotarlo pidiendo URLs inventadas y dejar el sitio sin datos. La cabecera no da acceso a nada más.

## 8. Secretos y entornos

- Todos los secretos viven en `.env` (ignorado por Git) o en el gestor de secretos del hosting; `.env.example` no contiene valores.
- Strapi se conecta a PostgreSQL con el usuario limitado `foro_app` (sin superuser/createdb/createrole).
- Un juego de secretos y una base de datos distintos por entorno (`development`, `staging`, `production`).

## 9. Formulario de contacto (`POST /api/contact`)

- Validación estricta (nombre 2–200, correo válido ≤255, asunto ≤250, mensaje 10–2000) y sanitización (sin HTML ni caracteres de control).
- **Honeypot** `website`: si viene relleno se responde 201 sin guardar nada (no se da pista al bot).
- **Límite de tasa**: 5 envíos por hora por IP → 429 con `Retry-After`.
- Los mensajes se leen solo en el panel; la notificación por correo nunca se registra en logs con su contenido.
- **Conservación**: cada mensaje se borra solo a los `CONTACT_RETENTION_DAYS` días (365 por defecto), con una tarea diaria a las 3:00 (`config/cron-tasks.ts`, `src/lib/contact-retention.ts`). Es lo que promete el aviso de privacidad del sitio (`/privacidad`): si cambia el plazo, se cambia también ese texto. No se guarda la IP de quien escribe.

## 10. Endurecimiento (Sprint 5) — checklist de amenazas

| Amenaza                               | Mitigación implementada                                                                                                                                                                                                                                                                                                          | Dónde                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Inyección SQL                         | ORM de Strapi (consultas parametrizadas). Las únicas consultas crudas son `CREATE INDEX IF NOT EXISTS` con nombres fijos del código                                                                                                                                                                                              | `database/indexes.ts`                                  |
| XSS almacenado                        | Todo campo `richtext` se sanitiza al guardar (sanitize-html 2.17.7: sin `script`, `iframe`, `on*`, `javascript:`; los enlaces con `target` llevan `rel="noopener noreferrer"`) en **todas** las vías de escritura. El frontend renderiza con react-markdown, que no ejecuta HTML embebido, y además tiene CSP (sección 12)       | `src/security/richtext-sanitizer.ts`                   |
| CSRF                                  | API pública sin cookies de sesión; panel con protecciones nativas de Strapi. CORS sin `credentials`                                                                                                                                                                                                                              | `config/middlewares.ts`                                |
| CORS abierto                          | Solo `FRONTEND_URL` (lista) en producción; `localhost:3000` se añade en desarrollo. Nunca `*`                                                                                                                                                                                                                                    | `config/middlewares.ts`                                |
| Clickjacking / sniffing / downgrade   | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` 1 año con `includeSubDomains`, CSP con `img-src` limitado a self + host de medios                                                                                                                                                        | `config/middlewares.ts`                                |
| Divulgación de tecnología             | Sin cabecera `X-Powered-By`                                                                                                                                                                                                                                                                                                      | `config/middlewares.ts`                                |
| Fuerza bruta en login                 | 5 intentos / 15 min por correo + IP                                                                                                                                                                                                                                                                                              | `config/admin.ts`                                      |
| Abuso / DoS básico                    | Límite de tasa: contacto 5/h por IP; resto de `/api/*` 120/min por IP; servidor del frontend con cupo propio (1500/min, sección 7); paginación máxima 50. El frontend no consulta la API con ids imposibles y acota `?pagina=` (1–100)                                                                                           | `src/middlewares/rate-limit.ts`, `frontend/lib/api.ts` |
| Subida de archivos maliciosos         | Solo `image/png`, `image/jpeg`, `image/webp`; **SVG bloqueado** (puede contener scripts); 5 MB máx.; verificación de **magic bytes** contra MIME y extensión declarados; nombre con hash aleatorio (nativo); en producción los archivos viven en R2, fuera del servidor                                                          | `config/plugins.ts`, `src/middlewares/upload-guard.ts` |
| IDOR / control de acceso roto         | Condición RBAC + guard de escrituras (sección 4); un editor no puede enviar `university` ajeno en el cuerpo                                                                                                                                                                                                                      | `src/security/*`                                       |
| Superficie innecesaria                | Eliminadas las rutas públicas de users-permissions (`/api/auth/*`, `/api/users/*`) y de upload (`/api/upload/*`); desinstalado `@strapi/plugin-cloud`; sin rutas de escritura en `/api/*`                                                                                                                                        | `src/index.ts`                                         |
| Secretos en el repositorio            | `.env` ignorado; `.env.example` sin valores; revisión manual (grep) sin hallazgos; escaneo con gitleaks en CI (Sprint 8)                                                                                                                                                                                                         | `.gitignore`, CI                                       |
| Dependencias vulnerables              | Strapi 5.55.1 (versiones exactas). `npm audit`: **0 altas/críticas** con overrides de `nodemailer`, `sharp`, `vite`, `qs`, `markdown-it` y `webpack-dev-middleware`. Quedan moderados sin vía de explotación en producción (sección 13). Frontend: 0. El CI falla ante cualquier alta, en backend y frontend. Dependabot semanal | `package.json`, `.github/dependabot.yml`, CI           |
| HTTPS                                 | Lo termina el proveedor de hosting (Railway, certificado automático). `TRUST_PROXY=true` en producción para que Strapi vea la IP real y el esquema https                                                                                                                                                                         | `config/server.ts`                                     |
| Spoofing de IP                        | `proxy.koa` con `maxIpsCount: 1`: se toma solo la IP que agrega el proxy del hosting, no la que mande el cliente en `X-Forwarded-For`                                                                                                                                                                                            | `config/server.ts`                                     |
| Reemplazo de la base desde fuera      | Transferencia remota de datos (`strapi transfer`, `/admin/transfer/*`) **apagada**: con un token permitía sobrescribir toda la base. Se enciende solo durante una migración con `REMOTE_TRANSFER_ENABLED=true`                                                                                                                   | `config/server.ts`                                     |
| Toma del panel antes del primer admin | Mientras no existe ningún administrador, cualquiera en `/admin` puede registrarse como Super Admin: en producción se crea por consola (`strapi admin:create-user`) **antes** de publicar el dominio                                                                                                                              | `DESPLIEGUE.md` 3.5                                    |

Verificado manualmente en el Sprint 5: CORS bloquea un origen ajeno; el 6.º envío de contacto y el 6.º intento de login responden 429; un ejecutable renombrado `.png`, un PNG con extensión `.jpg` y un SVG son rechazados con 400; un richtext con `<script>`, `onerror` y `javascript:` se guarda limpio.

Pendientes: `HSTS` solo tiene efecto sobre HTTPS (producción). Limitador de tasa en memoria: válido para un proceso; si se escala a varias instancias, mover el almacén a Redis.

## 11. Privacidad

- Aviso de privacidad público en `/privacidad` (enlazado en el pie y junto al formulario de contacto). Describe solo lo que el sistema hace de verdad; cualquier cambio de proveedores, plazos o analítica se refleja en ese texto en el mismo cambio.
- El sitio público no usa cookies. En el navegador solo quedan la lista de programas guardados (`localStorage`) y el nivel de efectos (`sessionStorage`), sin datos personales.
- Las miniaturas de YouTube/Vimeo pasan por el optimizador de imágenes de Next (mismo origen): el navegador del visitante no contacta a Google ni a Vimeo hasta que reproduce un video; los de YouTube se incrustan con `youtube-nocookie.com`.
- Sentry con `sendMetadata: false`; los logs de petición no incluyen cabeceras ni cuerpos.

## 12. Frontend (Next.js)

Cabeceras en todas las rutas (`frontend/next.config.ts`, verificadas en `frontend/tests/security-headers.test.ts`):

| Cabecera                                     | Valor / efecto                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`                    | Lista cerrada: `default-src 'self'`; imágenes y videos solo del propio sitio, la API y R2 (`NEXT_PUBLIC_MEDIA_URL`); `connect-src` solo la API; `frame-src` solo `youtube-nocookie.com` y `player.vimeo.com`; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`; `upgrade-insecure-requests` con el sitio en HTTPS |
| `Strict-Transport-Security`                  | 2 años, `includeSubDomains` (sin `preload`: es difícil de revertir)                                                                                                                                                                                                                                                                                     |
| `X-Frame-Options` / `X-Content-Type-Options` | `DENY` / `nosniff`                                                                                                                                                                                                                                                                                                                                      |
| `Referrer-Policy`                            | `strict-origin-when-cross-origin`                                                                                                                                                                                                                                                                                                                       |
| `Cross-Origin-Opener-Policy`                 | `same-origin`                                                                                                                                                                                                                                                                                                                                           |
| `Permissions-Policy`                         | cámara, micrófono, ubicación, pagos, USB y Topics desactivados                                                                                                                                                                                                                                                                                          |
| `X-Powered-By`                               | eliminado (`poweredByHeader: false`)                                                                                                                                                                                                                                                                                                                    |

- **CSP sin nonces, a propósito**: con nonces cada página tendría que renderizarse en cada visita y se perdería la caché estática (ISR), que es la que protege al sitio de picos de tráfico y de caídas de la API. Por eso los scripts inline (datos de hidratación de Next y `lib/quality-script.ts`) se permiten con `'unsafe-inline'`, y `'unsafe-eval'` solo existe en desarrollo. Verificado en navegador: se bloquean scripts, imágenes, iframes y `fetch` hacia dominios ajenos. Si algún día el sitio renderiza HTML de terceros, reevaluar nonces.
- **Optimizador de imágenes** con lista cerrada de orígenes (API, R2, miniaturas de YouTube/Vimeo). Un comodín como `**.railway.app` lo convertía en un proxy gratuito para imágenes de cualquiera.
- **`proxy.ts`**: un `documentId` con formato imposible en `/noticias|actividades|universidades/[id]` recibe un 404 real antes de renderizar, sin consultar la API.
- **Datos estructurados (JSON-LD)** se serializan escapando `<`: un texto del backend con `</script>` no puede inyectar HTML.
- Las variables `NEXT_PUBLIC_*` son públicas por diseño (URL de la API, del sitio, de R2). `FRONTEND_API_TOKEN` no lleva el prefijo: solo existe en el servidor.

## 13. Riesgos aceptados y pendientes

- **Avisos moderados de `npm audit` sin corrección compatible**: `react-router` 6 (solo corre en el navegador del panel de Strapi, que no hidrata datos de servidor; la corrección exige v7, que Strapi 5 no soporta) y `stream-json` (lo usa `strapi transfer`, apagado en red; queda solo el uso local por CLI). Se revisan con cada versión de Strapi.
- **Limitador de tasa en memoria**: válido para un proceso; con varias instancias, mover el almacén a Redis.
- **Sin límite por IP delante del frontend**: Next no limita visitas por IP. Recomendado en producción: Cloudflare delante del dominio (regla gratuita de rate limiting y protección DDoS).
- **2FA en el panel**: Strapi Community no lo ofrece. Mitigación: contraseñas de 12+ caracteres, límite de intentos, sesiones cortas, bitácora de inicios de sesión.
- `HSTS` solo tiene efecto sobre HTTPS (producción).
