# Seguridad — Foro Interuniversitario de Estudios de Posgrado (Backend)

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
| Biblioteca de medios  | todo                      | ver, subir, actualizar (no borrar)                                                 | —                                                                                          |

Decisiones confirmadas con el Foro (14-sep-2026):

- **Noticias y aportes**: los editores redactan borradores y ven/editan/borran **solo los que ellos crearon** (condición nativa `admin::is-creator`). **Publicar** es exclusivo del Super Admin. Ambos content-types usan Draft & Publish.
- **Actividades**: cualquier editor puede proponer una actividad y editar aquellas en las que participa su universidad; borrar es exclusivo del Super Admin.

## 4. Cómo se hace cumplir "su propia universidad" (control por objeto, no solo por rol)

1. **Condición RBAC `admin::is-university-owner`** (`src/security/ownership-condition.ts`). Se adjunta a los permisos R/U/D del rol. Strapi la evalúa con el usuario y el permiso; devuelve un filtro (`university.id = X` o `participatingUniversities.id = X`) que limita los registros que el editor puede ver, editar o borrar. Sin perfil → `false` → sin acceso.
2. **Guard de escrituras** (`src/security/admin-guard.ts`), middleware sobre las 17 rutas de escritura del content-manager. Cubre lo que una condición no puede:
   - al **crear**, rechaza (403 `NOT_OWNER`) un `university` ajeno en el cuerpo y asigna automáticamente la universidad del editor si no viene;
   - al **editar**, impide mover un registro a otra universidad o quitar a la propia de una actividad;
   - bloquea clonar registros para editores;
   - registra en la bitácora toda escritura exitosa.
3. La lista de content-types "con dueño" y su atributo está en un solo lugar: `src/security/ownership.ts`.

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
- Filtros, orden y populate limitados a una lista blanca por recurso; el resto responde `400 QUERY_NOT_ALLOWED`. Paginación máxima 50.
- Token de API de solo lectura para el render en servidor de Next.js: lo crea el Super Admin en _Settings → API Tokens_ (tipo _Read-only_) al desplegar (Sprint 8).

## 8. Secretos y entornos

- Todos los secretos viven en `.env` (ignorado por Git) o en el gestor de secretos del hosting; `.env.example` no contiene valores.
- Strapi se conecta a PostgreSQL con el usuario limitado `foro_app` (sin superuser/createdb/createrole).
- Un juego de secretos y una base de datos distintos por entorno (`development`, `staging`, `production`).

## 9. Formulario de contacto (`POST /api/contact`)

- Validación estricta (nombre 2–200, correo válido ≤255, asunto ≤250, mensaje 10–2000) y sanitización (sin HTML ni caracteres de control).
- **Honeypot** `website`: si viene relleno se responde 201 sin guardar nada (no se da pista al bot).
- **Límite de tasa**: 5 envíos por hora por IP → 429 con `Retry-After`.
- Los mensajes se leen solo en el panel; la notificación por correo nunca se registra en logs con su contenido.

## 10. Endurecimiento (Sprint 5) — checklist de amenazas

| Amenaza                             | Mitigación implementada                                                                                                                                                                                                                                                 | Dónde                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Inyección SQL                       | ORM de Strapi (consultas parametrizadas). Las únicas consultas crudas son `CREATE INDEX IF NOT EXISTS` con nombres fijos del código                                                                                                                                     | `database/indexes.ts`                                  |
| XSS almacenado                      | Todo campo `richtext` se sanitiza al guardar (sanitize-html: sin `script`, `iframe`, `on*`, `javascript:`) en **todas** las vías de escritura (panel, seed, API interna). El frontend debe sanitizar de nuevo al renderizar                                             | `src/security/richtext-sanitizer.ts`                   |
| CSRF                                | API pública sin cookies de sesión; panel con protecciones nativas de Strapi. CORS sin `credentials`                                                                                                                                                                     | `config/middlewares.ts`                                |
| CORS abierto                        | Solo `FRONTEND_URL` (lista) en producción; `localhost:3000` se añade en desarrollo. Nunca `*`                                                                                                                                                                           | `config/middlewares.ts`                                |
| Clickjacking / sniffing / downgrade | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` 1 año con `includeSubDomains`, CSP con `img-src` limitado a self + host de medios                                                                                               | `config/middlewares.ts`                                |
| Divulgación de tecnología           | Sin cabecera `X-Powered-By`                                                                                                                                                                                                                                             | `config/middlewares.ts`                                |
| Fuerza bruta en login               | 5 intentos / 15 min por correo + IP                                                                                                                                                                                                                                     | `config/admin.ts`                                      |
| Abuso / DoS básico                  | Límite de tasa: contacto 5/h por IP; resto de `/api/*` 120/min por IP; paginación máxima 50                                                                                                                                                                             | `src/middlewares/rate-limit.ts`                        |
| Subida de archivos maliciosos       | Solo `image/png`, `image/jpeg`, `image/webp`; **SVG bloqueado** (puede contener scripts); 5 MB máx.; verificación de **magic bytes** contra MIME y extensión declarados; nombre con hash aleatorio (nativo); en producción los archivos viven en R2, fuera del servidor | `config/plugins.ts`, `src/middlewares/upload-guard.ts` |
| IDOR / control de acceso roto       | Condición RBAC + guard de escrituras (sección 4); un editor no puede enviar `university` ajeno en el cuerpo                                                                                                                                                             | `src/security/*`                                       |
| Superficie innecesaria              | Eliminadas las rutas públicas de users-permissions (`/api/auth/*`, `/api/users/*`) y de upload (`/api/upload/*`); desinstalado `@strapi/plugin-cloud`; sin rutas de escritura en `/api/*`                                                                               | `src/index.ts`                                         |
| Secretos en el repositorio          | `.env` ignorado; `.env.example` sin valores; revisión manual (grep) sin hallazgos; escaneo con gitleaks en CI (Sprint 8)                                                                                                                                                | `.gitignore`, CI                                       |
| Dependencias vulnerables            | `npm audit`: **0 altas/críticas** tras fijar `nodemailer ≥10`, `sharp ≥0.35.4`, `vite ≥6.4.3` (overrides). Quedan avisos moderados en dependencias transitivas de Strapi que se corrigen con sus actualizaciones. Dependabot semanal                                    | `package.json`, `.github/dependabot.yml`               |
| HTTPS                               | Lo termina el proveedor de hosting (Railway, certificado automático). `TRUST_PROXY=true` en producción para que Strapi vea la IP real y el esquema https                                                                                                                | `config/server.ts`                                     |

Verificado manualmente en el Sprint 5: CORS bloquea un origen ajeno; el 6.º envío de contacto y el 6.º intento de login responden 429; un ejecutable renombrado `.png`, un PNG con extensión `.jpg` y un SVG son rechazados con 400; un richtext con `<script>`, `onerror` y `javascript:` se guarda limpio.

Pendientes: `HSTS` solo tiene efecto sobre HTTPS (producción). Limitador de tasa en memoria: válido para un proceso; si se escala a varias instancias, mover el almacén a Redis.

## 11. Pendientes (sprints siguientes)

- Sprint 6: logs estructurados con `requestId`, manejador global de errores, Sentry.
- Sprint 7: pruebas automatizadas de la matriz de permisos, contacto y uploads.
- Sprint 8: gitleaks en CI, token de API de solo lectura, secretos de producción en Railway.
