# Frontend — Foro Interuniversitario de Estudios de Posgrado

Sitio público del Foro, construido con **Next.js 16 (App Router) + TypeScript + Tailwind v4**.
Consume la API del backend Strapi (este mismo repositorio, carpeta raíz).

La dirección de diseño, la investigación y el mapa de animaciones están en [DESIGN_NOTES.md](DESIGN_NOTES.md).

## Arranque local

```bash
cd frontend
cp .env.example .env.local   # apunta a http://127.0.0.1:1337
npm install
npm run dev                  # http://localhost:3000
```

Necesitas el backend corriendo (`npm run develop` en la raíz) con datos (`npm run seed`). La guía
completa para una computadora nueva (backend, base de datos, datos y frontend) está en el
[README de la raíz](../README.md#levantar-todo-en-otra-computadora-paso-a-paso).

> Usa `127.0.0.1` y no `localhost` en `NEXT_PUBLIC_API_URL`: el servidor de Next resuelve `localhost` a `::1` y Strapi escucha en IPv4.

## Comandos

| Comando             | Qué hace                                                         |
| ------------------- | ---------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo (Turbopack)                               |
| `npm run build`     | Build de producción (funciona aunque la API no responda)         |
| `npm run start`     | Sirve el build (`-p 3001` para otro puerto)                      |
| `npm run lint`      | ESLint (config de Next + React Compiler)                         |
| `npm run typecheck` | TypeScript sin emitir                                            |
| `npm test`          | Pruebas con Vitest (`tests/`; ver TESTING.md de la raíz)         |
| `npm run icons`     | Regenera favicon, ícono de Apple y del manifiesto desde la marca |

El formato lo aplica Prettier con la configuración de la raíz del repo (`npx prettier --write "frontend/**/*.{ts,tsx,css,md}"` desde la raíz); el hook de Husky lo verifica al hacer commit.

## Estructura

```
app/            rutas (App Router), error.tsx, not-found.tsx, loading.tsx, privacidad/
                robots.ts, sitemap.ts, manifest.ts, opengraph-image.tsx, icon.svg, favicon.ico
proxy.ts        404 real para ids imposibles en las páginas de detalle (sin tocar la API)
components/
  nav/          Navbar (pill → barra, gooey, magnético), MobileMenu, Footer
  ui/           Button ("sello líquido"), Section, PageHeader, Magnetic, Prose, GooeyDefs
  hero/         Hero, AuroraLayer (OGL), Constellation (R3F)
  sections/     Un componente por capítulo de la portada
  cursor/       CustomCursor
  feedback/     ToasterMount (Sileo), ErrorScreen
  seo/          JsonLd (datos estructurados)
  providers/    SmoothScroll (Lenis + GSAP), SectionThemeObserver
hooks/          useMagnetic, useClickSpark, useSplitReveal, useReducedMotion
lib/            api.ts (cliente tipado, errores, critical/safe/findOne), types.ts, format.ts, nav.ts,
                milestones.ts, gsap.ts, site.ts (URL e indexación), seo.ts (metadatos por página),
                json-ld.ts (schema.org), document-id.ts
tests/          Vitest: lógica de lib/, proxy y cabeceras de seguridad
scripts/        generate-icons.mjs
styles/         tokens.css (paleta, tipografía, ritmo)
```

## Variables de entorno

| Variable                               | Descripción                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`                  | URL del backend Strapi, sin barra final                                                                      |
| `NEXT_PUBLIC_MEDIA_URL`                | Producción: URL pública de los archivos en R2 (el `S3_PUBLIC_URL` del backend)                               |
| `NEXT_PUBLIC_SITE_URL`                 | URL pública de este sitio: canónicas, sitemap, robots y Open Graph                                           |
| `NEXT_PUBLIC_NOINDEX`                  | `true` en staging: que Google no lo indexe                                                                   |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Opcional: verificación de Google Search Console por etiqueta HTML                                            |
| `FRONTEND_API_TOKEN`                   | Solo servidor (sin `NEXT_PUBLIC_`): el mismo valor que en el backend; da un cupo propio en su límite de tasa |

Las `NEXT_PUBLIC_*` se incrustan al compilar. `npm run setup:env` (raíz) crea `.env.local` con el token ya igualado al del backend. Detalle de producción en [DESPLIEGUE.md](../DESPLIEGUE.md#331-variables-del-frontend-nextjs) y de las cabeceras de seguridad en [SEGURIDAD.md](../SEGURIDAD.md#12-frontend-nextjs).
