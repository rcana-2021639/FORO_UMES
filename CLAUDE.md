# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Backend for the Foro Interuniversitario de Estudios de Posgrado: **Strapi 5 (TypeScript)** on **Node.js 24** + **PostgreSQL 18**. Serves a public read-only REST API consumed by a Next.js frontend (in `frontend/`, a separate app with its own `CLAUDE.md`) and an admin panel with per-university permissions. Comments, docs, and commit history in this repo are in Spanish — match that when editing existing files.

The repo implements an 8-sprint technical plan (see README.md) that is fully done; `SEGURIDAD.md`, `TESTING.md`, `OBSERVABILIDAD.md`, `DESPLIEGUE.md`, and `openapi.yaml` are the living references for security, testing, observability, and deployment respectively — check them before changing behavior in those areas rather than re-deriving it from scratch.

## Commands

```bash
npm run develop           # Strapi dev server with reload (localhost:1337/admin)
npm run build             # build the admin panel
npm run start             # production mode (requires build first)

npm run db:up             # start PostgreSQL in Docker (foro_posgrado_db)
npm run db:down           # stop it (volume persists)
npm run db:logs

npm test                  # full Jest suite
npm run test:unit         # tests/unit only — pure functions/middlewares, no DB, ~3s
npm run test:integration  # tests/integration + tests/api — boots real Strapi against foro_posgrado_test
npm run test:coverage     # with coverage report (70% lines/statements/functions, 60% branches)
npx jest tests/unit/admin-guard.test.ts   # single file
npx jest -t "some test name"              # single test by name

npm run lint / lint:fix
npm run format / format:check
npm run typecheck
npm run openapi:export    # regenerate openapi.yaml from the running schema
npm run seed               # idempotent test data; `-- --reset` wipes and reloads

cd frontend && npm test   # Vitest (lib/, proxy, security headers); also lint / typecheck / build
```

Before running integration/API tests once: `npm run db:up` then `npm run db:test:create` (creates the `foro_posgrado_test` database). Integration/API tests boot a real Strapi instance inside the Jest process against that DB (never `foro_posgrado_dev`), run serially (`maxWorkers: 1` — Strapi allows only one instance per process), and force env vars via `tests/helpers/env.ts` (`NODE_ENV=test`, `TRUST_PROXY=true` to simulate distinct IPs via `X-Forwarded-For`, no SMTP/Sentry/S3). Strapi secrets are read from the normal `.env`.

Husky's pre-commit hook runs lint + prettier --check on staged files and blocks the commit on failure.

## Architecture

### Content types and ownership model

`src/api/*` holds 11 content-types (schema + controller/routes/service, some with `lifecycles.ts`): `university`, `representative`, `academic-program`, `activity`, `news`, `contribution`, `gallery-item`, `editor-profile`, `contact`/`contact-message`, `forum-summary`, `audit-log`.

The core architectural concept is **per-university row-level ownership** in the admin panel, implemented across `src/security/`:

- `ownership.ts` — `OWNED_CONTENT_TYPES` is the single source of truth for which content-types are tied to a university and by which attribute (`representative`, `academic-program` via `university`; `activity` via `participatingUniversities`, many-to-many). Also resolves an admin user's assigned university via their `editor-profile`.
- `ownership-condition.ts` — registers a custom RBAC condition (`admin::is-university-owner`) that Strapi evaluates per-request to filter which rows a "University Editor" can see/edit — object-level access control, not just role-level.
- `admin-guard.ts` — a middleware attached (in `src/index.ts`) to every content-manager collection-type route. The RBAC condition only limits visibility of _existing_ rows; this guard closes what a condition can't: blocking create/move-to-another-university attacks (omitting the university, or passing another university's id/documentId in the body), and blocking an editor from disconnecting their own university from a shared `activity` to hand it to someone else. It also writes every successful write to the audit log (`audit.ts` → `audit-log` content-type).
- `relation-input.ts` — normalizes the many shapes Strapi accepts for a relation value (id, documentId, array, `{connect,disconnect,set}`) so the guard can inspect them uniformly.
- `university-editor-role.ts` — provisions the "Editor de Universidad" admin role and its field/condition-scoped permissions on bootstrap.
- `public-permissions.ts` — grants the Public role `find`/`findOne` only, on a fixed allow-list of content-types. Deliberately does **not** enable public `create` on `contact-message`: the contact form goes through the custom `POST /api/contact` route instead (honeypot + rate limit), and enabling the generic endpoint would bypass those.
- `richtext-sanitizer.ts` — strips dangerous HTML from richtext fields on save (defense in depth; the frontend must still sanitize on render).

`src/index.ts` wires all of this up in `register`/`bootstrap` (idempotent — code is the source of truth for indexes, the editor role, and permissions each boot), and also strips unused plugin routes (`users-permissions` and `upload` content-api routes — the site has no end-user accounts and the panel uses its own upload routes).

### Request-processing pipeline

`config/middlewares.ts` defines the full Koa middleware order — read it before adding a new middleware, since order matters (e.g. `upload-guard` must run after body parsing, `admin-security` needs the parsed body). Custom middlewares live in `src/middlewares/`:

- `request-context.ts` — request ID + structured per-request logging (replaces `strapi::logger`)
- `api-errors.ts` — normalizes all `/api/*` errors to the project's standard error shape (`src/lib/api-error.ts`)
- `query-whitelist.ts` — whitelists `filters`/`sort`/`populate` on public `GET /api/*` requests (prevents deep-populate / arbitrary-filter abuse)
- `rate-limit.ts` — fixed-window per-route rate limiting (`src/lib/rate-limiter.ts`)
- `upload-guard.ts` — verifies image "magic bytes" match the declared MIME type/extension (`src/lib/image-signature.ts`); only `png`/`jpeg`/`webp` are allowed, SVG is explicitly denied (can carry scripts)
- `admin-security.ts` — password policy + login audit logging for `/admin/*`

Custom API routes (`contact`, `forum-summary`) live under `src/api/<name>/{controllers,routes}` like any content-type but aren't backed by a `content-types` folder; they're documented for `/documentation` via `src/openapi/custom-routes.ts` and `strapi.plugin('documentation').service('override').registerOverride(...)`.

### Frontend data loading and hardening

- In Server Components, load a page's main data with `critical()` (throws at runtime so ISR keeps the last good page instead of caching an empty one; falls back only during `next build`) and optional data with `safe()`. Detail pages use `findOne()`, which never calls the API with an impossible `documentId`; `proxy.ts` returns a real 404 for those.
- The Next server identifies itself to Strapi with `X-Frontend-Token` = `FRONTEND_API_TOKEN` (same value in both `.env` files) to get its own rate-limit bucket — all SSR traffic shares one IP.
- CSP and security headers live in `frontend/next.config.ts` (closed origin list, no nonces on purpose to keep ISR); a new external origin must be added there and in `images.remotePatterns`. SEO: `lib/site.ts` (indexable only on HTTPS without `NEXT_PUBLIC_NOINDEX`), `lib/seo.ts` (`pageMetadata` — a page's `openGraph` replaces the layout's entirely), `lib/json-ld.ts`.
- `/privacidad` describes exactly what the system does with personal data (e.g. contact messages auto-deleted after `CONTACT_RETENTION_DAYS`); change it together with any such behavior.

### Config

`config/*.ts` are all `({ env }) => ...` factories reading `.env` (see `.env.example` for the full variable list). Notable non-obvious choices:

- `config/database.ts` supports postgres/mysql/sqlite via `DATABASE_CLIENT`; production uses Postgres with `foro_app`, a role scoped to only the app database (created by `docker/init/01-app-user.sh` on first container start, never the Postgres superuser).
- `config/plugins.ts` — upload provider switches to S3-compatible storage (Cloudflare R2) automatically when `S3_BUCKET` is set, else local disk; email provider is a no-op (logs only) unless `SMTP_HOST` is set; Sentry only activates with `SENTRY_DSN`, and `sendMetadata: false` (no request headers/body sent, personal data).
- `config/server.ts` — `proxy.koa` must be `true` behind Railway/Render so `X-Forwarded-For` reaches the rate limiter and audit log with the real client IP.
- `config/admin.ts` — 4-hour max admin session lifespan, 1-hour idle timeout, 5-attempts/15-min brute-force limit on `/admin/login`.

### Branching

`jonathan` = development (CI on every push, Railway staging deploys from here). `main` = production (only receives PRs from `jonathan` with green CI; merging triggers deploy). `feature/<task>` optional for parallel work, merges into `jonathan`. The redesign and seed work lives on the `Estuardo` branch, which the user asked to push to directly.

### Local data

`npm run setup:env` creates `.env` and `frontend/.env.local` with random secrets (never overwrites). `npm run seed` loads a realistic simulation (real university/program names, fictitious people on `.test` emails) entirely offline: photos and avatars are versioned in `scripts/seed-data/media/`. The step-by-step setup for a new machine is in README.md ("Levantar todo en otra computadora").
