# Pruebas automatizadas — Backend del Foro Interuniversitario

Sprint 7. Marco: **Jest 30 + ts-jest + supertest**. Umbral de cobertura obligatorio: **70 %** (líneas, sentencias y funciones; 60 % ramas) sobre la lógica propia del Foro. La suite falla si baja de ahí.

## Cómo ejecutar

```bash
npm run db:up            # PostgreSQL en Docker (una sola vez)
npm run db:test:create   # crea la base foro_posgrado_test si el volumen ya existía (una sola vez)
npm test                 # toda la suite
npm run test:unit        # solo unitarias (~3 s, sin base de datos)
npm run test:integration # integración + API (arrancan Strapi contra foro_posgrado_test)
npm run test:coverage    # toda la suite con informe de cobertura en coverage/
```

Las pruebas de integración/API arrancan Strapi **dentro del proceso de Jest** contra la base `foro_posgrado_test`, aislada de la de desarrollo (nunca tocan `foro_posgrado_dev`). Cada archivo arranca su propia instancia, limpia el contenido al inicio y al final, y se ejecutan en serie (`maxWorkers: 1`) porque Strapi solo admite una instancia por proceso. Variables forzadas en `tests/helpers/env.ts`: `NODE_ENV=test`, `DATABASE_NAME=foro_posgrado_test`, `LOG_LEVEL=error`, `TRUST_PROXY=true` (para simular IPs distintas con `X-Forwarded-For`), sin SMTP, Sentry ni S3. Los secretos de Strapi se leen del `.env` normal.

Duración de referencia: unitarias 3 s; suite completa ~45 s en local (133 pruebas).

## Qué cubre cada suite

### `tests/unit` — funciones puras y middlewares con contexto simulado (82 pruebas)

| Archivo                      | Cubre                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contact-validation.test.ts` | Validación y sanitización del formulario de contacto; honeypot                                                                                      |
| `query-whitelist.test.ts`    | Lista blanca de `filters` (anidados, `$and/$or/$not`, operadores), `sort` y `populate`                                                              |
| `rate-limiter.test.ts`       | Ventana fija por clave, expiración, limpieza, reinicio                                                                                              |
| `image-signature.test.ts`    | Magic bytes PNG/JPEG/WebP; coincidencia con MIME y extensión                                                                                        |
| `relation-input.test.ts`     | Lectura de relaciones en todos los formatos que acepta Strapi                                                                                       |
| `admin-security.test.ts`     | Política de contraseñas en cada ruta; auditoría de login sin contraseña                                                                             |
| `admin-guard.test.ts`        | **Guard de propiedad**: crear/editar/clonar a nombre de otra universidad, auto-asignación, actividades, editor sin perfil, Super Admin, auditoría   |
| `richtext-sanitizer.test.ts` | Eliminación de `script`, `iframe`, `on*`, `javascript:`; conservación de formato                                                                    |
| `api-errors.test.ts`         | Normalización al formato estándar; 5xx sin detalle; panel intacto                                                                                   |
| `middlewares.test.ts`        | rate-limit, query-whitelist, request-context (requestId), upload-guard (archivos reales), compress                                                  |
| `api-logic.test.ts`          | Controlador de contacto, servicio de resumen (cache), bitácora, lifecycles de galería/actividad/contacto, sanitizador como middleware de documentos |

### `tests/integration/university-ownership.test.ts` — política de propiedad (11 pruebas)

`university-ownership.test.ts`: dos editores (UPC y UPN) atacan la API del panel por HTTP.

- Cada uno solo lista lo suyo (programas y universidad).
- Editar/borrar lo de la otra → **403**; el registro queda intacto.
- Crear a nombre de la otra → **403 `NOT_OWNER`**; crear sin universidad → se asigna la propia y la otra no la ve.
- Mover un registro propio a la otra universidad → 403.
- Actividad propuesta por A con B: ambas participan; B edita; A no puede quitarse ni borrar.
- Noticias: borrador propio visible solo para su autor; publicar → 403; nunca aparece en la API pública.
- Perfiles de editor, mensajes de contacto y bitácora → 403 para editores; editor sin perfil no escribe.
- La bitácora registra login y escrituras exitosas.

### `tests/integration/adversarial.test.ts` — ataques multi-universidad (18 pruebas)

Tres editores (UA, UB, UC) intentan todo lo que un usuario malintencionado o descuidado haría:

- `bulkDelete` mezclando documentos propios y ajenos → los ajenos sobreviven; `bulkPublish` de noticias → 403.
- `university` como `null`, `set`, id numérico en texto, arreglo → auto-asignación o 403 según corresponda; mismas reglas para representantes.
- Actividad compartida: `disconnect`, arreglo o `set` que quite a otra universidad → 403 y la lista queda intacta; agregar (`connect`) sí; un editor no participante no la ve, no la edita ni puede "invitarse".
- Noticia/aporte publicados por el Super Admin: el autor no puede borrarlos ni despublicarlos, pero sí editar el borrador; un borrador propio sí se borra.
- Archivo subido por otro editor: no se puede renombrar ni borrar.
- Escalada: `PUT /admin/users/me` con `roles` no cambia el rol; `/admin/users`, `/admin/roles`, `/admin/api-tokens` y content-type builder → 403.
- Perfil de editor duplicado para el mismo usuario → rechazado; cambiar la universidad del perfil cambia el acceso de inmediato.
- API pública: populate/fields anidados no exponen `createdBy`, correos de editores, contraseñas ni tokens; filtros por relaciones internas → 400; ids inexistentes o con inyección → 404.

### `tests/api` — endpoints reales con supertest (22 pruebas)

`public-api.test.ts`: `GET /api/universities` 200 paginado y ordenado; `pageSize` máximo 50; filtros de lista blanca (y rechazo de los demás); `GET /api/news-items` **nunca** incluye borradores (ni con `status=draft`); aportes solo publicados; sin rutas de escritura (405); recursos privados no expuestos; `/api/forum-summary` completo; formato estándar de error con `requestId`.

`security.test.ts`: contacto válido (201), inválido (400 con campos), honeypot (201 sin guardar), **6.º envío → 429** con `Retry-After` y otra IP no afectada; panel sin token/token inválido → 401; contraseña débil → 400; **6.º login fallido → 429**; uploads: ejecutable renombrado `.png` → 400 `INVALID_IMAGE`, SVG y extensión incorrecta → 400, **>5 MB → 413**, PNG válido → 201 con hash; richtext guardado sin `script`/`onclick`.

## Bugs encontrados por la suite antes de llegar a producción

1. Crear una actividad enviando `participatingUniversities` como arreglo (no como `{ connect }`) devolvía 403 al editor. Corregido en `admin-guard.ts`.
2. Strapi valida el tamaño máximo de imagen **después** de optimizarla con sharp: un archivo de 6 MB pasaba y consumía CPU. Ahora el parser multipart corta en 5 MB (`config/middlewares.ts → strapi::body.formidable.maxFileSize`).
3. Un editor podía **expulsar a otras universidades** de una actividad compartida enviando la lista sin ellas. Ahora solo puede agregar.
4. Un editor podía **borrar o despublicar su noticia/aporte ya publicados**, quitándolos del sitio sin pasar por el Super Admin.
5. Un editor podía **renombrar archivos de la biblioteca subidos por otros** (`plugin::upload.assets.update` sin condición).
6. Un mismo usuario podía tener **dos perfiles de editor** (dos universidades): la relación 1→1 no lo impedía en base. Validación + índice único.

## Cobertura

Se mide sobre `src/lib`, `src/security`, `src/middlewares`, el controlador de contacto, el servicio de resumen y los lifecycles (ver `collectCoverageFrom` en `jest.config.ts`). Quedan fuera los archivos que solo sincronizan configuración en el arranque (`university-editor-role.ts`, `public-permissions.ts`, `ownership-condition.ts`) — su efecto se verifica de extremo a extremo en `tests/integration` — y el código generado por Strapi. Resultado actual: ~97 % de sentencias, ~99 % de líneas.

## En CI

`.github/workflows/ci.yml` (Sprint 8) levanta un servicio PostgreSQL 18 con la base `foro_posgrado_test`, ejecuta lint, formato, typecheck y `npm run test:coverage`, y bloquea la fusión si algo falla o la cobertura baja del umbral.

## Añadir pruebas

- Lógica nueva en `src/lib` o `src/security` → prueba unitaria en `tests/unit` (rápida, sin Strapi).
- Comportamiento que depende de permisos, base de datos o rutas → `tests/integration` o `tests/api` usando `setupStrapi()`, `createUniversity()`, `createEditor()`, `login()` y `api()` de `tests/helpers/strapi.ts`.
- Cada archivo de integración/API debe llamar `cleanContent()` en `beforeAll` y `afterAll`.
