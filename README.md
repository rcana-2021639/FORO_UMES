# Foro Interuniversitario de Estudios de Posgrado — Backend

Backend del sitio web del Foro, construido con **Strapi 5 (TypeScript)** sobre **Node.js 24** y **PostgreSQL 18**.
Sirve la API REST que consume el frontend (Next.js) y provee el panel administrativo con permisos por universidad.

> Este repositorio sigue el _Plan Técnico de Desarrollo del Backend_ (8 sprints).
> Estado actual: **Sprint 7 — Pruebas automatizadas** completado. Ver [TESTING.md](TESTING.md), Ver [SEGURIDAD.md](SEGURIDAD.md), [OBSERVABILIDAD.md](OBSERVABILIDAD.md) y [openapi.yaml](openapi.yaml).

---

## Requisitos

| Herramienta    | Versión   | Notas                                                                       |
| -------------- | --------- | --------------------------------------------------------------------------- |
| Node.js        | 24.x LTS  | Fijada en `.nvmrc`. Si usas nvm: `nvm use`                                  |
| npm            | ≥ 10      | Viene con Node 24                                                           |
| Docker Desktop | reciente  | Solo para levantar PostgreSQL local (no necesitas instalar Postgres aparte) |
| Git            | cualquier | —                                                                           |

---

## Instalación local (menos de 30 minutos)

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/rcana-2021639/FORO_UMES.git
cd FORO_UMES
npm install
```

`npm install` también instala los hooks de Git (Husky) automáticamente.

### 2. Crear el archivo `.env`

```bash
cp .env.example .env
```

Abre `.env` y llena **todos** los valores vacíos. Genera cada secreto con un valor aleatorio distinto:

```bash
openssl rand -base64 32
```

o, si no tienes `openssl`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Variables que debes llenar:

| Variable                                                                                                | Para qué sirve                                                                                           |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` | Secretos internos de Strapi. Uno distinto por entorno. `APP_KEYS` puede tener varios separados por coma. |
| `DATABASE_PASSWORD`                                                                                     | Contraseña del usuario **limitado** `foro_app` con el que Strapi se conecta a la base.                   |
| `POSTGRES_ADMIN_PASSWORD`                                                                               | Contraseña del superusuario del contenedor Docker. Strapi **nunca** usa este usuario.                    |

> ⚠️ `.env` está en `.gitignore`. **Nunca** lo subas al repositorio ni lo compartas por chat/correo.

### 3. Levantar PostgreSQL con Docker

```bash
npm run db:up
```

Esto crea el contenedor `foro_posgrado_db` (imagen `postgres:18-alpine`) con un volumen persistente.
La **primera vez** que arranca ejecuta `docker/init/01-app-user.sh`, que crea el usuario `foro_app` con permisos únicamente sobre la base `foro_posgrado_dev`.

Comandos útiles:

```bash
npm run db:logs    # ver logs de Postgres
npm run db:down    # apagar el contenedor (los datos se conservan en el volumen)
```

Si necesitas **borrar todo y empezar de cero** (incluido el volumen):

```bash
docker compose down -v
```

### 4. Arrancar Strapi

```bash
npm run develop
```

Al terminar de compilar abre <http://localhost:1337/admin>. La primera vez te pedirá crear el usuario **Super Admin**: usa un correo institucional y una contraseña fuerte (mínimo 12 caracteres, mayúsculas, minúsculas, números y símbolos).

---

## Comandos del proyecto

| Comando                  | Qué hace                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `npm run develop`        | Strapi en modo desarrollo (recarga al cambiar archivos)           |
| `npm run start`          | Strapi en modo producción (requiere `npm run build` antes)        |
| `npm run build`          | Compila el panel administrativo                                   |
| `npm run lint`           | Ejecuta ESLint sobre todo el proyecto                             |
| `npm run lint:fix`       | ESLint corrigiendo automáticamente lo que pueda                   |
| `npm run format`         | Formatea todo con Prettier                                        |
| `npm run format:check`   | Verifica formato sin modificar archivos (útil en CI)              |
| `npm run typecheck`      | Verifica tipos de TypeScript sin compilar                         |
| `npm run db:up`          | Levanta PostgreSQL en Docker                                      |
| `npm run db:down`        | Apaga PostgreSQL                                                  |
| `npm run db:logs`        | Logs de PostgreSQL                                                |
| `npm run seed`           | Carga datos de prueba (idempotente). `-- --reset` borra y recarga |
| `npm run openapi:export` | Exporta la especificación OpenAPI a `openapi.yaml`                |

---

## Calidad de código

- **ESLint** (`eslint.config.mjs`) + **Prettier** (`.prettierrc`) con reglas compartidas para todo el equipo.
- **Husky** (`.husky/pre-commit`): al hacer `git commit` se ejecuta `npm run lint` y `prettier --check` sobre los archivos staged. Si el linter falla o hay archivos sin formatear, el commit se bloquea.
- **`.editorconfig`** y **`.gitattributes`** fuerzan finales de línea LF (importante en Windows para que los scripts de Docker funcionen).

---

## Convención de ramas

| Rama              | Uso                                                                      |
| ----------------- | ------------------------------------------------------------------------ |
| `main`            | Producción. Solo código estable.                                         |
| `develop`         | Integración (se habilitará cuando el equipo crezca).                     |
| `feature/<tarea>` | Una rama por tarea individual, p. ej. `feature/content-type-universidad` |

> Todo el desarrollo del backend se hace en la rama `jonathan`. `main` se actualiza desde ahí cuando un sprint queda estable. Cuando el equipo crezca se activará la protección de rama (PR + revisión obligatoria) y `develop`, como indica el plan técnico.

---

## Estructura del proyecto

```
.
├── config/               # Configuración de Strapi (admin, database, middlewares, plugins, server)
├── database/             # indexes.ts (índices adicionales) y migrations/ (para migraciones de datos futuras)
├── docker/init/          # Scripts que corren al crear el contenedor de PostgreSQL por primera vez
├── scripts/seed.ts       # Datos de prueba
├── tests/                # unit/, integration/, api/ (Jest + supertest)
├── public/               # Archivos estáticos (uploads locales en desarrollo)
├── src/
│   ├── api/              # 8 content-types: schema.json + controller/routes/service (+ lifecycles.ts)
│   ├── lib/              # Lógica pura reutilizable: validación de contacto, lista blanca de consultas, errores
│   ├── openapi/          # Documentación OpenAPI de las rutas personalizadas
│   ├── security/         # Roles, condición de propiedad por universidad, guard del panel, auditoría
│   ├── middlewares/      # request-context, api-errors, compress, rate-limit, upload-guard, query-whitelist, admin-security
│   ├── extensions/       # Extensiones de plugins de Strapi
│   └── index.ts          # Hooks register/bootstrap de la aplicación
├── types/generated/      # Tipos generados por Strapi (no editar a mano)
├── .env.example          # Plantilla de variables de entorno (sin valores reales)
├── docker-compose.yml    # PostgreSQL 18 local
└── package.json
```

---

## Modelo de contenido

Convención: **código, campos y rutas de API en inglés**; **etiquetas visibles y textos en español**; valores de enumeración **sin tildes** (el frontend muestra la etiqueta bonita).

| Content-type (`displayName`) | UID                                      | Ruta API                 | Relaciones                                                               |
| ---------------------------- | ---------------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| Universidad                  | `api::university.university`             | `/api/universities`      | 1→N representatives, 1→N academicPrograms, N↔N activities                |
| Representante                | `api::representative.representative`     | `/api/representatives`   | N→1 university (requerido)                                               |
| Programa academico           | `api::academic-program.academic-program` | `/api/academic-programs` | N→1 university (requerido). Enums `level`, `modality`                    |
| Actividad                    | `api::activity.activity`                 | `/api/activities`        | N↔N participatingUniversities (mín. 1), 1→N contributions, galleryItems  |
| Aporte                       | `api::contribution.contribution`         | `/api/contributions`     | N→1 relatedActivity (opcional)                                           |
| Noticia                      | `api::news.news`                         | `/api/news-items`        | **Draft & Publish nativo** de Strapi (reemplaza el booleano `publicado`) |
| Elemento de galeria          | `api::gallery-item.gallery-item`         | `/api/gallery-items`     | N→1 relatedActivity. `file` obligatorio si Foto, `videoUrl` si Video     |
| Mensaje de contacto          | `api::contact-message.contact-message`   | `/api/contact-messages`  | Sin relaciones. **Colección privada** (sin lectura pública, Sprint 3)    |

Enumeraciones:

- `academic-program.level`: `Maestria`, `Doctorado`, `Especializacion`, `Diplomado`
- `academic-program.modality`: `Presencial`, `Virtual`, `Hibrida`
- `activity.type`: `Encuentro`, `Conferencia`, `Seminario`, `Reunion`, `Proyecto`
- `contribution.type`: `Resultado`, `Iniciativa`, `Beneficio`
- `gallery-item.type`: `Foto`, `Video`

Validaciones que el esquema no puede expresar viven en `lifecycles.ts` del content-type (galería condicional, actividad con ≥1 universidad).

### Índices adicionales

Definidos en [`database/indexes.ts`](database/indexes.ts) y aplicados en `bootstrap` con `CREATE INDEX IF NOT EXISTS`.
**Por qué no en `database/migrations`:** Strapi 5 ejecuta las migraciones _antes_ de crear las tablas, así que en una base nueva fallarían. `bootstrap` corre siempre después de sincronizar el esquema y es idempotente. Strapi no elimina índices que no creó él mismo.

En Strapi 5 las relaciones viven en tablas `_lnk` (p. ej. `academic_programs_university_lnk`) con sus propios índices, por eso el índice compuesto `(universidad, nivel)` del plan se traduce en un índice sobre `academic_programs.level`.

### Datos de prueba

`npm run seed` carga las 9 universidades reales del Foro (en su orden oficial, `displayOrder`) con un representante y 2 programas **provisionales** cada una, 3 actividades, 2 aportes, 1 video de galería y 2 noticias (1 publicada, 1 borrador). Usa la API de documentos de Strapi, así que pasan por todas las validaciones. Representantes, programas, sitios web y descripciones se reemplazarán cuando el Foro entregue los datos.

---

## API pública

Documentación interactiva en `http://localhost:1337/documentation` y especificación versionada en [`openapi.yaml`](openapi.yaml).

| Ruta                                                     | Descripción                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GET /api/universities`, `/api/universities/:documentId` | Universidades (ordenar con `sort=displayOrder`)                                                                     |
| `GET /api/representatives`                               | Representantes; filtrable por `university`                                                                          |
| `GET /api/academic-programs`                             | Programas; filtrable por `university`, `level`, `modality`                                                          |
| `GET /api/activities`                                    | Actividades; filtrable por `date`, `type`, `participatingUniversities`                                              |
| `GET /api/contributions`                                 | Aportes publicados                                                                                                  |
| `GET /api/news-items`                                    | Noticias **publicadas** (los borradores nunca se sirven, aunque se pida `status=draft`)                             |
| `GET /api/gallery-items`                                 | Galería                                                                                                             |
| `GET /api/forum-summary`                                 | Contadores + últimas 3 noticias + próximas 3 actividades (cache 60 s)                                               |
| `POST /api/contact`                                      | Formulario de contacto: `{ name, email, subject?, message, website: '' }` — `website` es el honeypot, debe ir vacío |

Reglas comunes:

- **Solo lectura**: no existen rutas `POST/PUT/DELETE` en `/api/*` (salvo `/api/contact`). El contenido se administra en el panel.
- **Paginación** obligatoria: `pagination[page]`, `pagination[pageSize]` (máximo **50**, forzado en el servidor; por defecto 25).
- **Lista blanca** de `filters`, `sort` y `populate` por recurso ([`src/lib/query-whitelist.ts`](src/lib/query-whitelist.ts)); cualquier otro campo responde `400 QUERY_NOT_ALLOWED` indicando los permitidos. `populate=*` se sustituye por el populate mínimo.
- **Errores** en formato estándar: `{ "error": { "status", "code", "message", "requestId", "details?" } }`.
- Los mensajes de contacto son privados: se leen solo desde el panel. Al recibir uno se notifica por correo a `CONTACT_NOTIFY_EMAIL` (vía SMTP, p. ej. Resend); sin SMTP configurado se registra en el log.

---

## Seguridad — reglas desde el día 1

1. **Ningún secreto en el repositorio.** Todo va en `.env` (ignorado por Git) o en el gestor de secretos del hosting.
2. **Strapi se conecta con un usuario limitado** (`foro_app`), nunca con el superusuario de PostgreSQL.
3. Cada entorno (`development`, `staging`, `production`) tiene **sus propios secretos y su propia base de datos**.
4. Los archivos SVG y ejecutables están **bloqueados** en la subida de medios (`config/plugins.ts`).
5. **Control de acceso por objeto**: un Editor de Universidad solo ve y modifica lo de su universidad; detalle y matriz de permisos en [SEGURIDAD.md](SEGURIDAD.md).

---

## Roadmap (según el plan técnico)

| Sprint | Objetivo                                                     | Estado       |
| ------ | ------------------------------------------------------------ | ------------ |
| 1      | Fundamentos: entorno, repositorio y arquitectura base        | ✅ Hecho     |
| 2      | Modelado de contenido y base de datos                        | ✅ Hecho     |
| 3      | Autenticación, roles y control de acceso por universidad     | ✅ Hecho     |
| 4      | API pública y lógica de negocio (contacto, filtros, resumen) | ✅ Hecho     |
| 5      | Seguridad y hardening                                        | ✅ Hecho     |
| 6      | Observabilidad, manejo de errores y rendimiento              | ✅ Hecho     |
| 7      | Pruebas automatizadas                                        | ✅ Hecho     |
| 8      | CI/CD, despliegue y entrega                                  | ⏳ Pendiente |
