# Seguridad — Foro Interuniversitario de Estudios de Posgrado (Backend)

Documento vivo. Sprint 3 cubre autenticación, roles y control de acceso por universidad.
Los sprints 5 (hardening) y 6 (observabilidad) ampliarán este archivo.

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
| Aporte                | R C U D                   | —                                                                                  | R                                                                                          |
| Noticia               | R C U D P                 | —                                                                                  | R (solo publicadas)                                                                        |
| Elemento de galería   | R C U D                   | —                                                                                  | R                                                                                          |
| Mensaje de contacto   | R U D                     | —                                                                                  | — (ni lectura ni creación directa; el formulario usará `POST /api/contact` en el Sprint 4) |
| Perfil de editor      | R C U D                   | —                                                                                  | —                                                                                          |
| Bitácora de auditoría | R (la escribe el sistema) | —                                                                                  | —                                                                                          |
| Biblioteca de medios  | todo                      | ver, subir, actualizar (no borrar)                                                 | —                                                                                          |

Supuestos aplicados (pendientes de confirmar con el Foro):

- **Noticias y aportes** los publica únicamente el equipo coordinador (Super Admin).
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
- Límite de intentos de login: **Sprint 5**.

## 6. Bitácora de auditoría

Strapi Community no incluye audit logs (es Enterprise). Se implementó el content-type **Bitácora de auditoría** (`api::audit-log.audit-log`), escrito por el sistema y visible solo al Super Admin.

Registra: usuario (id y correo), acción (`create`, `update`, `delete`, `publish`, `unpublish`, `bulk-*`, `login`), content-type, `documentId` afectado, un resumen (título/nombre del registro, tomado del cuerpo de la petición), IP y código de respuesta. **No** guarda contenido de campos ni contraseñas.

## 7. API pública

- Rol Public: únicamente `find` y `findOne` sobre Universidad, Representante, Programa académico, Actividad, Aporte, Noticia y Elemento de galería. Se sincroniza en cada arranque; cualquier otro permiso sobre `api::*` que alguien active a mano se **revoca** al reiniciar.
- Noticias: solo las publicadas (Draft & Publish nativo; la API pública nunca sirve borradores).
- Mensajes de contacto, perfiles de editor y bitácora: sin acceso público.
- Escrituras por API (`POST/PUT/DELETE /api/*`): 403 para todos.
- Token de API de solo lectura para el render en servidor de Next.js: se crea en el Sprint 4/8.

## 8. Secretos y entornos

- Todos los secretos viven en `.env` (ignorado por Git) o en el gestor de secretos del hosting; `.env.example` no contiene valores.
- Strapi se conecta a PostgreSQL con el usuario limitado `foro_app` (sin superuser/createdb/createrole).
- Un juego de secretos y una base de datos distintos por entorno (`development`, `staging`, `production`).

## 9. Pendientes (sprints siguientes)

- Sprint 4: `POST /api/contact` con honeypot y validación; token de API de solo lectura; filtros y paginación en lista blanca.
- Sprint 5: CORS restringido, cabeceras HTTP, HTTPS, límite de tasa en `/admin/login` y contacto, validación de subida de archivos, escaneo de dependencias.
- Sprint 7: pruebas automatizadas de la matriz de permisos.
