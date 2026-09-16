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

Necesitas el backend corriendo (`npm run develop` en la raíz) con datos (`npm run seed`).

> Usa `127.0.0.1` y no `localhost` en `NEXT_PUBLIC_API_URL`: el servidor de Next resuelve `localhost` a `::1` y Strapi escucha en IPv4.

## Comandos

| Comando         | Qué hace                                    |
| --------------- | ------------------------------------------- |
| `npm run dev`   | Servidor de desarrollo (Turbopack)          |
| `npm run build` | Build de producción                         |
| `npm run start` | Sirve el build (`-p 3001` para otro puerto) |
| `npm run lint`  | ESLint (config de Next + React Compiler)    |

El formato lo aplica Prettier con la configuración de la raíz del repo (`npx prettier --write "frontend/**/*.{ts,tsx,css,md}"` desde la raíz); el hook de Husky lo verifica al hacer commit.

## Estructura

```
app/            rutas (App Router), error.tsx, not-found.tsx, loading.tsx
components/
  nav/          Navbar (pill → barra, gooey, magnético), MobileMenu, Footer
  ui/           Button ("sello líquido"), Section, PageHeader, Magnetic, Prose, GooeyDefs
  hero/         Hero, AuroraLayer (OGL), Constellation (R3F)
  sections/     Un componente por capítulo de la portada
  cursor/       CustomCursor
  feedback/     ToasterMount (Sileo), ErrorScreen
  providers/    SmoothScroll (Lenis + GSAP), SectionThemeObserver
hooks/          useMagnetic, useClickSpark, useSplitReveal, useReducedMotion
lib/            api.ts (cliente tipado + errores), types.ts, format.ts, nav.ts, milestones.ts, gsap.ts
styles/         tokens.css (paleta, tipografía, ritmo)
```

## Variables de entorno

| Variable              | Descripción                             |
| --------------------- | --------------------------------------- |
| `NEXT_PUBLIC_API_URL` | URL del backend Strapi, sin barra final |

En producción, apunta al dominio público del backend (p. ej. el de Railway) y añade ese host a `images.remotePatterns` en `next.config.ts` si no es `*.railway.app`.
