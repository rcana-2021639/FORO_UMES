# DESIGN_NOTES — Frontend del Foro Interuniversitario de Estudios de Posgrado

> Documento de dirección de diseño. Se escribe **antes** de codear y se actualiza si la dirección cambia.
> Estado: **v3.0 "Blanco y violeta"** (ver §23; §19–§22 describen v2.0 y siguen vigentes en lo que no contradiga a §23). Las notas marcadas con ▸ registran desvíos respecto a la propuesta inicial y su motivo.

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
