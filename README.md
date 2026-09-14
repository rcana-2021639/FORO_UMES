# Foro Interuniversitario de Estudios de Posgrado — Backend

Backend del sitio web del Foro, construido con **Strapi 5 (TypeScript)** sobre **Node.js 24** y **PostgreSQL 18**.
Sirve la API REST que consume el frontend (Next.js) y provee el panel administrativo con permisos por universidad.

> Este repositorio sigue el _Plan Técnico de Desarrollo del Backend_ (8 sprints).
> Estado actual: **Sprint 1 — Fundamentos** (entorno, repositorio y arquitectura base).

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

| Comando                | Qué hace                                                   |
| ---------------------- | ---------------------------------------------------------- |
| `npm run develop`      | Strapi en modo desarrollo (recarga al cambiar archivos)    |
| `npm run start`        | Strapi en modo producción (requiere `npm run build` antes) |
| `npm run build`        | Compila el panel administrativo                            |
| `npm run lint`         | Ejecuta ESLint sobre todo el proyecto                      |
| `npm run lint:fix`     | ESLint corrigiendo automáticamente lo que pueda            |
| `npm run format`       | Formatea todo con Prettier                                 |
| `npm run format:check` | Verifica formato sin modificar archivos (útil en CI)       |
| `npm run typecheck`    | Verifica tipos de TypeScript sin compilar                  |
| `npm run db:up`        | Levanta PostgreSQL en Docker                               |
| `npm run db:down`      | Apaga PostgreSQL                                           |
| `npm run db:logs`      | Logs de PostgreSQL                                         |

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
├── database/migrations/  # Migraciones explícitas (índices adicionales, etc.)
├── docker/init/          # Scripts que corren al crear el contenedor de PostgreSQL por primera vez
├── public/               # Archivos estáticos (uploads locales en desarrollo)
├── src/
│   ├── api/              # Content-types, controladores, rutas y servicios (Sprint 2+)
│   ├── policies/         # Políticas personalizadas, p. ej. es-propietario-universidad (Sprint 3)
│   ├── middlewares/      # Middlewares propios, p. ej. rate-limit-contacto (Sprint 5)
│   ├── extensions/       # Extensiones de plugins de Strapi
│   └── index.ts          # Hooks register/bootstrap de la aplicación
├── types/generated/      # Tipos generados por Strapi (no editar a mano)
├── .env.example          # Plantilla de variables de entorno (sin valores reales)
├── docker-compose.yml    # PostgreSQL 18 local
└── package.json
```

---

## Seguridad — reglas desde el día 1

1. **Ningún secreto en el repositorio.** Todo va en `.env` (ignorado por Git) o en el gestor de secretos del hosting.
2. **Strapi se conecta con un usuario limitado** (`foro_app`), nunca con el superusuario de PostgreSQL.
3. Cada entorno (`development`, `staging`, `production`) tiene **sus propios secretos y su propia base de datos**.
4. Los archivos SVG y ejecutables están **bloqueados** en la subida de medios (`config/plugins.ts`).

---

## Roadmap (según el plan técnico)

| Sprint | Objetivo                                                     | Estado       |
| ------ | ------------------------------------------------------------ | ------------ |
| 1      | Fundamentos: entorno, repositorio y arquitectura base        | ✅ En curso  |
| 2      | Modelado de contenido y base de datos                        | ⏳ Pendiente |
| 3      | Autenticación, roles y control de acceso por universidad     | ⏳ Pendiente |
| 4      | API pública y lógica de negocio (contacto, filtros, resumen) | ⏳ Pendiente |
| 5      | Seguridad y hardening                                        | ⏳ Pendiente |
| 6      | Observabilidad, manejo de errores y rendimiento              | ⏳ Pendiente |
| 7      | Pruebas automatizadas                                        | ⏳ Pendiente |
| 8      | CI/CD, despliegue y entrega                                  | ⏳ Pendiente |
