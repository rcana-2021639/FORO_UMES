# DESIGN_NOTES — Frontend del Foro Interuniversitario de Estudios de Posgrado

> Documento de dirección de diseño. Se escribe **antes** de codear y se actualiza si la dirección cambia.
> Estado: **v6.0 "Nueve en uno"** (§28) sobre v5 "Anuario" (§27) y v3.0 "Blanco y violeta" (§23; §19–§22 describen v2.0 y siguen vigentes en lo que no contradiga a §23). Las notas marcadas con ▸ registran desvíos respecto a la propuesta inicial y su motivo.

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

| Componente                         | Categoría      | Dónde                          | Por qué                                                                                                             |
| ---------------------------------- | -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `Aurora` (OGL)                     | Backgrounds    | Capa 1 del hero                | Fondo shader fluido, pero **re-coloreado a jade/ámbar/tinta** (nada de morado/azul). Marca "modernidad" sin gritar. |
| `Particles` (OGL)                  | Backgrounds    | ▸ Fusionado en la constelación | ▸ Se sustituyó por el polvo de puntos dentro de la escena R3F: un solo contexto WebGL en el hero en vez de dos.     |
| `GooeyNav`                         | Components     | Navbar desktop                 | Indicador activo con filtro metaball SVG (req. sección 6).                                                          |
| `SplitText` (GSAP)                 | TextAnimations | Títulos H1/H2                  | Reveal por caracteres/palabras con stagger (scroll anim #3).                                                        |
| `CountUp`                          | TextAnimations | "El Foro en cifras"            | Contadores activados en viewport (scroll anim #8), alimentados por `/api/forum-summary`.                            |
| `MagicBento`                       | Components     | Grid de universidades          | Base del bento con spotlight por celda; se reescribe el estilo (sin glow morado).                                   |
| `ClickSpark`                       | Animations     | Botón primario                 | Estallido de partículas al click (req. sección 7).                                                                  |
| `Magnet`                           | Animations     | Botones, links navbar, iconos  | Efecto magnético (req. sección 9).                                                                                  |
| `SpotlightCard` / patrón spotlight | Components     | Sección Representantes         | Cursor-linterna que revela nombres/cargos bajo capa oscura.                                                         |
| `Orb` (OGL)                        | Backgrounds    | Sección Contacto               | Pieza reactiva al mouse detrás del formulario.                                                                      |
| `PixelTrail`                       | Animations     | Sección Galería                | ▸ Reimplementado en canvas 2D (mismo efecto de retícula) para no abrir un segundo contexto WebGL.                   |
| `ScrollVelocity`                   | TextAnimations | Separador entre secciones      | Marquesina con los 9 acrónimos cuya velocidad sigue el scroll.                                                      |

### 2.2 Rare UI (`rareui.com/components`, shadcn CLI, "archivo único que posees")

| Componente                  | Dónde                                                                 | Por qué                                                             |
| --------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `Scroll Progress Indicator` | Global, integrado al navbar                                           | Lectura de progreso tipo revista; encaja con lo editorial.          |
| `Animated Counter`          | Alternativa a `CountUp` si su spring se ve mejor con Fraunces         | Se elige uno solo tras probar.                                      |
| `Grid Reveal`               | Fondo de "Aportes"                                                    | Reimplementado con `mask-image` radial en CSS; sutil, sin "AI-kit". |
| `Delete Button` (patrón)    | Solo el patrón de confirmación, para "limpiar formulario" de contacto | Micro-interacción honesta, no destructiva.                          |
| `Gravity Letters`           | **Descartado**                                                        | Física de letras es "playful"; rompe el tono institucional.         |
| `Matrix Orb` / `Fluid Orb`  | **Descartado**                                                        | Estética "AI-kit"; se usa `Orb` de React Bits re-coloreado.         |

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

| Token             | Hex       | Uso                                                                                                                    |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--color-paper`   | `#F3EEE4` | Fondo base (papel cálido, no blanco puro)                                                                              |
| `--color-paper-2` | `#E9E2D3` | Fondo alterno / celdas bento                                                                                           |
| `--color-ink`     | `#16150F` | Texto principal, fondos de secciones oscuras                                                                           |
| `--color-ink-2`   | `#3D3A31` | Texto secundario                                                                                                       |
| `--color-ink-3`   | `#66614F` | Metadatos, mono, líneas                                                                                                |
| `--color-jade`    | `#0F6E5A` | Acento primario: CTA, links activos, indicador gooey                                                                   |
| `--color-jade-2`  | `#3F9E86` | Hover/aurora (variante clara)                                                                                          |
| `--color-amber`   | `#C9782A` | Acento secundario decorativo y texto sobre `night`; badge "Doctorado", barra de progreso                               |
| `--color-amber-2` | `#9A5414` | ▸ Ámbar para **texto** sobre papel. `--accent` alterna entre ambos según el tema (Lighthouse marcó `#C9782A` en 2.9:1) |
| `--color-night`   | `#101A24` | Fondo de secciones "oscuras" (Aportes, Contacto); es azul-tinta casi negro, no azul de marca                           |
| `--color-line`    | `#D6CEBB` | Bordes de 1 px                                                                                                         |

Contrastes medidos (WCAG AA): `ink/paper` 15.2:1 · `ink-3/paper` 5.4:1 · `jade/paper` 5.3:1 · `amber-2/paper` 5.0:1 · `amber/night` 5.2:1 · `paper/night` 15.2:1. Lighthouse (desktop, build de producción): Performance 98 · Accessibility 96→100 tras estos ajustes · Best Practices 96 · SEO 100.

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

---

## 14. Estado de entrega (v1) y notas de implementación

- **Datos locales:** `NEXT_PUBLIC_API_URL` debe usar `http://127.0.0.1:1337` (no `localhost`): el servidor de Next resuelve `localhost` a `::1` y Strapi escucha en IPv4, lo que hacía fallar el `fetch` en `next build`/`next start`.
- **Tema por sección:** se implementó con `IntersectionObserver` y no con ScrollTrigger, porque los _pin-spacers_ de GSAP desplazaban las posiciones calculadas y la sección "Programas" heredaba el tema noche.
- **Menú móvil:** `clip-path: circle()` con centro en porcentajes (`91% 5%`); Motion no interpola `calc()` dentro de `clip-path`.
- **Hooks reutilizables:** `useMagnetic`, `useClickSpark`, `useSplitReveal`, `useReducedMotion`/`useFinePointer`. Toda la lógica GSAP/Three vive en `components/` y `hooks/`, nunca en `app/`.
- **Pendiente para v2:** distorsión de imágenes por shader al hover, `ModelViewer` con un objeto 3D del Foro cuando exista identidad gráfica oficial, y logos reales de las universidades (el bento muestra siglas mientras tanto).

---

## 15. Rediseño total (v1.1): de "acta con folios" a "la mesa"

Auditoría honesta de v1 con la checklist anti-genérico, y qué se intervino en los seis ejes a la vez.

| Eje             | Lo que delataba plantilla en v1                                                                         | Decisión v1.1                                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Color**       | Papel crema `#F3EEE4` + ámbar `#C9782A`: el clúster "crema + terracota". Aurora verde→durazno de stock. | Piedra caliza `#EDEFE9` / `#E0E5DB`, tinta verde-negra `#101511`, jade `#0B6B5A`, ocre `#8A5F0C` (texto) / oro `#D9A93A` (sobre noche), noche verde `#0E1A16`. Aurora jade + piedra.                                                                         |
| **Tipografía**  | Una palabra en itálica por titular; etiquetas en MAYÚSCULAS mono en cada bloque.                        | Fraunces a peso 300 (`SOFT 50`) en display; kickers en itálica de frase completa (`.eyebrow`); Geist sentence-case para UI (`.ui-label`); mono **solo** para datos.                                                                                          |
| **Layout**      | Folios `01…10` en capítulos que no son secuencia; separadores "A · B · C"; todo con borde 1 px/3 px.    | Marca de asiento (arco) en vez de número; cifras sin cajas con regla que se dibuja; bento de losas sin borde; programas como horario (regla superior); ritmo `tight/normal/wide`.                                                                            |
| **Interacción** | Hover = cambiar `border-color`.                                                                         | `lift` (−4 px + sombra tintada de tinta), flecha que se dibuja y entra, velo jade que se levanta en noticias, chips con relleno que crece, inputs con subrayado que se dibuja.                                                                               |
| **Motion**      | Bento/galería/noticias con fade + `translateY` y stagger lineal `0.06·i`.                               | Firma: la constelación **se sienta a la mesa** al cargar (dispersa → asientos, curva cinemática, aristas al llegar). Bento: barrido de máscara; galería: máscara ascendente; noticias: enfoque (blur→nítido). `stagger()` no lineal. Tres curvas con nombre. |
| **Copy**        | "Últimas noticias", "Galería", "Ver todas", "Archivo".                                                  | "Nueve sillas, una mesa", "Quiénes se sientan", "Lo que sale de la mesa", "Las personas detrás de cada silla", "Escríbele a la mesa"; CTAs y vacíos con voz propia.                                                                                          |

Se conserva: arquitectura de 10 capítulos con datos reales, navbar gooey, botón líquido, pin + scrub, path SVG, spotlight, Sileo, R3F.

**Elemento de firma, en una frase:** nueve puntos dispersos que, al abrir el sitio, se sientan uno a uno alrededor de una mesa mientras el nombre del Foro se imprime letra a letra.

Lighthouse desktop (build): Performance 98 · Accessibility 100 · Best Practices 100 · SEO 100.

---

## 16. v1.2: segundo acento y piezas de React Bits recoloreadas

Auditoría de v1.1 antes de tocar nada:

1. **Paleta monotonal.** Piedra + jade + oro; sin segundo acento. El sitio se leía "verde-gris" de arriba abajo.
2. **Programas.** 18 tarjetas planas idénticas en un riel horizontal que fijaba la sección ~5 pantallas. Cero jerarquía.
3. **Representantes.** Sin fotos publicadas, la linterna solo mostraba nueve bloques negros con iniciales.
4. **Aportes.** Sticky narrativa con 2 ítems: columna izquierda vacía; la retícula del fondo casi invisible.
5. **Galería.** El único video era un bloque con glifo play, sin miniatura.

Qué se intervino, por eje:

| Eje             | Decisión v1.2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Color**       | Violeta como **segundo acento**: `--color-violet #5B3FA6` (texto sobre piedra, 6.6:1), `--color-violet-2 #B9A6FF` (sobre oscuro), `--color-violet-3 #2A1F4D` (losas), `--color-dusk #15112A` (crepúsculo). Va en **detalles**: selección de texto, chips activos, insignia de doctorado, borde del navbar (jade→violeta), barra de progreso, estela de píxeles, un nodo de la constelación, parada pálida en la aurora, reglas de las cifras. La única superficie violeta es el capítulo **Contacto** (tema `dusk`). Los componentes de React Bits que traían morado/cian de stock se recolorean a esta paleta, nunca al revés. |
| **Tipografía**  | Sin cambios de sistema. Fraunces entra en piezas nuevas (título de ScrollExpand, nombres en las tarjetas de programas, etiquetas de los paneles de Aportes) con `opsz` a medida.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Layout**      | Programas: **carrusel de profundidad** con tarjetas de contenido (no riel fijado). Aportes: **tres paneles en acordeón** (jade / violeta / ocre) que se abren al 55 %. Representantes: retícula de **tarjetas que se dan la vuelta**. Galería: **marco que se abre con el scroll** hasta pantalla completa, y masonry debajo. `Section` gana un slot `backdrop` para capas de sección completa.                                                                                                                                                                                                                                 |
| **Interacción** | Universidades: hover/foco **pixela** la losa hacia su reverso (descripción + "Abrir perfil"). Programas: click en la tarjeta del frente abre la ficha; en otra, la trae al frente; arrastre, rueda horizontal, flechas y teclado; **estrella de guardar** (localStorage, compartida con el catálogo, filtro "Guardados"). Navbar: **estallido de partículas** jade/violeta/oro bajo el filtro gooey al elegir sección. Chispas al click ahora **globales**, con color por capítulo (`--spark`).                                                                                                                                 |
| **Motion**      | GlowCursor (OGL) en Contacto: estela jade→violeta en `screen` sobre crepúsculo, dormida hasta que el puntero se mueve y solo en viewport. MorphSlider (OGL + GSAP, transición "melt") en `/galeria` cuando hay ≥ 2 imágenes. PixelTrail con filtro gooey suave. Todo respeta `prefers-reduced-motion` y puntero fino.                                                                                                                                                                                                                                                                                                           |
| **Copy**        | "Filtra por nivel, recorre las tarjetas y guarda con la estrella las que quieras comparar", "Tres carpetas sobre la mesa", "Cada silla es una tarjeta: dale la vuelta para ver cargo y correo", vacíos con voz propia ("No has guardado programas todavía…").                                                                                                                                                                                                                                                                                                                                                                   |

Mapa de piezas de React Bits (todas reescritas en TS, recoloreadas, con reduced-motion):

| Pieza              | Dónde                            | Adaptación                                                                                            |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `DepthCarousel`    | Programas (portada)              | Tarjetas de contenido; el fondo se funde hacia `--bg` en vez de `brightness()`; click abre.           |
| `PixelSwap`        | Universidades                    | Estado controlado por hover/foco del padre; patrón espiral en la silla grande.                        |
| `FlipCard`         | Representantes                   | Sin arrastre (compite con el scroll); `role=button` + teclado; reverso violeta-tinta.                 |
| `AccordionGallery` | Aportes                          | Paneles de contenido, no fotos; tintas jade/violeta/ocre con grano; vertical bajo 768 px.             |
| `ScrollExpand`     | Galería (portada)                | `media` es un nodo (next/image); miniatura de YouTube/Vimeo para videos; título en Fraunces con halo. |
| `GlowCursor`       | Contacto (portada y `/contacto`) | Escucha en la sección (`data-fx-root`); canvas creado por el renderer (StrictMode); dpr ≤ 1.25.       |
| `ClickSpark`       | Global (`ClickSparkLayer`)       | Un canvas fijo; color por capítulo vía `--spark`; sustituye al canvas por botón.                      |
| `PixelTrail`       | Galería                          | Ya en canvas 2D; ahora violeta y con `#gooey-soft`.                                                   |
| `GooeyNav`         | Navbar                           | Solo el estallido de partículas, bajo el filtro gooey existente; sin `Math.random` en render.         |
| `PulseHeart`       | Programas (carrusel y catálogo)  | Estrella propia (sin `@hugeicons`); anillo de puntos y latido con sobreimpulso.                       |
| `MorphSlider`      | `/galeria`                       | Solo transición "melt"; overlay crepúsculo; se monta solo con ≥ 2 imágenes.                           |

Notas de implementación:

- `html { overflow-x: clip }` y `.depth-carousel { overflow: clip }`: las tarjetas 3D desbordan a los lados y un foco por teclado desplazaba el documento.
- Los WebGL de OGL crean su propio `<canvas>` dentro del efecto: en dev, React monta dos veces y un contexto perdido no se reutiliza.
- `next.config.ts` permite `img.youtube.com`, `i.ytimg.com` y `vumbnail.com` para las miniaturas.

**Elemento de firma (sin cambios):** nueve puntos que se sientan a la mesa. Lo nuevo es que ahora una de las sillas es violeta.

---

## 17. v1.3 — "Que se lea a la primera" (revisión tras uso real)

Motivo: en pruebas con el sitio ya construido, varias piezas se veían "básicas" o no explicaban qué se estaba viendo (niveles de posgrado, cómo trabaja la mesa, la línea de tiempo), el capítulo de contacto se trababa y el scroll se quedaba fijo al volver a la portada.

| Cambio                     | Decisión                                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cursor**                 | Se elimina el cursor custom (`CustomCursor`, `data-cursor*`, `data-cursor-mode`). Cursor nativo en todo el sitio.                                                                                                                                                                                                                         |
| **Navbar**                 | Sin línea de progreso ni borde inferior: la barra al hacer scroll se separa solo con sombra tintada. "Inicio" y el monograma, ya en la portada, suben al principio con Lenis.                                                                                                                                                             |
| **Scroll**                 | Lenis con `naiveDimensions: true`: `<html>` mide 100 % del viewport, así que su ResizeObserver nunca veía crecer el documento al cambiar de ruta y el límite se quedaba en la altura de la página anterior. Al cambiar de ruta: `scrollTo(0, {force})`, `ScrollTrigger.refresh()` y `lenis.resize()`.                                     |
| **Paleta**                 | Marfil cálido `#F4F1EA` / `#E9E3D6`, tinta `#0D1411`, esmeralda `#0A6A57` + `#3FC9A3`, oro `#E6AD3C`, violeta eléctrico `#5A3DC9` / `#C2B1FF`, más **coral** `#E0603C` y **cielo** `#6FB7C9`. Superficies `--surface-1/2/3` derivadas de `--fg`/`--bg`. Dos halos radiales fijos (esmeralda arriba-izquierda, violeta derecha) en `body`. |
| **Nueve sillas, una mesa** | Capítulo en tema `night`. Mesa SVG con nueve asientos que se encienden en orden y orbitan; cuatro losas de cristal con halo de color por cifra.                                                                                                                                                                                           |
| **Programas**              | `LevelTabs`: una losa por nivel (inicial, plural, cuántos hay, qué es y cuánto dura). Mismo componente en portada y catálogo; tarjetas del carrusel coloreadas por nivel (`lib/levels.ts`). Catálogo agrupado por nivel con cabecera de color, búsqueda, píldoras de modalidad y tarjetas.                                                |
| **Así trabaja la mesa**    | `ProcessSteps` sustituye al pin de 250 %: tres pasos pulsables con autoavance (barra de 6,5 s, se pausa al pasar el cursor), teclado, y la figura de nueve puntos que se recompone con GSAP.                                                                                                                                              |
| **Hitos**                  | Eje central dibujado con el scroll, marcadores de año, tarjetas alternadas (jade = ingreso, violeta = actividad) que entran desde su lado.                                                                                                                                                                                                |
| **Perfil de universidad**  | `UniversityProfile`: cabecera con tinta propia (según la silla), logo en losa clara, franja de cifras, representantes con foto o iniciales, programas agrupados por nivel con pestañas.                                                                                                                                                   |
| **Contacto**               | Fuera `Orb` y `GlowCursor` (dos contextos WebGL en la misma sección: se trababa). `SoftOrb`: manchas con blur y anillo de asientos, solo transforms/opacity. También en las pantallas de error.                                                                                                                                           |
| **Hero**                   | La constelación "átomo" pasa a ser **la mesa redonda**: nueve asientos sobre un anillo visto en diagonal, estrella {9/4} entre ellos, tablero translúcido, respiración y giro lento.                                                                                                                                                      |

---

## 18. v1.4 — "Todo con volumen" (piezas 3D de React Bits)

Segunda revisión tras uso: las secciones seguían leyéndose planas. Se incorporan las piezas que el equipo entregó de React Bits (DepthText, FoldText, VariableProximity, ElasticMesh, MagicRings, TearTicket) más una primitiva propia (`Tilt`) y se reparten donde aportan sentido, no decoración.

| Pieza                       | Archivo                               | Dónde                                                                                                                                                           |
| --------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Tilt` (propia)             | `components/fx/Tilt.tsx`              | Losa que se inclina con el puntero, brillo y sombra; hijos `data-depth` flotan en Z. Cifras, pestañas de nivel, hitos, noticias, perfiles, bento, contacto.     |
| `DepthText`                 | `components/fx/DepthText.tsx`         | Texto apilado en capas (letras "sobrepuestas"). Cifras de portada, nombres de nivel, números de paso, años de los hitos, "mesa" en contacto, cifras del perfil. |
| `FoldText`                  | `components/fx/FoldText.tsx`          | Títulos que se despliegan por bisagra: todos los capítulos (`Section`), títulos de noticias, nombre de la universidad, título del paso activo.                  |
| `VariableProximity`         | `components/fx/VariableProximity.tsx` | "¿Qué traes a la mesa?" en Contacto: los ejes de Fraunces (wght/opsz/SOFT/WONK) responden a la distancia del puntero, letra a letra.                            |
| `ElasticMesh` (OGL)         | `components/fx/ElasticMesh.tsx`       | Portada de la nota más reciente (portada y `/noticias`): superficie elástica que se hunde bajo el puntero. Pausa fuera de viewport; dpr ≤ 1.5.                  |
| `MagicRings` (three)        | `components/fx/MagicRings.tsx`        | Fondo de Aportes (`RingsBackdrop`), cabecera del perfil de universidad y el orbe de Contacto (con `clickBurst`). Escucha el puntero en `window`.                |
| `TearTicket`                | `components/fx/TearTicket.tsx`        | `/actividades`: cada actividad es un boleto con talón (fecha) que se arranca; al arrancarlo se abre la actividad.                                               |
| `AuroraLayer` (modo oscuro) | `components/fx/DuskAurora.tsx`        | Aurora violeta → jade → oro en `screen` bajo el crepúsculo de Contacto (portada y `/contacto`).                                                                 |

Cambios de sección:

- **Nueve sillas, una mesa**: vuelve al marfil. Cuatro losas con `Tilt` y el número en `DepthText` que cuenta desde cero; debajo, "el canto de la mesa": una regla que se dibuja y nueve marcas que saltan una a una. Sin "sillas ocupadas".
- **Programas**: `LevelTabs` en 3D (Tilt + DepthText por nivel). Carrusel con tarjetas de 400×500 y **zonas laterales** de ancho completo con solo `‹ ›` (toda la franja es clicable).
- **Así trabaja la mesa**: escenario 3D con perspectiva; la tarjeta activa al frente, las otras retiradas y giradas; número en `DepthText`, título en `FoldText`; figura de nueve puntos sobre un **plano inclinado que flota**.
- **Hitos**: tarjetas que entran girando desde su lado, `Tilt` con parallax, años en `DepthText` flotando, pulso de luz que recorre el eje, nodos que respiran.
- **Aportes**: la animación de los paneles no se toca. Se añaden `MagicRings` de fondo, etiquetas en `DepthText`, sello giratorio por carpeta y entrada escalonada de cada aporte.
- **Noticias (portada)**: "Última publicación" con `ElasticMesh`; laterales en `Tilt` con folio; todo entra con el scroll (rotateX/rotateY).
- **Contacto**: aurora oscura de fondo, anillos con estallido al click bajo la palabra "mesa", titular con `VariableProximity`, tres públicos como losas `Tilt`, formulario en losa de cristal.
- **Perfil de universidad**: anillos en la cabecera, nombre en `FoldText`, logo en losa `Tilt` que flota entre dos anillos giratorios, cifras en `DepthText`, representantes y programas en `Tilt`.
- **Universidades (bento)**: celdas en `Tilt`, entrada rotateX escalonada, número de silla en `DepthText`; el `PixelSwap` del reverso se mantiene.
- **Actividades**: boletos `TearTicket` con tinta por tipo, filtros por tipo, próximas/anteriores con conteo en `DepthText`.
- **Archivo de noticias**: la más reciente a lo grande con `ElasticMesh`; fichas numeradas en `Tilt` con entrada rotateX; paginación con boletos.

Rendimiento: cada canvas WebGL pausa fuera de viewport y con la pestaña oculta; `Tilt` solo anima mientras el puntero se mueve y se apaga con puntero grueso o reduced-motion; `DepthText` congela su órbita fuera de pantalla.

---

## 19. v2.0 — "Piedra y nácar": neutralidad real

**Motivo.** El Foro no es de ninguna universidad: ningún color general puede evocar a una de las nueve. La auditoría de las nueve identidades (§20) mostró que la paleta v1.x chocaba con casi todas: esmeralda ≈ UVG/UMES, oro ≈ USAC/URL/Galileo/UNIS, violeta ≈ índigo URL, coral ≈ naranja UNI. Además la portada medía ~14 300 px (16 pantallas) y abría **6 contextos WebGL** a la vez.

**Regla de color.** Neutros cálidos (piedra y grafito) más una **luz nácar** que es la mezcla de todo y no pertenece a nadie. Los colores institucionales solo aparecen en lo que _es_ de cada universidad (§20).

| Token                                 | Hex                                           | Uso                                                                                        |
| ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `paper` / `paper-2`                   | `#F6F4F0` / `#ECE8E1`                         | Fondo y fondo alterno                                                                      |
| `ink` / `ink-2` / `ink-3`             | `#1C1B19` / `#45423D` / `#6B655C`             | Texto (15.7 / 9.1 / 5.3:1 sobre paper)                                                     |
| `line`                                | `#D6D0C6`                                     | Bordes de 1 px                                                                             |
| `night` / `dusk`                      | `#161513` / `#1B1922`                         | Grafito cálido; `dusk` es 4 % más frío, para el cierre (Contacto)                          |
| `sage` · `lilac` · `clay-2` · `slate` | `#3F6558` · `#5A5383` · `#85513C` · `#4E5F66` | Tintas apagadas de **texto/superficie** (≥ 5.3:1); son los colores de nivel de programa    |
| `sage-2` · `lilac-2` · `clay` · `sky` | `#B9DDCF` · `#CCC3F0` · `#EBC2AC` · `#BFD4DC` | **Luz** nácar: halos y detalle sobre grafito (≥ 10:1 sobre night)                          |
| `--pearl`                             | degradado lilac-2 → clay → sage-2 → sky       | Firma del sitio: botón primario al hover, índice activo, chip "Próxima", portadas sin foto |

- El primario de acción es la tinta; la vibra la pone el nácar al interactuar (hover, activo, selección), no un color de marca.
- Fondo ambiental: tres halos nácar en `body::before`, **fijo y compuesto en GPU** (antes era `background-attachment: fixed`, que repinta todo el body en cada frame de scroll). En capítulos oscuros `--ambient` baja a 0.18.
- `lib/palette.ts` espeja los tokens para WebGL, canvas y SVG; ningún componente lleva hex sueltos.

## 20. Colores de las nueve universidades (solo en lo suyo)

Medidos en cada sitio oficial (colores pintados en pantalla ponderados por área, más CSS, y bandera o escudo cuando la fuente los describe). Viven en `lib/universities.ts` y se aplican con `brandVars()` como variables `--u-*`.

| Silla | Universidad | Principal              | Acento                   | Nota                                                          |
| ----- | ----------- | ---------------------- | ------------------------ | ------------------------------------------------------------- |
| 1     | USAC        | `#001D5E` azul marino  | `#C9A227` oro del escudo |                                                               |
| 2     | URL         | `#150F5D` índigo       | `#FFC61F` amarillo       |                                                               |
| 3     | UVG         | `#078B45` verde        | `#93BB4E` verde hoja     | Cabecera en `#05653A`: el verde de marca da 4.4:1 con blanco  |
| 4     | UMG         | `#003168` azul         | `#A1252B` rojo           |                                                               |
| 5     | UNIS        | `#540013` corinto      | `#EFA800` oro            | La bandera es azul y corinto; el oro es el acento de su sitio |
| 6     | UPANA       | `#001B42` azul marino  | `#9FD140` lima           |                                                               |
| 7     | UMES        | `#0A4735` verde bosque | `#E6DECA` arena          |                                                               |
| 8     | Galileo     | `#041B64` azul marino  | `#B89A59` dorado         | Bandera: marino, terracota y celeste                          |
| 9     | UNI         | `#006C8F` petróleo     | `#EE6946` naranja        | Cabecera en `#005A78`                                         |

Dónde aparecen: cabecera y cuerpo del perfil (`/universidades/[id]`), el reverso de su losa al pasar el cursor, su asiento en la mesa del hero al señalarlo, un punto de 8 px junto a "Silla NN" y la navegación silla anterior/siguiente. En reposo, todas las vistas generales son neutras y todas las losas miden lo mismo (antes la USAC ocupaba 2×2).

## 21. Portada en seis bloques (flujo de 15 segundos)

1. **Inicio**: qué es (título + una frase), **tres caminos** ("Busco un posgrado", "Quiero conocer una universidad", "Quiero escribirle al Foro") y cuatro cifras. La mesa SVG no es decoración: cada asiento es una universidad y enlaza a su perfil.
2. **Universidades**: 3×3 de losas iguales (2 columnas en móvil).
3. **Programas**: niveles + carrusel.
4. **Qué pasa en el Foro**: actividades (con la fecha como protagonista y "Próxima"), noticias y galería, cada una con salida a su página.
5. **Así trabaja la mesa**: tres pasos + "Lo que ya salió de la mesa" (aportes).
6. **Escríbele a la mesa**: elegir quién escribe rellena el asunto y lleva al mensaje.

Índice lateral fijo (`SectionRail`, ≥ 1280 px) con un punto por bloque; los nombres aparecen al acercar el cursor. Los hitos pasan a `/actividades`; los representantes, a cada perfil. Resultado: **~7 400 px** (≈ 8 pantallas) frente a 14 300.

## 22. Rendimiento: tres niveles de efectos (`lib/quality.ts`)

| Nivel   | Cuándo                                                                                             | Qué cambia                                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`  | Equipo capaz                                                                                       | Todo: Lenis, PixelSwap, inclinación 3D, DepthText con órbita                                                                                |
| `lite`  | ≤ 4 núcleos, ≤ 4 GB, ahorro de datos, pantalla táctil, o **< ~40 fps medidos** en los primeros 2 s | Mismas entradas y estados; sin WebGL, sin Tilt, sin backdrop-blur, DepthText a 6 capas y quieto, scroll nativo, bucles decorativos en pausa |
| `still` | `prefers-reduced-motion`                                                                           | Sin movimiento; el contenido aparece fijo                                                                                                   |

- Lo decide un script inline en `<head>` antes de pintar (sin parpadeo). `?efectos=full|lite|still` en la URL fuerza un nivel para pruebas.
- Portada: de 6 contextos WebGL a **0** (hero en SVG + GSAP; contacto con orbe y luz en CSS). WebGL queda solo donde aporta y en `full`: `ElasticMesh` sobre una foto real de noticia y `MorphSlider` con ≥ 2 imágenes en la galería (en `lite`, fundido encadenado).
- Fuera de los bucles por frame: `filter: blur()` animado en las tarjetas de proceso, glows SVG con `feGaussianBlur` en movimiento y el rAF de DepthText fuera de pantalla (ahora se detiene del todo).
- Sin uso tras v2.0 (no entran al bundle; se pueden borrar): `Constellation`, `AuroraLayer`, `DuskAurora`, `RingsBackdrop`, `MagicRings`, `Stats`, `Marquee`, `NewsMorph`, `RepresentativesSpotlight`, `ContributionsSticky`, `FlipCard`.

---

## 23. v3.0 — "Blanco y violeta"

**Motivo.** La v2.0 neutra se sentía plana ("muy simple, aburrida"). Nueva regla de color: **predomina el blanco y el morado está muy presente** en todas sus tonalidades. Ninguna de las nueve universidades usa morado (§20), así que el sitio sigue siendo neutral entre ellas. El concepto "mesa/silla" se retira de la interfaz: los usuarios no lo entendían.

**Paleta** (`styles/tokens.css`): blanco `#FDFCFF` / `#F5F2FC`, tinta violácea `#1E1830`, escala `violet-50…950` (texto AA desde 600), más orquídea `#8E4FB8`, ciruela `#7A3D8F`, mora `#8A3F7A`, índigo `#4B4AA8` y pervinca `#D7DAFF`. `--violet-glow` (600 → orquídea → 400) es la firma: botón principal, "Posgrado" del título, cifras, indicador activo. Los alias heredados (`sage`, `lilac`, `clay`…) apuntan ahora a tonos violeta para que todo el sitio cambie de una vez. Niveles de programa: Maestría violet-600, Doctorado violet-800, Especialización índigo, Diplomado mora.

**Por bloque:**

| Bloque              | Cambio                                                                                                                                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navbar              | Barra de cristal fija (sin transformarse al hacer scroll). Hover: píldora lavanda que se desliza (`layoutId`, muelle 520/42 sin rebote). Página actual: texto violeta + barrita en degradado que también se desliza. Fuera: filtro gooey, partículas, efecto magnético.                                                                       |
| Inicio              | Sin la mesa giratoria. Campo de luz violeta (3 orbes con `transform`, retícula de puntos), "Posgrado" en degradado, dos botones, **vitrina de programas reales** que se baraja sola (`ProgramDeck`), tres caminos, cifras en degradado y **cinta con las nueve universidades** en movimiento continuo.                                        |
| Universidades       | Sin "Silla N": arriba va el dominio web de cada una. El giro por píxeles se conserva con **intención de hover** (120 ms) y un **tope de 2 transiciones simultáneas** en toda la página; barrer el cursor ya no acumula cientos de clones.                                                                                                     |
| Perfil              | Sin la leyenda "colores institucionales" ni "silla". "Oferta de posgrado" en el color de la universidad: filtros con contador, cada nivel explica qué es y cuánto dura, tarjetas con modalidad, duración y ficha oficial; los grupos pequeños van lado a lado.                                                                                |
| Programas           | Flechas `Chevron` grandes de trazo fino con rótulo ("Anterior/Siguiente"). El índice lateral solo captura el cursor en sus puntos: antes su etiqueta invisible tapaba la flecha derecha.                                                                                                                                                      |
| Qué pasa en el Foro | Vuelven las animaciones de firma: línea de tiempo que se dibuja y enciende cada fecha, noticia que se endereza al acercarse, marco de galería que se abre con el scroll.                                                                                                                                                                      |
| Así trabaja el Foro | Tarjetas en progresión violeta (profundo → luminoso); flechas chevron sin círculo a los lados de las tarjetas.                                                                                                                                                                                                                                |
| Contacto            | Sin orbe ni "mesa", sin recuadros: "¿Quién escribe?" como tres palabras grandes que se subrayan y rellenan el asunto; campos de una línea con etiqueta flotante y línea violeta que se dibuja; "Enviar mensaje →". La sección lleva su propio fondo oscuro (`.section-dark`): el texto nunca queda claro sobre claro mientras cambia el tema. |

Estilos nuevos en `styles/v3.css`, cargado **después** de `globals.css` desde el layout.

## 24. v3.1 — Más movimiento en portada, programas y galería

| Pieza                          | Decisión                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vitrina de programas (portada) | `components/hero/CardSwap.tsx` (React Bits `CardSwap`, GSAP, easing elástico). Adaptado: mata el timeline al desmontar, se detiene fuera de pantalla, con la pestaña oculta o con el cursor encima, y queda quieto con menos movimiento. El mazo alterna niveles y universidades.                                                                                                          |
| Cifras                         | `RollingNumber`: odómetro (cada columna da una vuelta antes de detenerse), regla que se dibuja, etiqueta que sube desde una máscara y destello violeta al llegar.                                                                                                                                                                                                                          |
| Programas                      | Pestañas de nivel que entran una a una con inclinación 3D; tarjetas del catálogo que se "reparten" al entrar y **cada vez que cambia un filtro** (la retícula lleva `key` con la combinación de filtros); cabeceras con el cuadro que gira a su sitio; carrusel de portada que entra abriéndose en perspectiva. Ojo: `AnimatePresence initial={false}` anulaba la entrada; no usarlo aquí. |
| Qué pasa en el Foro            | Vuelve a ser tres capítulos: **Hitos** (`TimelinePath`), **Noticias** (`NewsMorph`) y **Galería**. `NewsMorph` solo monta `ElasticMesh` con foto real y en modo completo.                                                                                                                                                                                                                  |
| Galería                        | `components/fx/FlexCarousel.tsx` (React Bits, OGL/WebGL2, lente líquida) dentro de `GalleryShowcase`: fotos (click en la del centro = ampliar) y videos (miniatura 16:9 de YouTube/Vimeo o primer fotograma de los subidos; click = reproductor). En modo liviano o sin WebGL2: tira con scroll-snap y el mismo reproductor. También en la cabecera de `/galeria`.                         |
| Contacto                       | Declaración de quién recibe el mensaje, opciones numeradas con su descripción al acercarse, datos prácticos, campos numerados, barra de progreso de campos obligatorios ("Listo para enviar"), botón que se enciende al completar y "Hola" enorme casi invisible de fondo.                                                                                                                 |

Nota de pruebas: el backend limita a 120 peticiones/min por IP. Varios builds seguidos más capturas desde la misma máquina lo superan y las páginas estáticas salen sin datos hasta la siguiente revalidación; no es un error del frontend.

## 25. v4.0 — Guía en portada, noticias elásticas, hitos horizontales y microdetalles

Estilos en `styles/v4.css` (cargado después de `v3.css`).

| Pieza                 | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Vitrina de la portada | Ya no muestra programas reales: es una **guía del posgrado** (`components/hero/GuideDeck.tsx`) con cinco cartas grandes (Maestría, Doctorado, Especialización, Diplomado, "Cómo empezar"). Cada carta trae una regla de duración de 0 a 5 años que se rellena al llegar al frente, tres datos que entran en cascada, un barrido de brillo y luz que sigue al cursor. Debajo: pestañas con temporizador y botón de pausa. Click en una carta del fondo la trae al frente. `CardSwap` ganó `goTo/next/prev/setHeld`, `onFrontChange` y `onTick`; las cartas que salen se desvanecen al caer para no tapar lo de abajo. Los enlaces abren `/programas?nivel=…` ya filtrado. |
| Noticias              | `NewsMorph` reescrito: a la izquierda la portada de la nota activa es un `ElasticMesh` (tela que se hunde bajo el cursor y respira sola); a la derecha, el índice de las últimas cuatro notas. Pasar el cursor por una nota la muestra en la tela: la imagen nueva se **revela en círculo** y la tela da un latido (`ElasticMesh` ahora cambia de imagen sin reconstruir WebGL, encuadra como `object-fit: cover` y tiene `idle`). Avanzan solas cada 7 s si nadie las usa. Imágenes servidas por `/_next/image` (mismo origen, sin CORS en WebGL). Sin WebGL o en modo liviano: portadas apiladas con fundido.                                                          |
| Galería               | Al cerrar el reproductor de un video, la tarjeta ampliada vuelve a su sitio (`FlexCarousel` expone `controlRef.closeFocus`). Antes quedaba el recuadro solo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Hitos                 | `MilestonesTrack`: línea de tiempo **horizontal fijada con el scroll** (≥ 900 px y modo completo). Tarjetas alternadas arriba/abajo de una línea que se enciende, la más cercana al centro se adelanta en 3D, año enorme en contorno al fondo, marca "Hoy" entre lo pasado y lo próximo, contador y leyenda abajo. El cálculo por tarjeta corre solo mientras la pista se mueve y sin lecturas de layout. En móvil o modo liviano: tira con scroll-snap. `/actividades` conserva la línea vertical.                                                                                                                                                                      |
| Microdetalles         | Barra de progreso de lectura y anillo de "volver arriba" con animaciones ligadas al scroll (solo CSS); entrada de página en cada ruta (`app/template.tsx`, sin dejar `transform`); fotos que aparecen con fundido y enfoque al cargar (marcadas desde el `<head>`); foco que se asienta; brillo que cruza el botón principal; botones que se hunden al presionar; copiar correo con palomita que se dibuja y toast; barras de desplazamiento y cursor de texto en violeta; `text-wrap: pretty` en párrafos.                                                                                                                                                              |

Datos de simulación: `npm run seed -- --reset` (backend) siembra las nueve universidades con su oferta real de posgrado y datos ficticios de personas; ver `scripts/seed-data/CREDITOS.md`.

## 26. v4.1 — Entradas en todo el sitio, guía rediseñada, hitos interactivos y perfiles con su color

| Pieza              | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entradas animadas  | Un motor único en el script de arranque (`lib/quality-script.ts`, inline en `<head>`): todo elemento con `data-reveal="tipo"` (o hijo de `data-reveal-stagger`) entra la primera vez que aparece. Anima con la **Web Animations API**, sin tocar atributos ni clases: no hay parpadeo al hidratar ni diferencias para React, y empieza en el primer pintado. Un IntersectionObserver y un MutationObserver para todo el sitio; lo que entra junto se encadena en orden de lectura; `data-reveal-group` hace que un título entre palabra a palabra (`components/ui/Words.tsx` parte el texto en el servidor). Tipos: `up`, `down`, `left`, `right`, `fade`, `blur`, `scale`, `pop`, `tilt`, `swing`, `clip` (cortina + foto que se asienta), `rise`, `fold`, `line`, `deck` y las piezas de los hitos. En modo liviano, las variantes 3D y con desenfoque bajan a `up`; con menos movimiento no se oculta nada. |
| Dónde              | Portada (hero, encabezados de sección, universidades, noticias, contacto, aportes), cabecera de cada página interna, perfiles, detalle de noticias y actividades (cada párrafo del texto entra al llegar a él), galería en mosaico, pie de página, barra de navegación, 404 y carga. `FoldText` y `PageHeader` dejaron GSAP/SplitText para la entrada: eso era lo que hacía aparecer, desaparecer y volver a entrar el contenido al hidratar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Guía de la portada | Sin la barra de pestañas. Las cartas crecen hasta 600 px y ocupan **exactamente el alto de antes** (cartas + barra), así que el título no se mueve un píxel (medido en 390, 1024, 1280, 1536 y 1920 px). El tamaño sale de CSS con unidades de contenedor y el servidor ya manda cada carta en su sitio (`--slot`). Cada carta: ilustración propia animada en trazo blanco (escalones que se saltan, red con un nodo que se enciende, visor que enfoca, calendario de fines de semana, ruta con paradas y pin), regla de duración con escala, tres datos con icono y un consejo. Maquetación distinta si la carta es más alta que ancha. Inclinación de 2° (con tanto texto, 4° torcía las filas); 6.5 s por carta; flechas del teclado y foco la detienen.                                                                                                                                                    |
| Hitos              | Cada tarjeta entra atada a la línea: el punto aparece con rebote, el tallo crece y la tarjeta se despliega sobre él (bisagra en el borde que toca la línea). Al pasar el cursor se inclina hacia él con un brillo, una chispa baja por el tallo, el nodo late y el icono de su tipo hace su gesto (el sello se estampa, dos personas se encuentran, ondas del micrófono, página que pasa, puestos alrededor de la mesa, flecha que despega). En los ingresos, el color de la universidad inunda la tarjeta desde el puntero y su sello cae como un timbre. `/actividades` usa ahora la misma pista con la historia completa (se retiró `TimelinePath`).                                                                                                                                                                                                                                                        |
| Perfiles           | Dentro del perfil, superficies, líneas y acentos se derivan del color de la universidad (`.u-profile`). Fuera del perfil pero en su página (barra de navegación, progreso de lectura, selección, barras de desplazamiento, "volver arriba", chispas del click) también, vía `brandRootCss` en un `<style>` que se va con la página. Avatares sin fondo propio sobre un tinte claro de su color con aro del segundo color.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Imágenes           | Next 16 bloquea por defecto optimizar imágenes de IP privadas: `dangerouslyAllowLocalIP` solo cuando la API es local (`next.config.ts`). La portada elástica pedía calidad 80 (Next 16 solo acepta 75 por defecto). Las fotos de los representantes no se pedían en el perfil. Se retiró el "fundido al cargar" que marcaba `<img>` desde el `<head>` (rompía la hidratación); ahora es un fundido con WAAPI sin tocar el DOM.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Rendimiento        | El carrusel de programas solo escribe estilos de las tarjetas visibles (con la oferta completa, 124). La inclinación de la guía y de los hitos lee layout como mucho una vez por fotograma. En desarrollo, las respuestas de la API se cachean 10 s (cambios del panel visibles casi al instante sin pasar el límite de 120 consultas por minuto del backend).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## 27. v5.0 — "Anuario": rediseño visual (investigación, dirección y prompt de trabajo)

### 27.1 Encargo

Mejorar **lo visual** sin tocar las animaciones existentes (se conservan todas; se permiten extras), con tipografía mejor, que nadie batalle para entender qué está viendo, que deje de verse genérico o "hecho por IA", responsivo de 360 a 1920 px, y corrigiendo los errores que aparezcan. Colores acordes al blanco y violeta, sin saturar.

### 27.2 Prompt de trabajo (el que me aplico en cada vista)

> Actúa como director de arte y diseñador de interfaces senior de un sitio académico institucional. Antes de cambiar una vista: captura escritorio (1440) y móvil (390), enumera qué delata plantilla y qué confunde. Cada bloque debe responder en una línea "qué es esto y qué puedo hacer aquí". Jerarquía tipográfica de publicación académica (Newsreader + Schibsted Grotesk), estructura visible con filetes y retícula de 12 columnas, color plano y disciplinado (blanco dominante, violeta como tinta de marca, bandas sólidas, nunca manchas difusas ni texto en degradado), datos clave a la vista (cantidad, fecha, universidad, modalidad). No quites ninguna animación: cambia su vestido, no su mecánica. Mide antes y después; nada se corta ni se encima en ningún ancho. Prohibido: blobs de luz, píldoras con punto "en vivo", barra de cristal flotante, "01" en cuadritos, tarjetas idénticas con sombra suave, secciones calcadas, mono por decoración.

### 27.3 Auditoría de la v4.1 (capturas en 1440 y 390)

| Problema                                                                                                       | Dónde                      | Por qué importa                                                            |
| -------------------------------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------- |
| Fraunces 300 + Geist + manchas lavanda + palabra en degradado + píldoras                                       | Todo el sitio              | Es la combinación por defecto de los generadores de IA: se ve "plantilla". |
| El mismo encabezado en cada sección (kicker itálico con arco, título enorme, párrafo gris, botón a la derecha) | Portada y páginas internas | Monotonía; nada distingue un capítulo de otro.                             |
| Vacíos de 250–400 px entre secciones; portada de 10 060 px (13 350 en móvil)                                   | Portada                    | Se siente vacío/inconcluso, no "aireado".                                  |
| Losas grises con mucho espacio muerto y sellos genéricos                                                       | Universidades              | Poca información, mucho recuadro.                                          |
| Morado en degradado por todas partes (tarjetas de programas, hitos, pasos)                                     | Portada                    | Monotonía cromática; texto difícil de leer sobre degradado.                |
| Letras gigantes recortadas dentro de las pestañas de nivel                                                     | Programas                  | Parecen un error de maquetación.                                           |
| Catálogo de 124 tarjetas en una sola columna: **27 400 px** en móvil                                           | /programas                 | Imposible de recorrer en el teléfono.                                      |
| Fecha partida en dos líneas junto a un título truncado                                                         | Galería (mosaico)          | Error de maquetación.                                                      |
| Logo "F" en círculo, pie sin datos útiles                                                                      | Navegación y pie           | Identidad débil; el pie no orienta.                                        |

### 27.4 Investigación (31 sitios capturados; qué tomo de cada uno, sin copiar)

| Fuente                                      | Patrón                                                                                                                                                                                            | Cómo se adapta aquí                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Harvard GSAS, Yale                          | Etiqueta en versalitas seguida de un filete largo; marcos de 1 px que atraviesan bandas de color                                                                                                  | Encabezado de sección "etiqueta ── filete"; bandas sólidas con marco.       |
| Oxford, Melbourne                           | Cabecera de página en bloque de color sólido; título a la izquierda, entrada a la derecha; migas de pan                                                                                           | `PageHeader` con migas, título y entrada en dos columnas.                   |
| LSE, Bocconi, PUC Chile                     | Buscador de programas protagonista justo bajo la portada; columnas con filetes verticales (estudiar / noticias / eventos); fechas en bloque sólido                                                | Buscador "¿Qué quieres estudiar?" en la portada; fechas en bloque.          |
| ETH, Yale, PUC Chile                        | Tarjeta de texto que se monta sobre la foto                                                                                                                                                       | Portadas de noticias y actividades con pie montado.                         |
| Una Europa (alianza de 11)                  | El titular es una frase con enlaces subrayados ("alianza de [11 universidades]…")                                                                                                                 | Frase de la portada con enlaces punteados a universidades y programas.      |
| Group of Eight                              | La identidad es el número de miembros                                                                                                                                                             | **Emblema propio: el 9 en numeración maya** (barra = 5, cuatro puntos = 4). |
| Russell Group                               | Marcas de corte en esquinas que enmarcan el titular; tarjetas con cabecera de color                                                                                                               | Marcas de corte en la portada y en fotos destacadas.                        |
| RCA, Harvard                                | Líneas de retícula visibles                                                                                                                                                                       | Filetes de columna sutiles en bandas oscuras.                               |
| Uniandes                                    | Franja de aviso arriba ("Inscripciones…")                                                                                                                                                         | Aviso de la próxima actividad.                                              |
| Melbourne, Oxford (buscadores de programas) | Buscador en banda de color, filtros con conteo, resultados en filas con nivel en versalitas, título enlazado y una línea de datos con iconos (duración, modalidad, sede); pie de foto con crédito | Catálogo en filas legibles y paginado; datos con icono.                     |
| Stanford, Princeton                         | Foto real con titular abajo a la izquierda                                                                                                                                                        | Noticia destacada.                                                          |

### 27.5 Sistema v5

- **Tipografía:** Newsreader (titulares, eje óptico 6–72, pesos 400–600, itálica para el énfasis) + Schibsted Grotesk (texto e interfaz, 400–700, cifras tabulares). Se retiran Fraunces, Geist y Geist Mono. Etiquetas: versalitas de 12–13 px con interletra 0.08 em. Comparativa de 8 parejas con texto real del Foro antes de elegir.
- **Color:** blanco `#FFFFFF`/`#FDFCFF`; tinta `#1E1830`; violeta de marca `#4F339E` (700) para acción y bandas `#261A4F` (900); lila `#F6F2FF` para superficies; orquídea `#8E4FB8` solo como acento puntual. Sin degradados en texto ni manchas de fondo.
- **Estructura:** filetes de 1 px, retícula de 12 columnas, radios contenidos (4–10 px), sombras solo al interactuar.
- **Ritmo:** secciones más compactas; alternancia blanco / lila claro / violeta profundo.
- **Firma:** emblema del 9 maya en logo, favicon, pasos y pie (con una línea que lo explica).

### 27.6 Qué cambió por vista (las animaciones existentes se conservan todas)

| Vista                           | Cambio                                                                                                                                                                                                                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global                          | `styles/v5.css` (cargado después de v4) viste las piezas sin tocar su mecánica. Fuera las manchas de luz del `body`, el texto en degradado y las píldoras; etiquetas en versalitas; filetes de 1 px (`--rule`); botones de 6 px de radio y color sólido; capítulos oscuros con borde nítido.                          |
| Barra                           | Institucional a todo lo ancho: emblema + nombre completo (se oculta entre 1024 y 1199 px para que quepan los siete enlaces), losa lila que se desliza al pasar el cursor y filete de la página actual (mismas animaciones `layoutId`), atajo "Buscar programa". Menú móvil desde < 1024 px, con el mismo atajo.       |
| Encabezados                     | `Section`: etiqueta en versalitas con el **numeral maya** del capítulo (1–7) y un filete que se dibuja (`data-reveal="line"`); título a la izquierda, explicación y botón a la derecha. `PageHeader`: banda lila, migas de pan, mismo esquema; `size="article"` para títulos largos.                                  |
| Portada                         | Frase con enlaces punteados a lo que nombra (universidades, programas); **buscador de programas** como acción principal (`/programas?q=`) con atajos por nivel; tres caminos como índice con filetes; círculos planos en lugar de orbes difusos (misma deriva y parallax).                                            |
| Universidades                   | Fichas blancas: sello, sigla, nombre, "N programas · desde AAAA" (`countByUniversity`). El volteo por píxeles al reverso de color se mantiene.                                                                                                                                                                        |
| Programas                       | Pestañas de color plano con monograma (DepthText) arriba a la izquierda; fila deslizable en el teléfono. Carrusel: fichas de color plano con modalidad y duración rotuladas; el alto del carrusel acompaña a su escala (antes la tarjeta quedaba diminuta en el teléfono). Catálogo por tandas de 18 ("Mostrar más"). |
| Hitos, pasos, noticias, aportes | Color plano en portadas y paneles, etiquetas rectas, botones contenidos.                                                                                                                                                                                                                                              |
| Actividades                     | Boletos de 640 px que llenan su columna; filtros y rótulos en versalitas.                                                                                                                                                                                                                                             |
| Noticias                        | Destacada 4:5 en el teléfono (el texto ya no se sale); fichas blancas. Artículos: entrada destacada, listas con raya violeta, cita en itálica de Newsreader.                                                                                                                                                          |
| Galería                         | Pie de foto apilado (fecha en versalitas, título en dos líneas); enlaces de video con nombre accesible.                                                                                                                                                                                                               |
| Errores                         | Atajos a lo más buscado; el orbe baja en el teléfono para no cruzar el texto.                                                                                                                                                                                                                                         |
| Marca                           | Emblema (9 maya) en barra, pie, favicon, íconos de Android/iOS e imagen para compartir; el pie explica qué significa.                                                                                                                                                                                                 |

## 28. v6.0 — "Nueve en uno": movimiento con sentido, vistas con personalidad

### 28.1 Encargo

Que todo se vea profesional, moderno, interactivo y **único** (no genérico), con entradas animadas,
botones vivos y transiciones; rehacer una vista solo si de verdad hace falta; **conservar todas las
animaciones existentes** (se pueden mejorar o sumar, nunca quitar). Trabajo por fases, minucioso,
verificado en escritorio y teléfono.

### 28.2 Auditoría de la v5 (capturas 1440 y 390, 12 vistas)

| Qué delata plantilla o estorba                                                                  | Dónde                      |
| ----------------------------------------------------------------------------------------------- | -------------------------- |
| La misma cabecera lila (migas, etiqueta, título, párrafo) en las ocho páginas internas          | Todas las páginas internas |
| El mismo encabezado en los siete capítulos de la portada                                        | Portada                    |
| Cambiar de página es un corte seco: la foto o el sello que pulsaste desaparece y "vuelve"       | Navegación                 |
| Fichas planas con poca información (universidades, aportes); huérfana en 2 columnas (9 = 4+4+1) | Portada, /universidades    |
| Vacíos de 150–250 px entre bloques                                                              | Portada                    |
| La portada de la nota destacada queda en un marco con franjas                                   | /noticias                  |
| 24 actividades pasadas en boletos de 280 px sin agrupar: 15 000 px                              | /actividades               |
| Iconos dibujados a mano, cada uno con su trazo                                                  | Todo el sitio              |

### 28.3 Dirección

**Firma, en una frase:** nueve puntos —las nueve universidades— que se juntan en el 9 maya (cinco se
funden en la barra, cuatro quedan como puntos). Es el emblema, y ahora se mueve: se arma al abrir
el sitio, mientras carga una página y al pasar el cursor por la marca. Las cifras del Foro se
escriben también en numeración maya (posicional, base 20, con su concha para el cero): solo tiene
sentido aquí.

**Movimiento:** tono editorial-institucional: calmado y preciso, nada rebota sin motivo. Lo nuevo
es la **continuidad**: al cambiar de página, lo que pulsaste viaja a su sitio (sello → cabecera del
perfil, foto → portada de la nota) con `<ViewTransition>` de React; el resto se funde rápido y la
barra queda quieta. Los filtros reacomodan las fichas en su lugar (GSAP Flip) en vez de repartirlas
de nuevo.

**Iconos:** Phosphor (`@phosphor-icons/react`), peso `regular` en interfaz y `duotone` en piezas
destacadas, en violeta: un solo sistema de trazo para todo el sitio.

### 28.4 Fases

1. **Sistema:** iconos, emblema que se arma (marca, carga, errores), numeral maya posicional,
   botones (flecha que atraviesa, presión), transiciones entre páginas con elementos compartidos.
2. **Portada:** frase con vistas previas al pasar por sus enlaces, cifras con su numeral maya,
   universidades con el espectro de su oferta (y en filas en el teléfono), aportes, ritmo.
3. **Universidades y perfil:** cabecera propia, vista "Comparar" (tabla ordenable), perfil con
   índice fijo y filtros que reacomodan.
4. **Programas:** cabecera con buscador y conteo vivo, filtros con Flip, comparador de guardados.
5. **Actividades, noticias y galería:** cabeceras propias (cuenta regresiva a la próxima actividad,
   cabecera de periódico, mosaico), actividades por año, artículos con tiempo de lectura y nota
   siguiente, visor de fotos.
6. **Buscador global** (Ctrl/⌘ K), contacto, pie y pantallas de error.
7. **Revisión final:** 360–1920 px, menos movimiento, modo liviano, rendimiento, pruebas, build.

### 28.5 Registro por fase

**Fase 1 — Sistema.**

- `Emblem` con `motion`: `assemble` (barra de navegación: los nueve asientos se encienden, viajan y
  cinco se funden en la barra; al pasar el cursor, los cuatro puntos saltan en orden), `loop`
  (pantalla de carga) y `scroll` (pie: se arma con el scroll, `animation-timeline: view()`). CSS
  puro: corre antes de hidratar y con menos movimiento aparece armado.
- `MayaNumber`: numeración maya posicional (base 20, cifra mayor arriba, concha para el cero) y
  `mayaReading()` para su lectura en palabras. Pruebas en `tests/maya.test.ts`.
- Transiciones entre páginas: `<ViewTransition>` en `app/template.tsx`; la barra y el progreso de
  lectura quedan anclados; la losa de una universidad crece hasta ser la cabecera de su perfil
  (`share="uni-morph"`). Para que el par se forme, la página de destino tiene que estar lista en el
  mismo instante: las páginas de detalle (universidades, noticias, actividades) ahora se generan
  por adelantado con `generateStaticParams` + ISR (`staticIds` en `lib/api.ts`) y abren al instante.
  En desarrollo (sin precarga) se ve la transición general, no el viaje de la losa.
- Iconos Phosphor y `Arrow` (flecha que sale por su lado y entra por el opuesto) en lugar de los
  caracteres → ↗ ← ↓ ✉; `Button` la pone sola en los botones que llevan a otra página y se hunde al
  presionar (`scale`, que no choca con el `transform` del efecto magnético).

**Fase 2 — Portada.**

- La frase de la portada abre **adelantos** al detener el cursor (`components/hero/LinkPreview.tsx`):
  "nueve universidades" muestra los nueve sellos (cada uno lleva a su perfil); "124 programas", la
  oferta por nivel con barras que crecen (cada fila abre el catálogo filtrado). Solo con puntero
  fino; con teclado se abre al enfocar y Esc lo cierra; en táctil es un enlace normal.
- Cada cifra lleva su **numeral maya** (`MayaNumber`), que cae pieza a pieza cuando el odómetro se
  detiene, con un filete punteado entre pisos; una línea bajo las cifras explica cómo se leen.
- Universidades: el filete de cada ficha es el **espectro de su oferta** (un tramo por nivel,
  proporcional, con los colores del catálogo; se llena con el scroll y engrosa al pasar el cursor).
  En el teléfono, una fila por universidad; entre 640 y 1023 px la novena ocupa la fila entera.
- Encabezados de capítulo: el numeral maya crece y sus piezas caen ligadas a la entrada
  (`view-timeline` del encabezado). Menos vacío entre capítulos (`--section-y` hasta 5.25 rem).
- Aportes: icono Phosphor de su tipo con su gesto al pasar el cursor (el sello se estampa, el cohete
  despega, la mano late) y el filete de color que baja y tiñe la ficha.

**Fase 3 — Universidades y perfil.**

- `PageHeader` acepta `visual`: una pieza propia a la derecha; la banda gana una retícula de puntos
  (los "unos" mayas) que se desvanece hacia el texto.
- `/universidades`: **anillo de sellos** (`SealRing`, CSS puro con `@property --ring-r`): salen del
  centro a su asiento, el anillo gira muy despacio con los sellos derechos, y al señalar uno se
  detiene, ese sello crece con los colores de su universidad y el centro dice quién es y cuántos
  programas tiene. En modo liviano no gira.
- Vista **Comparar** (`UniversitiesCompare`, conmutador "Fichas / Comparar", `?vista=comparar`):
  tabla con programas por nivel, modalidades y año de ingreso; cada encabezado ordena (los empates
  respetan el orden oficial) y las filas se deslizan a su nuevo lugar; barras proporcionales por
  columna; primera columna fija y desvanecido que anuncia el desplazamiento en el teléfono. El botón
  "Comparar con las otras ocho" del perfil abre esta vista.
- Transiciones con **tipo**: la losa crece hasta la cabecera solo si se pulsó esa losa
  (`transitionTypes={['uni-tile']}`); desde el anillo, el **sello vuela hasta el logo** del perfil
  (`uni-seal`); desde otros enlaces, transición normal.
- Iconos de modalidad (`ModalityIcon`: aula, portátil, flechas) en lugar de ◉ ◎ ◐.
- Backend: `watchIgnoreFiles: ['**/frontend/**']` en `config/admin.ts`. `npm run develop`
  reiniciaba Strapi con cada cambio del frontend (y `next build` salía sin datos).

**Fase 4 — Programas.**

- Cabecera de `/programas`: **toda la oferta en puntos** (`OfferDots`): un punto por programa, una
  fila por universidad, color por nivel; la especialización además es un aro, para no depender solo
  del color. Entran en una ola diagonal; al señalar un punto aparece el nombre del programa.
- **Comparador de guardados** (`SavedCompare`): con una estrella marcada aparece una barra flotante
  ("N guardados · Ver en la lista · Comparar"); el panel muestra los guardados lado a lado (desde la
  derecha en escritorio, desde abajo en el teléfono) y permite quitarlos. Diálogo accesible: foco al
  abrir y de vuelta al botón al cerrar, Esc y fondo cierran, la página no se desplaza detrás.
- Búsqueda sin tildes ni mayúsculas ("gestion" encuentra "Gestión") y lo encontrado se **resalta**
  en el nombre. La animación de reparto de tarjetas al filtrar se conserva.
- Iconos de modalidad en los filtros; la barra de filtros se reparte mejor entre 768 y 1280 px.

**Fase 5 — Actividades, noticias y galería.**

- `/actividades`: la cabecera es el **talón de la próxima actividad** (`ActivityStub`): tinta de su
  tipo, día enorme, "Faltan N días" con odómetro y numeral maya (calculado en el navegador: la
  página es estática) y **Agregar al calendario** (`.ics` de día completo generado en el navegador,
  `lib/ics.ts`, con pruebas). Las actividades anteriores van **por año**; los dos más recientes
  abiertos y los demás plegados con sus títulos (la página medía 15 000 px).
- Detalle de actividad: el **talón del boleto vuela a la cabecera** (tipo `act-ticket`), cuenta
  "Faltan / Hace", universidades participantes como siglas y su galería en el visor.
- `/noticias`: cabecera con el **archivo en puntos por año** (`NewsCalendar`, CSS puro, globo con el
  título); la destacada llena su recuadro (la tela elástica gana `fit`).
- Artículo: la **foto viaja desde la ficha** a la portada de la cabecera (tipo `news-card`), tiempo
  de lectura (`readingMinutes`, con pruebas), **Compartir** (menú del sistema en el teléfono, copiar
  enlace en la computadora) y **nota anterior / siguiente** con su foto.
- `/galeria`: cabecera con un **abanico de fotos** y el conteo; el mosaico abre el **visor**
  (`Lightbox`): la foto crece desde su lugar, flechas, teclado, deslizar, contador y enlace a su
  actividad; los videos se reproducen ahí (YouTube sin cookies, solo al pulsar).
- Transiciones: la clave de `<ViewTransition>` es la ruta (`PageTransition`); antes, de /noticias a
  una nota o de una universidad a la siguiente no había animación porque la plantilla no se
  volvía a montar.
- Pendiente detectado (ya existía): tres videos de la galería piden miniaturas `maxresdefault` y
  `hq720` que YouTube no tiene (404 en la consola); el carrusel cae a otra miniatura, se ve bien.

**Fase 6 — Buscador global, contacto y errores (parcial).**

- **Buscador global** (`components/nav/CommandSearch.tsx`, `lib/search.ts` con pruebas): Ctrl/⌘ K,
  "/" o el botón "Buscar" de la barra y del menú móvil. Índice en `app/indice-de-busqueda/route.ts`
  (184 entradas, se renueva cada 5 min, `noindex`). Sin tildes ni mayúsculas, todas las palabras,
  prefijos, siglas primero, resaltado, grupos con conteo, ↑ ↓ Enter, Esc; diálogo accesible.
- El catálogo sigue a la dirección (`UrlSync` con `useSearchParams` en su propio Suspense): buscar
  desde el buscador global estando ya en /programas actualiza la lista.
- Contacto: al enviarse, el formulario da paso a un **acuse con el sello** que se arma ("Gracias,
  Ana") y el correo donde llegará la respuesta; "Escribir otro mensaje" devuelve el foco al nombre.
- Errores: el **número del error en numeración maya** (404 = un punto de 400, la concha del cero y
  cuatro puntos) cae pieza a pieza; atajo al buscador global.
- Pendiente: pie de página (fase 6) y la fase 7 completa.

## 29. v7.0 — Fluidez medida, letra con vida y fondos propios

### 29.1 Encargo

"Que no se trabe ni en la computadora ni en el teléfono, sin sacrificar animaciones"; contadores
que arranquen al aparecer; rediseños puntuales (oferta de la portada, hitos, galería con
MorphSlider, otro concepto para el anillo de universidades, Comparar más claro, tablero de la
oferta, selector de universidad, tarjetas de noticias, cabecera de la galería); tipografía con más
vida (incluso trazo dibujado); fondo interactivo propio por vista; entradas en todo. Por fases,
nada genérico.

### 29.2 Fase 1 — Fluidez (medida en la computadora del usuario: i5-10500 con Intel UHD 630)

Método: build de producción, Chrome con la GPU real (ventana fuera de pantalla), scroll con rueda;
fotogramas por `requestAnimationFrame`, trazas de Chrome (invalidaciones de estilo, capas, perfil
de CPU) y supresión de piezas una a una. Lo que trababa y cómo se resolvió, sin quitar animaciones:

| Causa (medida)                                                                                                                      | Arreglo                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PixelSwap` clonaba la cara entera (con su imagen) en cada píxel: ~420 copias por volteo al pasar el cursor                         | Una sola capa recortada con `clip-path: path()` que reúne las celdas abiertas; mismo patrón y curva                                                                                                            |
| Hitos: `--d/--ad` en el `<li>` en cada fotograma → recalculaba ~40 elementos por tarjeta (139 recálculos > 8 ms)                    | Escritura directa de `transform`/`opacity`/`translate` en las 3 piezas que se mueven (quedó 1)                                                                                                                 |
| Hitos: `filter: saturate()` y transiciones que se reiniciaban en cada fotograma                                                     | Solo propiedades de la GPU, sin transición en lo que cambia por fotograma                                                                                                                                      |
| 565 capas de GPU: `DepthText` (capas 3D reales), `FoldText` y tarjetas con 3D permanente, 124 tarjetas con `will-change`            | `DepthText` proyecta sus capas en 2D (gira solo el bloque); 3D solo mientras anima o con el cursor encima; carrusel virtual (solo existen las visibles)                                                        |
| `Tilt` (tarjetas de noticias) escribía 5 variables heredables por fotograma y animaba una sombra grande                             | `transform` en línea + variables registradas `inherits: false` para el brillo; sombra al entrar, no por fotograma                                                                                              |
| El tema de cada capítulo reescribía 9 variables en `:root` (recálculo de toda la página) y el `color` del body se interpolaba 1,1 s | Variables por capítulo en CSS; el cruce de fondo son dos capas fijas que se funden por opacidad                                                                                                                |
| `html:has(.u-profile) …` obligaba a revisar el documento con cada cambio del DOM                                                    | Esas reglas viajan en el `<style>` del perfil (`brandRootCss`)                                                                                                                                                 |
| Bucles decorativos (orbes, guía, cinta) seguían corriendo a miles de px                                                             | `OffscreenPause`: `data-away` pausa las animaciones CSS de los bloques lejanos                                                                                                                                 |
| Al cargar: prueba de WebGL (~0,4 s), tela elástica y carrusel WebGL montándose aunque estuvieran muy abajo                          | `useNear`: se preparan al acercarse (una pantalla antes)                                                                                                                                                       |
| Lenis mueve la página desde el hilo principal: con una página rica, ~15–20 % de fotogramas llegaban tarde                           | **Scroll suave adaptativo** (`SmoothScroll`): mide los primeros fotogramas de scroll y, si > 10 % llega tarde, deja el nativo (otro hilo, nunca se traba) y lo recuerda en el equipo. `?lenis=1/0` para probar |
| Cifras: esperaban a que React hidratara y ~1 s más                                                                                  | Las anima el script de arranque (`roll`, `flash`, `maya`, `data-reveal-at`): giran en cuanto aparecen                                                                                                          |

Resultado en la portada: fotogramas lentos al hacer scroll de 26–39 % a ~0 % con scroll nativo;
`DOMContentLoaded` de 850 a 480 ms; las cifras arrancan en < 0,3 s al llegar a ellas.

Reglas para lo que venga: nada de variables CSS heredables escritas por fotograma (escribir la
propiedad en la pieza, o `@property … inherits: false`); nada de 3D/`will-change` permanentes
(encenderlos al animar o con el cursor); nada pesado (WebGL, texturas) al cargar si está lejos;
medir con `scratchpad/perf` (Playwright con GPU) antes y después.

### 29.3 Fase 2 — Tipografía: "Anuario anotado"

Pedido: letra con vida, alegre, "no tan recta y sin vida", incluso como dibujada. Se compararon cinco
sistemas con texto real del Foro (Alegreya, Young Serif, Bricolage Grotesque, Recursive, Gloock):
Bricolage se ve "startup", Gloock de revista de moda, Recursive casual demasiado informal y Young
Serif no tiene pesos ni itálica. Elegido: **Alegreya** — caligráfica, con itálica verdadera y 400–900,
de Huerta Tipográfica (Argentina); su nombre viene de "alegría" — con **Alegreya Sans** (texto),
**Alegreya Sans SC** (versalitas reales en las etiquetas) y **Shantell Sans** (notas a mano, ejes de
informalidad y rebote). Solo subconjunto latino (cubre á é í ó ú ñ ü ¿ ¡); Shantell no se precarga.

Concepto: el anuario impreso (v5) **anotado a mano** por quien lo leyó. `components/ui/Scribble.tsx`
(subrayado, garabato, doble, círculo, resaltador, flechas, chispa, zigzag; caminos hechos a mano con
temblor) y `components/ui/Note.tsx` (nota en Shantell, inclinada, con flecha). Los trazos se dibujan
solos al aparecer (`data-reveal="draw"`, `stroke-dashoffset` con `pathLength=1`) y las notas saltan
(`note`), con el script de arranque: sin React ni medidas. `FoldText`, `Words`, `Section` y
`PageHeader` aceptan `mark={{ word, kind }}`: el trazo se dibuja justo después de que esa palabra
entra. Regla de la casa: **"nueve" siempre va encerrado en un círculo** (el 9 del emblema); cada
capítulo y cada página llevan su propio trazo.

Medidas: texto 1.125rem (Alegreya Sans tiene ojo pequeño), etiquetas 0.86rem en versalitas,
`ui-label` 0.92rem; titulares 700 (h1 760) con itálica de énfasis en violeta.

### 29.4 Fase 3 — Fondos propios de cada vista (`components/fx/PageBackdrop.tsx`)

Pedido: un fondo interactivo en todas las vistas, acorde a cada una y **no genérico**. Regla: el fondo
es el _papel_ de lo que se está viendo, no una textura decorativa.

| Vista                        | Papel                            | Qué hace el cursor                                                                                                         |
| ---------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Inicio                       | Puntos mayas                     | Cerca del cursor los puntos crecen y se funden de cinco en cinco en barras (cifras mayas; el emblema es el 9)              |
| Universidades                | Nueve hilos, uno por universidad | Los empuja; vibran al soltarlos y el que se toca se tiñe del color de su universidad. En un perfil, su hilo va en su color |
| Programas                    | Código de barras del catálogo    | Las barras cercanas se encienden en los colores de los cuatro niveles                                                      |
| Actividades                  | Hoja de calendario               | El día bajo el cursor se encierra en un círculo a mano (hoy ya va marcado)                                                 |
| Noticias                     | Semitono de periódico (45°)      | Lupa: la tinta crece bajo el cursor                                                                                        |
| Galería                      | Hoja de contactos de fotógrafo   | El cuadro bajo el cursor se marca con lápiz graso                                                                          |
| Contacto (oscuro) y el resto | Papel de carta rayado            | El cursor escribe un trazo de tinta que se seca                                                                            |

Contacto es oscura de punta a punta, así que su papel va _dentro_ de la sección (`BackdropLayer
local tone="dark"`); en el resto va fijo detrás de todo desde el layout. El encabezado de página y
el hero dejaron de ser opacos (el fondo se ve a través), y los puntos viejos del hero se retiraron.

Rendimiento: dos lienzos. El de base se dibuja una vez (al cargar, al cambiar de vista o de tamaño, y
cuando llegan las fuentes). El vivo solo existe con puntero fino y modo completo, dibuja únicamente
mientras algo se mueve y se detiene solo; en teléfono, modo ligero o movimiento reducido el fondo es
estático y no gasta nada. Los puntos se agrupan por intensidad (`dotBatch`: un `Path2D` por cada uno
de 12 niveles) en vez de cambiar de color punto por punto: en Noticias, con cientos de puntos por
fotograma, eso bajó los fotogramas lentos al mover el cursor de 19.7 % a 2.6 %. Medido con GPU real
(Chrome con ventana, 1920×1080, barrido de cursor de 3 s): todas las vistas entre 0 % y 4 %.

### 29.5 Fase 4 — Portada: el fichero, el códice y la galería que se funde

**"Toda la oferta" → el fichero** (`ProgramsRail`). Se veía vacía: una ficha de color plano en el
centro y nada a la izquierda. Ahora es el fichero de una biblioteca:

- cada programa es una **ficha de catálogo**: papel rayado con margen en el color del nivel,
  signatura en el margen (nivel, universidad, número), datos "llenados a mano" en Shantell,
  sello de goma de la universidad y la perforación de la varilla. La **pestaña** de cada nivel está
  a otra altura del borde (como los separadores de un cajón), así que en el abanico se leen los
  niveles de las fichas de atrás. El velo de profundidad tiene la silueta de la ficha y hunde las
  de atrás en lila (blanco sobre blanco se perdía);
- a la izquierda, **la ficha del frente abierta**: dónde se imparte, qué es, "lo que se estudia" con
  palomitas a mano, a quién va dirigida y los botones (`programBrief` en lib/format.ts separa la
  descripción del backend; si una no sigue la plantilla, todo queda como texto, nada se pierde);
- debajo, **el canto del cajón**: una raya por ficha en el color de su nivel. Muestra dónde está la
  del frente; al pasar el cursor dice cuál es cada una; click o arrastre la saca al frente. Al
  arrastrar, solo la marca y el título siguen al dedo y el fichero salta al soltar (recorrer 100
  fichas con su animación trababa). Para teclado es un deslizador.
- Intactos: el carrusel de profundidad, sus flechas y su animación (pedido explícito); `DepthCarousel`
  solo ganó `className` por tarjeta y `apiRef.goTo()`.

**Hitos → páginas de un códice** (solo vestido; la pista fijada, la curva 3D, la entrada, la
inclinación, la chispa y los iconos siguen igual): la línea es una banda de fechas con doble filete
(el avance se pinta en el filete de abajo), las tarjetas son páginas de papel con doble filete y la
foto montada dentro, el tipo va en un cartucho (como los bloques de glifos), las universidades
participantes en versalitas ("con USAC · URL…"), el folio de cada página en la cuenta maya, el año
del fondo también en numeración maya, los ingresos con su sigla en tinta y "se sumó al Foro" a mano,
y "hoy" escrito y encerrado a mano.

**Galería de la portada → MorphSlider + hoja de contactos** (`HomeGallery`, `MorphSlider`). El
deslizador WebGL que pasó el equipo, con sus valores (melt, intensidad 0.55, aberración 0.35, deriva
0.4, 1.1 s, power2.inOut, escala 2.4, bucle, radio 16, leyendas, controles e indicadores). Arrastrar
"frota" la transición; click amplía. Al lado, la **hoja de contactos** del fotógrafo: tira de
película con perforaciones y la foto actual encerrada a lápiz graso. Pie de foto como etiqueta de
papel con cinta. Adaptaciones de rendimiento: se crea al acercarse, solo dibuja en pantalla, en
reposo no calcula el ruido, texturas del tamaño que se dibuja y subidas a la GPU en ratos libres
(el tirón al cambiar de foto desapareció). Sin WebGL o en modo liviano: misma composición con
fundido. **/galeria no cambió** (sigue con su carrusel `GalleryShowcase`).

**Rendimiento encontrado de paso** (medido con trazas de Chrome):

- La portada mantenía **~420 capas de GPU**: el motor de entradas retenía cada elemento pendiente
  con una animación de opacidad/transformación en pausa, y Chrome hace capa de cada una. Ahora se
  retienen con un recorte (`clip-path`) en pausa, que no crea capa y no saca el contenido del árbol
  de accesibilidad (`visibility` sí lo sacaba); su animación se crea al entrar. Prueba aislada con
  300 elementos: trabajo de capas por fotograma de ~150 ms a ~12 ms. Además, lo que quedó arriba sin
  entrar (salto de scroll, cambio de alto) se muestra al detener el scroll.
- Animaciones de una sola vez con `both` (emblema del encabezado, espectro de universidades,
  numerales de capítulo, guía, fondo, ficha abierta) quedaban "vivas" en su último cuadro como
  capas: pasan a `backwards`, que en reposo se ve igual. Resultado: ~420 → ~220 capas.
- `OffscreenPause` marcaba secciones antes de que React las hidratara (aviso de hidratación en
  desarrollo): ahora solo marca nodos ya hidratados.
- Strapi en desarrollo vigilaba `frontend/.next` con Vite y recargaba el panel en cada build (más de
  un núcleo de CPU): `src/admin/vite.config.ts` lo ignora.

### 29.6 Fase 5 — Universidades: el librero y "Comparar" con preguntas

**El "átomo" (anillo de sellos en órbita) → el librero del Foro** (`UniversityShelf`; `SealRing` se
retiró). Pedido: otro concepto, no el mismo modelo con más animación. Nueve libros en un estante,
uno por universidad, en el mismo mundo de biblioteca que el fichero de la portada:

- **el grosor de cada lomo es su número de programas** (flex-grow = programas) y la altura varía
  como en un librero real; en el lomo, su sello, la sigla en versalitas verticales, el año en que
  entró al Foro y dos filetes "dorados";
- en reposo los lomos son de la familia violeta (el Foro es neutral); al señalar uno, el libro se
  saca del estante, sus vecinos se apartan inclinándose, el lomo toma el color de su universidad y
  los filetes su segundo color; abajo se lee quién es, cuántos programas tiene, desde cuándo está y
  su oferta por nivel en una barra;
- el sujetalibros es el emblema (el 9 maya); entrada: los libros caen al estante uno tras otro
  (`data-reveal="book"`) y el estante se extiende; click: su perfil, con el sello viajando hasta
  la cabecera (misma transición que tenía el anillo).

**Comparar → pregunta y respuesta** (`UniversitiesCompare`, `lib/compare.ts` con pruebas). La tabla
de nueve columnas con flechas de ordenar no se entendía. Ahora:

- "¿Qué quieres comparar?": cuántos programas, cada nivel, estudiar a distancia (virtual + híbrido)
  o desde cuándo están. Al elegir, **una frase responde** con nombres y cifras ("Solo 4 de las 9
  ofrecen doctorados: USAC, URL, UMG y Galileo, con 3 cada una") y la tabla se ordena;
- en vez de cinco columnas de números, **una barra por universidad**: su largo es el total y cada
  tramo un nivel en su color; al preguntar por un nivel solo ese tramo queda encendido (y la
  leyenda, que explica qué es cada nivel, también); la cifra que responde va grande con su puesto;
- entrada: el panel de la pregunta, luego las filas en cascada y las barras llenándose tramo por
  tramo (animaciones de una vez con `backwards`); al cambiar de pregunta las filas se deslizan.

### 29.7 Fase 6 — Catálogo: la cuenta maya y los sellos

**La "tabla" de puntos de la cabecera → la cuenta maya** (`OfferAbacus`; `OfferDots` se retiró).
Cada universidad es una varilla de ábaco con una cuenta por programa (del color de su nivel;
Especialización además rayada, para no depender solo del color). Al entrar, las cuentas se deslizan
a su sitio (`data-reveal="bead"`) y, **cada cinco, se funden en una barra**: así se escriben los
números mayas (puntos de uno, barras de cinco), de modo que cada varilla se lee como su cifra; al
final va el total en numeración maya y en arábigos. Al señalar una varilla, sus barras se abren en
cuentas y cada una dice qué programa es.

**Filtro por universidad → tira de sellos** (`UniversityStamps`). El desplegable se cambió por los
nueve sellos (y el emblema para "Todas"), cada uno con cuántos de sus programas coinciden con los
demás filtros (nivel, modalidad, búsqueda); los que se quedan en cero se ven tenues. El elegido
**se estampa**: cae girado como un sello de goma y queda con un aro de tinta del color de su
universidad (su color solo aparece en lo suyo). En el teléfono la tira se desliza de lado.

### 29.8 Fase 7 — Noticias como recortes; la galería como mesa de fotos

**Tarjetas de /noticias → recortes de periódico** (`NewsArchive`). Se medían fluidas tras la fase 1,
pero "no se renderizaban bien": la inclinación 3D (Tilt + capas en profundidad) obligaba al navegador
a dibujar el texto como imagen y girarla, y los títulos se veían borrosos mientras el cursor estaba
encima. Ahora, sin 3D:

- en reposo, cada nota es un recorte de papel un poco torcido, sujeto con cinta, con línea de
  cabecera de diario (N.º y fecha sobre doble filete), letra capitular y la foto **impresa en trama
  de puntos violeta** (como el fondo semitono de la página);
- al tomarlo (cursor o teclado): se levanta y se endereza, la trama se revela y deja la foto a color,
  la foto sigue al cursor con un paralaje 2D, el título se subraya a mano y la flecha avanza.
  Medido: 0 % de fotogramas lentos al recorrer seis tarjetas (antes 0.4–2 %) y menos de la mitad del
  trabajo de capas. La nota destacada conserva su malla elástica.

**Cabecera de /galeria → mesa de polaroids** (`PhotoFan`). Las cuatro fotos (que ya se abrían en
abanico al llegar, y lo siguen haciendo) son polaroids con su pie escrito a mano. Se pueden **tomar
y arrastrar**: la que se toma sube encima y, al soltarla, queda girada según cómo se lanzó; un toque
sin arrastre solo la sube; "ordenar la mesa" las devuelve al abanico. El arrastre escribe solo
`--dx`/`--dy` (registradas, sin herencia) en la foto que se mueve, sin transición mientras se arrastra
y con transición al soltar u ordenar.

### 29.9 Fase 8 — Entradas en todo el sitio y revisión final

**Entradas.** Se recorrió cada página buscando bloques visibles sin animación de entrada (ni
propia, ni de su contenedor, ni de sus piezas). Se sumaron: el texto y la cabecera del fichero, la
cabecera de la hoja de contactos, el título "Lo que ya dio resultados" y las flechas de "Así
trabaja"; en el catálogo, la caja de filtros, el conteo, los encabezados de cada nivel y "Mostrar
más"; en Actividades, los filtros (en cascada), las cabeceras de "Próximas"/"Anteriores" y los
botones de cada año. La auditoría encontró además una regresión propia: al retirar la tabla de
puntos se había borrado `@keyframes dot-in`, que usaban los puntos del calendario de Noticias
(ya restaurado; se verificó que ninguna animación del CSS apunta a fotogramas inexistentes).

**Revisión.**

- Sin desborde horizontal en 360, 768, 1024, 1280 y 1920 px en todas las páginas. En el teléfono,
  la tabla de Comparar ensanchaba la página (las filas que se deslizan al reordenarse); se arregló
  con `contain: paint` en su contenedor.
- Ninguna entrada queda retenida después de recorrer cada página, en modo completo y liviano, en
  escritorio y teléfono. Con "menos movimiento" todo se ve sin animar (la tira horizontal original de
  /galeria muestra sus fotos al deslizarla, como antes).
- Los trazos a mano ocultos dejaban asomar su punta redonda como un puntito (miniaturas de la hoja
  de contactos, subrayado de los recortes, trazos antes de dibujarse): patrón `1 2` y desfase `1.05`.
- En tableta, la ficha abierta del fichero ya no conserva su alto de escritorio (dejaba un hueco).
- Pruebas: 69 del frontend (nuevas: `programBrief`, `compareAnswer`) y 116 unitarias del backend;
  tipos, lint y formato limpios; compilación de producción correcta.

### 29.10 Ronda de ajustes (7-oct-2026): portada, pie, contacto y panel

- **Fondo de la portada · relieve** (`PageBackdrop.tsx`, patrón `relieve`): la retícula de puntos mayas distraía. Ahora son curvas de nivel de un paisaje volcánico (marching squares sobre rejilla de 8 px, ruido de valor con semilla), muy tenues (α 0.085; una de cada cinco "maestra", α 0.17), con triángulos de cumbre. Entran de la más baja a la más alta (una cada 45 ms, se reanuda si se vuelve a pintar a medias) y alrededor del cursor se enciende una copia (recorte circular con degradado `destination-in`, ~190 px). Nada se mueve solo.
- **Así trabaja el Foro** (`ProcessSteps.tsx`): se conservan las tres tarjetas 3D, el número con capas, el título que se despliega y el autoavance. Nuevo: renglones de acta, sello por paso que cae al llegar al frente, casillas que se marcan a mano; el diagrama ahora cuenta cada paso con las siglas de las nueve (desde la API): rueda y estrella {9/4} (nadie preside), radios hacia un acuerdo que se sella, fila que publica una página. Los puntos de control son un recorrido con nombre y tramo que se llena.
- **Contacto, una sola versión** (`ContactForm.tsx`): el mismo diseño en la portada y en `/contacto` (se quitó el papel rayado de la página). Más directo: pregunta-guía, opciones con su descripción siempre visible, tres pasos de qué pasa con el mensaje sobre el formulario, aviso de que la inscripción la hace cada universidad (se enciende al elegir «Estudiante») y botón de enviar que parece botón.
- **Noticias · hemeroteca** (`NewsCalendar.tsx`): la columna de puntos se cambió por pilas de periódicos doblados por año; caen uno a uno, la nota más reciente en morado, y al señalarlos se asoman con su título.
- **Pie** (`Footer.tsx`, `FooterMembers.tsx`): las nueve universidades con el **logotipo** que suben a Strapi (miniatura; la sigla si no hay o no carga), su color solo al pasar el cursor; debajo, el Foro, secciones, atajos y «Escribir al Foro».
- **Toda la oferta**: el panel izquierdo ya no depende de cómo esté redactada la descripción: `faculty`, `topics` (uno por línea) y `audience` son campos de Strapi; si vienen vacíos se usa lo que diga la descripción (`programBrief`).
- **Panel**: emblema y morados del Foro, textos de bienvenida, ~310 textos que Strapi no traía en español, tarjeta «Cómo cargar información» en el inicio y guía interactiva en `/guia/` (la sirve Strapi).
