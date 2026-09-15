# DESIGN_NOTES — Frontend del Foro Interuniversitario de Estudios de Posgrado

> Documento de dirección de diseño. Se escribe **antes** de codear y se actualiza si la dirección cambia.
> Estado: **propuesta pendiente de aprobación**.

---

## 1. Lectura de la marca (inferida del backend)

| Aspecto           | Conclusión                                                                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Qué es            | Alianza de **9 universidades de Guatemala** (USAC, URL, UVG, UMG, UNIS, UPANA, UMES, Galileo, UNI) que coordina estudios de posgrado.                                                                                                        |
| Tono              | **Institucional-académico con ambición**: serio, pero no burocrático. Debe verse como una publicación académica de prestigio, no como un SaaS ni como una universidad individual.                                                            |
| Público           | Profesionales que buscan maestría/doctorado, autoridades universitarias, prensa y academia. Leen en desktop en oficina y en móvil en tránsito.                                                                                               |
| Contenido real    | Universidades (con logo, orden oficial, año de ingreso), representantes, programas (nivel/modalidad), actividades (5 tipos), aportes (Resultado/Iniciativa/Beneficio), noticias, galería foto/video, contacto, `forum-summary` (contadores). |
| Restricción clave | El Foro es **neutral** entre 9 universidades: la paleta **no puede parecerse a ninguna de ellas** (no azul USAC, no verde-azul URL, no rojo UMG, no naranja Galileo).                                                                        |

---

## 2. Investigación — qué tomo de cada fuente y por qué

### 2.1 React Bits (`github.com/DavidHDev/react-bits`, `src/ts-tailwind/<Categoría>/<Componente>/`)

Verificado el índice real del repo (Backgrounds / Components / Animations / TextAnimations, 165+ piezas). Se extrae el **código fuente real** de cada componente al momento de usarlo (no de memoria). Selección, con uso previsto:

| Componente                         | Categoría      | Dónde                         | Por qué                                                                                                             |
| ---------------------------------- | -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `Aurora` (OGL)                     | Backgrounds    | Capa 1 del hero               | Fondo shader fluido, pero **re-coloreado a jade/ámbar/tinta** (nada de morado/azul). Marca "modernidad" sin gritar. |
| `Particles` (OGL)                  | Backgrounds    | Capa 2 del hero               | Puntos flotantes con parallax de mouse: "constelación" de la red universitaria.                                     |
| `GooeyNav`                         | Components     | Navbar desktop                | Indicador activo con filtro metaball SVG (req. sección 6).                                                          |
| `SplitText` (GSAP)                 | TextAnimations | Títulos H1/H2                 | Reveal por caracteres/palabras con stagger (scroll anim #3).                                                        |
| `CountUp`                          | TextAnimations | "El Foro en cifras"           | Contadores activados en viewport (scroll anim #8), alimentados por `/api/forum-summary`.                            |
| `MagicBento`                       | Components     | Grid de universidades         | Base del bento con spotlight por celda; se reescribe el estilo (sin glow morado).                                   |
| `ClickSpark`                       | Animations     | Botón primario                | Estallido de partículas al click (req. sección 7).                                                                  |
| `Magnet`                           | Animations     | Botones, links navbar, iconos | Efecto magnético (req. sección 9).                                                                                  |
| `SpotlightCard` / patrón spotlight | Components     | Sección Representantes        | Cursor-linterna que revela nombres/cargos bajo capa oscura.                                                         |
| `Orb` (OGL)                        | Backgrounds    | Sección Contacto              | Pieza reactiva al mouse detrás del formulario.                                                                      |
| `PixelTrail`                       | Animations     | Sección Galería               | Estela de cursor solo en esa sección (req. sección 9).                                                              |
| `ScrollVelocity`                   | TextAnimations | Separador entre secciones     | Marquesina con los 9 acrónimos cuya velocidad sigue el scroll.                                                      |

### 2.2 Rare UI (`rareui.com/components`, shadcn CLI, "archivo único que posees")

| Componente                  | Dónde                                                                 | Por qué                                                       |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------- |
| `Scroll Progress Indicator` | Global, integrado al navbar                                           | Lectura de progreso tipo revista; encaja con lo editorial.    |
| `Animated Counter`          | Alternativa a `CountUp` si su spring se ve mejor con Fraunces         | Se elige uno solo tras probar.                                |
| `Grid Reveal`               | Fondo de "Aportes"                                                    | Retícula que se revela cerca del cursor; sutil, sin "AI-kit". |
| `Delete Button` (patrón)    | Solo el patrón de confirmación, para "limpiar formulario" de contacto | Micro-interacción honesta, no destructiva.                    |
| `Gravity Letters`           | **Descartado**                                                        | Física de letras es "playful"; rompe el tono institucional.   |
| `Matrix Orb` / `Fluid Orb`  | **Descartado**                                                        | Estética "AI-kit"; se usa `Orb` de React Bits re-coloreado.   |

### 2.3 Sileo (`npm install sileo`, `import { sileo, Toaster } from "sileo"`)

- `Toaster` montado en el layout raíz (`position="bottom-center"`, se prueba `top-center` en mobile).
- `sileo.error` ⇐ cualquier `4xx/5xx` o fallo de red del cliente HTTP (`lib/api.ts` centraliza y traduce `error.code` del backend: `QUERY_NOT_ALLOWED`, `RATE_LIMITED`, `VALIDATION_ERROR`… a mensajes en español).
- `sileo.promise` ⇐ `POST /api/contact` (pending → éxito/error).
- `sileo.action` ⇐ "Ver noticia" tras cargar más ítems; `sileo.info` ⇐ aviso de `prefers-reduced-motion` activo (una sola vez).
- Su morphing SVG (gooey) rima con el `GooeyNav`: es el **mismo lenguaje líquido** en dos lugares, no dos librerías peleando.

### 2.4 Referencias de dirección de arte (sin copiar; solo principios)

Fuentes revisadas: Awwwards _Culture & Education_, _Institutions_, SOTD; Godly; Land-book.

1. **Design Education Series® (Obys)** — Product Honors + Developer Award. Tomo: _ritmo de scroll con secciones "pinned" que narran_, tipografía serif enorme con números como protagonistas.
2. **IE University (Honorable Mention)** — Tomo: _grid asimétrico y mucho aire_, cómo una institución seria se ve premium sin gradientes.
3. **Education Centre Interlaken (SOTD, feb 2026)** — Tomo: _paleta corta de 3 colores + papel_, micro-tipografía mono para metadatos (fechas, niveles).
4. **D2C Life Science (Iron Velvet, SOTD + Dev Award, feb 2026)** — Tomo: _capas superpuestas WebGL + contenido HTML_ con profundidad real, no decoración.
5. **Digital Culture (VALMAX, HM mayo 2026)** — Tomo: _marquesina ligada a la velocidad de scroll_ y transiciones de fondo por sección.

Patrón común en los cinco: **serif de alto contraste + mono para datos + un solo acento**. Ninguno usa Inter/Poppins ni tarjetas `shadow-lg`.

---

## 3. Dirección elegida: "Acta académica"

Mezcla de **3 lenguajes**, no 6:

| Lenguaje                                    | Rol                                                                                                                  | Dónde                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Minimalismo editorial** (base, 70 %)      | Estructura, tipografía, grid asimétrico, aire. El sitio se lee como el acta o la publicación anual del Foro.         | Todo el sitio.                          |
| **Bento grid** (20 %)                       | Mostrar 9 universidades y programas con celdas de distinto tamaño (la USAC, primera en el orden oficial, ocupa 2×2). | Universidades, Programas, Aportes.      |
| **Aurora UI + Liquid/Gooey** (10 %, acento) | Señal de "esto es contemporáneo": fondo shader **desaturado** en el hero, gooey en navbar y toasts.                  | Hero, navbar, notificaciones, contacto. |

**Descartados y por qué:** Neumorfismo (no es fintech/producto físico), Claymorfismo (infantiliza), Brutalismo (rompe la neutralidad institucional), Skeuomorfismo (sin objeto físico que evocar), Glassmorfismo completo (solo se usa en el navbar flotante, 1 px de borde con gradiente, para no caer en "cristal por todas partes").

**Giro creativo del layout:** el hero no es "título + CTA + imagen". Es una **portada de acta**: número de edición y fecha en mono arriba, título serif enorme que se parte en dos columnas, y una **constelación 3D de 9 nodos** (una por universidad) que orbita y reacciona al mouse. Las secciones no son "features en 3 columnas": son _capítulos_ numerados (01 Universidades, 02 Programas, 03 Actividades…), con foliado en mono en el margen, como un documento.

---

## 4. Paleta (tokens CSS)

Idea: **papel de archivo + tinta + jade (quetzal) + ámbar (sello)**. Neutral frente a las 9 universidades. Sin morado. Sin degradado azul.

| Token             | Hex       | Uso                                                                                          |
| ----------------- | --------- | -------------------------------------------------------------------------------------------- |
| `--color-paper`   | `#F3EEE4` | Fondo base (papel cálido, no blanco puro)                                                    |
| `--color-paper-2` | `#E9E2D3` | Fondo alterno / celdas bento                                                                 |
| `--color-ink`     | `#16150F` | Texto principal, fondos de secciones oscuras                                                 |
| `--color-ink-2`   | `#3D3A31` | Texto secundario                                                                             |
| `--color-ink-3`   | `#7C7768` | Metadatos, mono, líneas                                                                      |
| `--color-jade`    | `#0F6E5A` | Acento primario: CTA, links activos, indicador gooey                                         |
| `--color-jade-2`  | `#3F9E86` | Hover/aurora (variante clara)                                                                |
| `--color-amber`   | `#C9782A` | Acento secundario: sellos, números de capítulo, badge "Doctorado"                            |
| `--color-night`   | `#101A24` | Fondo de secciones "oscuras" (Aportes, Contacto); es azul-tinta casi negro, no azul de marca |
| `--color-line`    | `#D6CEBB` | Bordes de 1 px                                                                               |

Contrastes verificados (WCAG AA): `ink/paper` 15.2:1 · `jade/paper` 5.9:1 · `amber/paper` 3.4:1 (solo para texto ≥ 24 px o decorativo; sobre `night` sube a 5.1:1) · `paper/night` 15.6:1.

**Cambio de tema por scroll** (scroll anim #9): el `background` del `<body>` interpola `paper → paper-2 → night → paper` según la sección visible. No hay toggle manual de dark mode: el "modo oscuro" es narrativo, por capítulo.

Aurora del hero: stops `#0F6E5A`, `#C9782A`, `#101A24` al 35 % de amplitud, blend `multiply` sobre `paper`. Se ve como acuarela, no como pantalla RGB.

---

## 5. Tipografía

| Rol               | Fuente                                                                         | Justificación                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display / títulos | **Fraunces** (variable: `opsz`, `wght`, `SOFT`, `WONK`) vía `next/font/google` | Serif "old-style" con óptica variable: a 96 px se ve editorial y con carácter (eje `WONK` activo en H1), a 20 px sigue legible. Tiene números tabulares para los contadores. Nadie la asocia a "template". |
| Cuerpo / UI       | **Geist Sans** vía `next/font/google`                                          | Sans geométrica-humanista, neutra pero no Inter. Excelente en 14–18 px, hinting en Windows.                                                                                                                |
| Metadatos / datos | **Geist Mono**                                                                 | Foliado, fechas, niveles (`MAESTRÍA · HÍBRIDA · 24 MESES`), acrónimos en marquesina. Es la voz "de archivo" del sitio.                                                                                     |

Escala fluida con `clamp()`: H1 `clamp(2.75rem, 8vw, 8rem)` · H2 `clamp(2rem, 5vw, 4.5rem)` · cuerpo `1.0625rem/1.6` · mono `0.75rem` con `letter-spacing: 0.08em` y mayúsculas.

---

## 6. Stack y librerías de animación

| Capa          | Elección                                                                                      | Motivo                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Framework     | **Next.js 15 (App Router) + TypeScript + Tailwind v4**                                        | SSR/ISR para SEO de noticias y programas; `next/font`; el README del backend ya lo asume.           |
| Smooth scroll | **Lenis**                                                                                     | Global, con `ScrollTrigger.scrollerProxy`. Se desactiva con `prefers-reduced-motion`.               |
| Scroll        | **GSAP + ScrollTrigger** (pin/scrub/path) y **Motion** (`useScroll`/`useTransform`, `layout`) | GSAP para lo que necesita pin y timeline; Motion para lo declarativo y el morphing del navbar.      |
| 3D            | **React Three Fiber + drei** (constelación del hero)                                          | Pieza 3D real, no solo shader. `React.lazy` + `Suspense` + fallback estático en móvil de gama baja. |
| Shaders 2D    | **OGL** (Aurora, Particles, Orb de React Bits)                                                | Ligero (~30 KB) frente a Three para fondos planos.                                                  |
| Toasts        | **Sileo**                                                                                     | Ver 2.3.                                                                                            |
| Datos         | `fetch` nativo con cache de Next (`revalidate`) + tipos generados a mano desde `openapi.yaml` | Sin SWR/React-Query: el sitio es de lectura y la API ya cachea `forum-summary` 60 s.                |

---

## 7. Mapa de secciones (Home) y qué animación va en cada una

| #   | Capítulo                 | Contenido (API)                             | Animación de scroll                                                                                                                         | Cursor / 3D                                                                                     |
| --- | ------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 00  | **Portada** (hero)       | Nombre del Foro, edición, CTA               | **#1 Parallax multicapa**: Aurora (0.2×) → Particles (0.5×) → título (1×) → constelación (1.3×). **#3 SplitText** en el H1.                 | **Constelación 3D (R3F)** de 9 nodos que orbita y sigue al mouse. Botón magnético + ClickSpark. |
| —   | Marquesina               | 9 acrónimos                                 | `ScrollVelocity` (extra, no cuenta como una de las 6)                                                                                       | —                                                                                               |
| 01  | **El Foro en cifras**    | `forum-summary`                             | **#8 Contadores** al entrar en viewport.                                                                                                    | —                                                                                               |
| 02  | **Universidades**        | `universities?sort=displayOrder`            | **#7 Bento con reveal escalonado** por celda.                                                                                               | Cursor "Ver perfil" sobre cada celda; spotlight por celda.                                      |
| 03  | **Programas**            | `academic-programs`                         | **#4 Scroll horizontal**: el scroll vertical desplaza tarjetas de programas; filtro por nivel arriba.                                       | Cursor grande "Arrastrar".                                                                      |
| 04  | **Cómo trabaja el Foro** | Estático (3 pasos)                          | **#2 Pin + scrub**: sección fija; el número de paso y la ilustración cambian con el progreso.                                               | —                                                                                               |
| 05  | **Línea de tiempo**      | `universities.joinedForumAt` + `activities` | **#5 SVG path drawing**: la línea se dibuja al bajar; cada universidad "aparece" en su año.                                                 | —                                                                                               |
| 06  | **Aportes**              | `contributions`                             | **#10 Sticky narrativa**: texto fijo a la izquierda (Resultado/Iniciativa/Beneficio), visual derecha cambia. Fondo pasa a `night` (**#9**). | `Grid Reveal` de Rare UI en el fondo.                                                           |
| 07  | **Noticias**             | `news-items` (3 últimas)                    | **#6 Scale/morph** con `useTransform`: la tarjeta central crece y las laterales rotan levemente.                                            | Cursor "Leer".                                                                                  |
| 08  | **Representantes**       | `representatives`                           | Reveal simple                                                                                                                               | **Spotlight**: linterna que revela nombre/cargo bajo capa oscura.                               |
| 09  | **Galería**              | `gallery-items`                             | Masonry con reveal                                                                                                                          | `PixelTrail` solo aquí.                                                                         |
| 10  | **Contacto**             | `POST /api/contact`                         | —                                                                                                                                           | `Orb` OGL reactivo detrás del formulario; `sileo.promise`.                                      |

Total: **10 mecanismos de scroll distintos** (mínimo pedido: 6), ninguno repetido.

Páginas internas (mismo sistema, menos animación): `/universidades/[documentId]`, `/programas` (filtros `level`/`modality`), `/actividades`, `/noticias` y `/noticias/[documentId]`, `/galeria`, `/contacto`.

---

## 8. Navbar (req. sección 6) — cumple 4 de 5

1. **Morphing**: arriba es una _pill_ flotante centrada (glass: `backdrop-blur`, borde 1 px con gradiente `jade→amber` al 30 %); al pasar 80 px de scroll se convierte en barra completa con Motion `layout` (spring `stiffness 260, damping 28`).
2. **Gooey Nav**: el indicador activo es un metaball SVG (`feGaussianBlur` + `feColorMatrix`) que "se funde" de un link a otro.
3. **Indicador con spring físico**, nunca `transition: all`.
4. **Menú móvil de página completa**: `clip-path: circle()` que crece desde el botón hamburguesa; links en Fraunces a 3rem entrando con stagger.
5. **Magnético** en cada link (radio 40 px) — reutiliza `useMagnetic`.

Scroll Progress Indicator (Rare UI) vive como una línea de 2 px en la base de la barra.

---

## 9. Sistema de botones (req. sección 7): "Sello líquido"

Botón primario `<Button variant="primary">`:

- **Forma**: rectángulo con esquinas de 2 px (no pill, no `rounded-xl`), borde 1 px `ink`, texto Geist Mono en mayúsculas con tracking.
- **Magnético**: `useMagnetic` (radio 60 px, spring).
- **Relleno líquido**: al hover un blob `jade` entra desde la X del cursor (`clip-path: circle()` + spring; el centro sigue `mouse.x`); el texto pasa a `paper` con `mix-blend-mode: difference` para que el cambio sea instantáneo y sin doble texto.
- **Partículas al click**: `ClickSpark` (8 chispas `amber`), luego ejecuta la acción.
- **Loading**: el blob queda dentro y oscila como una marea (`clip-path` con `ellipse` animada, 1.2 s, ease `sine`), el texto cambia a "ENVIANDO…" con puntos que aparecen en secuencia mono. Sin spinner.
- **Variantes**: `secondary` (solo borde, blob `paper-2`), `ghost` (subrayado que se dibuja con `background-size`), `icon` (magnético, sin blob).

Foco de teclado: `outline: 2px solid var(--color-amber); outline-offset: 3px` — visible, propio, no azul.

---

## 10. Cursor custom (req. sección 9) — implementa 4 de 5

- **Cursor morfológico**: círculo 12 px `ink` con `mix-blend-mode: difference`; crece a 80 px con texto mono ("VER PERFIL", "LEER", "ARRASTRAR") según `data-cursor` del elemento.
- **Magnético** en botones, links del navbar e iconos sociales.
- **Estela** `PixelTrail` solo en Galería (para no cansar).
- **Spotlight** en Representantes.
- Distorsión de imagen por shader: **fuera de alcance v1** (coste de rendimiento en móvil); se anota para v2.
- Con `pointer: coarse` (táctil) el cursor custom no se monta; con teclado (`:focus-visible`) el cursor nativo se restaura.

---

## 11. Errores y feedback (req. sección 10)

- `lib/api.ts`: un solo `apiFetch<T>()` que entiende el formato `{ error: { status, code, message, requestId } }` del backend, lanza `ApiError` y dispara `sileo.error({ title, description: message + requestId })`.
- `sileo.promise` en el formulario de contacto (honeypot `website: ''` incluido).
- **Error Boundary** propio (`app/error.tsx` + `global-error.tsx`): pantalla "Página fuera de acta" en `paper`, con número de folio (`requestId` si existe), botón "Volver a la portada" con el sistema de botones, y el `Orb` en `amber` de fondo. Sin pantalla blanca.
- `not-found.tsx` con el mismo lenguaje.

---

## 12. Rendimiento y accesibilidad (req. sección 11)

- Solo `transform`/`opacity`; `will-change` únicamente durante la animación (se quita al terminar).
- R3F, OGL y GSAP-pin cargan con `next/dynamic({ ssr: false })` + `Suspense`; el hero renderiza un SVG estático de la constelación como fallback y en `prefers-reduced-motion`.
- `prefers-reduced-motion`: Lenis off, SplitText → fade simple, pin → layout normal, aurora estática, cursor nativo. Un `sileo.info` avisa una vez.
- Mobile: bento pasa a 2 columnas; scroll horizontal pasa a carrusel nativo con `scroll-snap`; pin se desactiva bajo 768 px; constelación 3D baja a 9 nodos sin postprocesado y `dpr` 1.
- Objetivo Lighthouse desktop: Performance > 85, Accessibility > 95. Se mide antes de cerrar cada sección.
- Imágenes de Strapi vía `next/image` con `remotePatterns` al host del backend.

---

## 13. Estructura del código

```
frontend/
├── app/                    # App Router: layout, page (home), rutas internas, error.tsx, not-found.tsx
├── components/
│   ├── nav/                # Navbar, GooeyIndicator, MobileMenu
│   ├── ui/                 # Button (sello líquido), Chip, Folio, Section
│   ├── cursor/             # CustomCursor + CursorProvider
│   ├── hero/               # Hero, Constellation (R3F), AuroraLayer (OGL)
│   ├── sections/           # Una carpeta por capítulo (Stats, Universities, Programs, …)
│   └── feedback/           # ToasterMount, ErrorScreen
├── hooks/                  # useMagnetic, useScrollReveal, useLenis, useSectionTheme, useReducedMotion
├── lib/                    # api.ts, types.ts (desde openapi.yaml), format.ts (fechas es-GT, enums → etiqueta)
├── styles/                 # tokens.css (variables), globals.css
└── DESIGN_NOTES.md
```

Regla: **nada de GSAP/Three dentro de `app/`**; toda animación vive en su componente/hook.
