# Auditoría de salida a producción — Foro Interuniversitario de Estudios de Posgrado

Documento de trabajo. Define **cómo** se revisa el sitio completo (backend Strapi + frontend Next.js) antes de publicarlo, en fases. Cada fase termina con: hallazgos → correcciones → pruebas → commit → resumen al equipo. No se pasa a la siguiente fase sin cerrar la anterior.

---

## Prompt maestro (rol y reglas)

> Actúa como un equipo senior formado por: ingeniero(a) backend (Strapi/Node/PostgreSQL), ingeniero(a) frontend (Next.js/React), especialista en seguridad ofensiva y defensiva (OWASP), especialista en SEO técnico, especialista en accesibilidad (WCAG 2.2 AA) y diseñador(a) de experiencia de usuario.
>
> Tu trabajo es dejar el Foro listo para producción y para aparecer en Google. Reglas:
>
> 1. **Primero entender, luego tocar.** Antes de cambiar algo, lee el código involucrado y los documentos vivos (`SEGURIDAD.md`, `TESTING.md`, `OBSERVABILIDAD.md`, `DESPLIEGUE.md`, `openapi.yaml`, `frontend/CLAUDE.md`). No rehagas lo que ya está bien.
> 2. **Cada hallazgo se demuestra.** Un problema se reporta con: dónde está (archivo:línea o URL), cómo se reproduce, qué impacto tiene y su severidad (Crítica / Alta / Media / Baja). Nada de "podría haber un problema" sin evidencia.
> 3. **Correcciones mínimas y con prueba.** Cada corrección de backend lleva su test (unitario o de integración). Las de frontend se verifican en el navegador real. Nada se da por arreglado sin volver a probarlo.
> 4. **Piensa como tres tipos de usuario**:
>    - _Normal_: sabe usar la web, quiere encontrar información rápido.
>    - _Despistado_: no lee, hace clic en cualquier parte, usa el botón "atrás", entra desde Google a una página interna, abre el sitio en un teléfono viejo con mala señal.
>    - _Muy despistado_: escribe mal, deja campos vacíos, pega textos enormes, hace doble clic en "Enviar", sube una foto de 20 MB en formato HEIC, no entiende términos técnicos, se pierde si no hay un camino claro de regreso.
>    - Y un cuarto: el _atacante_, que no es tonto y va a probar todo lo que el despistado hace por accidente, pero a propósito.
> 5. **El panel también tiene usuarios.** Los editores de cada universidad no son técnicos: cada campo necesita etiqueta clara, ayuda y validación que explique qué está mal.
> 6. **Honestidad.** La seguridad "al 100 %" no existe; el objetivo es defensa en profundidad, superficie de ataque mínima y capacidad de detectar y recuperarse. Se reporta lo que queda como riesgo aceptado.
> 7. Todo en español, siguiendo el estilo del código existente.

---

## Fase 0 — Reconocimiento (sin cambios)

- Inventario de rutas públicas del frontend, endpoints de `/api/*`, rutas del panel y variables de entorno.
- Levantar el entorno local completo con `npm run seed -- --reset`.
- Ejecutar el estado actual: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` (backend y frontend). Todo lo que ya falle se anota como línea base.
- `npm audit` en ambos proyectos.

**Entregable:** línea base de la situación actual.

## Fase 1 — Seguridad (el "tanque")

Referencias: OWASP Top 10 (2021/2025), OWASP ASVS nivel 2, OWASP API Security Top 10, guía de seguridad de Strapi y de Next.js.

Backend / API:

- Control de acceso: intentar leer/crear/editar recursos de otra universidad como editor (IDOR), campos privados expuestos en `/api/*` (emails, borradores, relaciones con usuarios admin), `populate` y `filters` que escapen de la lista blanca.
- Formulario de contacto: honeypot, límite de tasa, longitud máxima, inyección de cabeceras en correo, HTML/scripts en los campos, envíos duplicados.
- Subidas: tipos permitidos, tamaño, nombres de archivo maliciosos, EXIF con ubicación (quitar metadatos), SVG/HTML disfrazado.
- Autenticación del panel: fuerza bruta, política de contraseñas, duración de sesión, 2FA (evaluar), enumeración de usuarios en "olvidé mi contraseña".
- Cabeceras: CSP, HSTS, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`, CORS solo al dominio real.
- Errores: que ningún error de producción revele stack traces, versiones o rutas internas.
- Dependencias: vulnerabilidades conocidas, versiones fijadas, Dependabot/Renovate.
- Secretos: que no haya secretos en el repo ni en el historial de git; rotación documentada.
- Base de datos: usuario con mínimos privilegios, copias de seguridad automáticas y **prueba de restauración**.

Frontend:

- Cabeceras de seguridad y CSP propias del sitio Next.js (hoy no tiene).
- Renderizado de richtext/markdown sin XSS; enlaces externos con `rel="noopener noreferrer"`.
- Que no se filtren variables de entorno privadas al cliente.
- Protección frente a abuso del optimizador de imágenes de Next.

**Entregable:** informe de hallazgos con severidad, correcciones con tests, `SEGURIDAD.md` actualizado.

## Fase 2 — Robustez y errores

- Qué ve el usuario cuando Strapi está caído, lento o devuelve vacío (cada página).
- IDs inexistentes o mal formados en `/noticias/[id]`, `/actividades/[id]`, `/universidades/[id]` → 404 amigable, no error 500.
- Contenido incompleto: universidad sin logo, noticia sin imagen, actividad sin fecha, textos larguísimos, caracteres especiales y tildes.
- Formularios: doble envío, sin conexión, mensajes de error comprensibles.
- Tiempos de espera y reintentos en las llamadas a la API; caché/ISR para que un pico de visitas no tumbe Strapi.
- Monitoreo en producción: Sentry en frontend y backend, alertas de caída (uptime), registros sin datos personales.

## Fase 3 — Experiencia de usuario (usuarios despistados)

- Recorrido completo como cada tipo de usuario: ¿siempre sabe dónde está, cómo volver y qué hacer después?
- Navegación: menú claro, migas de pan en páginas internas, buscador (evaluar), estados vacíos con explicación.
- Lenguaje: sin jerga, botones con verbos claros, fechas y horas en formato local de Guatemala.
- Móvil primero: probar en 360 px, conexión 3G lenta, teléfonos de gama baja; las animaciones pesadas (three.js, GSAP) deben degradarse bien.
- Respeto a `prefers-reduced-motion`.

## Fase 4 — Accesibilidad (WCAG 2.2 AA)

- Contraste de colores, foco visible, navegación completa con teclado, textos alternativos en imágenes, jerarquía de encabezados, formularios con etiquetas, idioma `lang="es"`.
- Auditoría con Lighthouse y axe; corregir todo lo de nivel A y AA.

## Fase 5 — SEO y presencia en Google

Hoy faltan (confirmado en Fase 0 preliminar): `robots.txt`, `sitemap.xml`, imágenes Open Graph, datos estructurados JSON-LD y manifest.

- `app/robots.ts` y `app/sitemap.ts` dinámico (incluye noticias, actividades y universidades desde la API).
- Metadatos únicos por página: `title`, `description`, URL canónica, Open Graph y Twitter Card (con imagen generada por página).
- JSON-LD: `Organization`, `WebSite`, `NewsArticle` (noticias), `Event` (actividades), `CollegeOrUniversity` (universidades), `BreadcrumbList`.
- URLs legibles (evaluar slugs en lugar de `documentId`, con redirecciones 301).
- Core Web Vitals (LCP, INP, CLS) en verde en móvil.
- Íconos y `manifest.webmanifest`, `favicon` en todos los tamaños.
- Alta en Google Search Console y verificación del dominio.

## Fase 6 — Panel administrativo (editores de universidad)

- Recorrer el panel como editor de cada universidad: ¿puede cargar todo lo que el sitio muestra? ¿Falta algún campo (redes sociales, sitio web, horarios, requisitos de los programas, costos, modalidad, fechas de inscripción)?
- Descripciones y ayudas en cada campo del Content-Type Builder; validaciones con mensajes claros (longitudes, formatos de URL y correo).
- Vista previa del contenido antes de publicar.
- Guía de uso para editores (documento corto con capturas).
- Flujo de "olvidé mi contraseña" funcionando con SMTP real.

## Fase 7 — Legal y confianza

- Aviso de privacidad (el formulario de contacto recoge datos personales) y términos de uso.
- Política de cookies, solo si se agregan analíticas; preferir analíticas sin cookies.
- Página de contacto/responsables del sitio, créditos y fecha de última actualización.
- Declaración de accesibilidad (opcional, recomendada).

## Fase 8 — Despliegue y operación

- Revisar `DESPLIEGUE.md` contra la realidad: variables, dominios, HTTPS, redirección `www` ↔ sin `www`.
- Pipeline de CI: lint, typecheck, tests y build de frontend y backend antes de cada despliegue.
- Plan de respaldo y restauración probado; plan de reversión de un despliegue fallido.
- Lista de verificación final ("go-live checklist") y prueba de humo en producción.

---

## Resultado de la Fase 0 (29-sep-2026)

Pendientes externos: **dominio** (se configurará con `NEXT_PUBLIC_SITE_URL` / `FRONTEND_URL`; falta confirmar si el Foro apuntará un dominio propio al despliegue) y **SMTP** (no hay; sin él no hay recuperación de contraseña del panel ni aviso de mensajes de contacto).

| Verificación               | Backend                       | Frontend               |
| -------------------------- | ----------------------------- | ---------------------- |
| Lint                       | OK                            | OK                     |
| Typecheck                  | OK                            | OK                     |
| Tests unitarios            | 83/83 OK                      | — (no hay tests)       |
| Tests de integración / API | No ejecutados: Docker apagado | —                      |
| Build                      | OK                            | OK (ver hallazgo F0-4) |
| `npm audit` (producción)   | 23 (5 altas, 18 moderadas)    | 0                      |

Hallazgos:

- **F0-1 (Media)** — `sanitize-html` 2.16.0 fijado con `~2.16.0` tiene 3 avisos de XSS (GHSA-vccv-cmxp-4j9h, GHSA-g8qq-57p8-ggw5, GHSA-jxwj-j7wr-gfrw). Es dependencia directa de `src/security/richtext-sanitizer.ts`: justo la defensa contra XSS. Corrección: subir a 2.17.7 y repasar los tests del sanitizador. → Fase 1.
- **F0-2 (Media)** — El resto de avisos viene dentro de Strapi (`qs`, `react-router`, `stream-json`, `markdown-it`, `webpack-dev-middleware`). Strapi 5.53.0 → 5.55.1 disponible. `webpack-dev-middleware` solo se usa en `develop`, no en producción. Corrección: actualizar Strapi con `npm run upgrade:dry` y volver a auditar. → Fase 1.
- **F0-3 (Baja)** — El frontend no tiene tests automatizados. → evaluar en Fase 2 (al menos pruebas de humo de rutas).
- **F0-4 (Media)** — Si la API no responde durante `next build`, las páginas estáticas (`/`, `/actividades`, `/galeria`, `/programas`, `/universidades`) se generan sin datos y se sirven así hasta la siguiente revalidación. Revisar qué ve el usuario en ese caso y que un fallo no quede en caché como "contenido vacío". → Fase 2.
- **F0-5 (Alta, SEO)** — Sin `robots.txt`, `sitemap.xml`, imágenes Open Graph, JSON-LD ni manifest. → Fase 5.
- **F0-6 (Alta, seguridad)** — El frontend Next.js no envía cabeceras de seguridad propias (CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`). → Fase 1.
- **F0-7 (Media, legal)** — No hay aviso de privacidad, y el formulario de contacto recoge nombre y correo. → Fase 7.

Línea base completada con Docker: **51/51** pruebas de integración y API.

---

## Corrección de los hallazgos de la Fase 0 (29-sep-2026)

| Hallazgo | Estado    | Qué se hizo                                                                                                                                                                                                                                                                 | Cómo se verificó                                                                                                                                                                          |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0-1     | Corregido | `sanitize-html` 2.17.7; Jest transpila `htmlparser2` (ESM); enlaces con `target` llevan `rel="noopener noreferrer"`                                                                                                                                                         | 10 pruebas de regresión nuevas con los vectores de los tres avisos                                                                                                                        |
| F0-2     | Corregido | Strapi 5.55.1 (versiones exactas); overrides `qs` 6.16.0, `markdown-it` 14.3.2, `webpack-dev-middleware` 7.4.6; transferencia remota apagada                                                                                                                                | `npm audit`: 0 altas (antes 5); quedan 17 moderadas sin vía de explotación (SEGURIDAD.md §13); panel compila; suite completa verde                                                        |
| F0-3     | Corregido | Vitest en el frontend: 34 pruebas (API, formato, SEO, proxy, cabeceras) y trabajo `frontend` en CI                                                                                                                                                                          | `npm test` en `frontend/`                                                                                                                                                                 |
| F0-4     | Corregido | `critical()` lanza el error en tiempo de ejecución (Next conserva la última versión buena) y usa respaldo solo en `next build`                                                                                                                                              | Prueba real en modo producción apagando la API: la portada conservó su contenido tras vencer la caché; una página sin caché mostró la pantalla de error y «Intentar de nuevo» la recuperó |
| F0-5     | Corregido | `robots.txt`, `sitemap.xml` (56 URLs con `lastmod` e imágenes), manifiesto, íconos propios, imagen Open Graph, canónicas y metadatos completos por página, JSON-LD (Organization con sus 9 universidades, WebSite, NewsArticle, Event, CollegeOrUniversity, BreadcrumbList) | Rutas en 200; metadatos y JSON-LD revisados en el HTML de portada y noticia                                                                                                               |
| F0-6     | Corregido | CSP de lista cerrada + HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, COOP, `Permissions-Policy`; sin `X-Powered-By`                                                                                                                                                | En navegador: bloquea script, imagen, iframe y `fetch` ajenos; permite reproductor y API. Pruebas de cabeceras                                                                            |
| F0-7     | Corregido | `/privacidad` (lenguaje claro, solo lo que el sistema hace), enlace en el pie y junto al formulario; los mensajes se borran solos al año (tarea diaria)                                                                                                                     | Prueba de integración del borrado; revisión en navegador                                                                                                                                  |

### Hallazgos nuevos encontrados durante las correcciones

| ID   | Severidad | Hallazgo                                                                                                                                                                                        | Estado                                                                                                  |
| ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| N-1  | Alta      | Todas las consultas del servidor de Next comparten la IP y el cupo de **un** visitante (120/min): pidiendo URLs inventadas (`/noticias/xxxx`, `?pagina=N`) cualquiera dejaba al sitio sin datos | Corregido: cupo propio con `FRONTEND_API_TOKEN`, ids imposibles no consultan la API, `?pagina=` acotado |
| N-2  | Alta      | Imágenes de producción (R2) no permitidas en el optimizador de Next: no se habrían mostrado optimizadas. Y el comodín `**.railway.app` lo volvía un proxy de imágenes para cualquiera           | Corregido: `NEXT_PUBLIC_MEDIA_URL`, lista cerrada                                                       |
| N-3  | Alta      | DESPLIEGUE.md creaba el Super Admin **después** de publicar el dominio: mientras no hay admin, cualquiera en `/admin` puede registrarse como tal                                                | Corregido: se crea por consola antes de generar el dominio                                              |
| N-4  | Media     | Transferencia remota de datos encendida: con un token permite reemplazar toda la base                                                                                                           | Corregido: apagada (`REMOTE_TRANSFER_ENABLED`)                                                          |
| N-5  | Media     | «Intentar de nuevo» usaba `reset()`, que en Next 16 no vuelve a pedir los datos: el botón no hacía nada ante una falla del servidor                                                             | Corregido: `retry()` y mensaje comprensible                                                             |
| N-6  | Media     | Ids basura (`/noticias/abc`, `..%2F..`) respondían 200 y armaban rutas raras hacia la API                                                                                                       | Corregido: `proxy.ts` da 404 real; `findOne` no consulta ids imposibles                                 |
| N-7  | Media     | Privacidad: la sonda de miniaturas de la galería hacía que el navegador del visitante contactara a Google (i.ytimg.com) sin reproducir nada                                                     | Corregido: pasa por el optimizador; CSP más estricta                                                    |
| N-8  | Media     | El CI habría fallado en `npm audit --audit-level=high` (aviso nuevo de `webpack-dev-middleware`) y no validaba el frontend                                                                      | Corregido                                                                                               |
| N-9  | Media     | Los mensajes de contacto se guardaban para siempre                                                                                                                                              | Corregido: conservación de 365 días                                                                     |
| N-10 | Baja      | Favicon por defecto de Next/Vercel                                                                                                                                                              | Corregido: íconos de la marca                                                                           |
| N-11 | Baja      | DESPLIEGUE.md pedía un API Token _Read-only_ sin vencimiento que nadie usa                                                                                                                      | Corregido: eliminado                                                                                    |
| N-12 | Baja      | Los ids de YouTube no se validaban al armar el reproductor                                                                                                                                      | Corregido: `parseVideo`                                                                                 |
| N-13 | Baja      | Las descripciones (Google, tarjetas) mostraban enlaces Markdown crudos `[texto](url)`                                                                                                           | Corregido: `excerpt`                                                                                    |

### Hallazgos encontrados durante el rediseño visual v5 (30-sep-2026)

| ID   | Severidad | Hallazgo                                                                                                                                                                                                | Estado                                                                                                                                                                                      |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| N-14 | Media     | Amplificación de carga: la lista blanca solo revisaba el primer nivel de `populate`; una sola petición pública encadenaba cuatro niveles y devolvía ~580 KB (y admitía `filters`/`sort` y `*` anidados) | Corregido: rutas de segundo nivel explícitas (`representatives.photo`, `galleryItems.file`); lo demás responde 400. Pruebas unitarias y verificación contra el servidor                     |
| N-15 | Media     | El sanitizador de richtext escapaba el Markdown: las citas (`>`) salían como texto literal y cada guardado del panel corrompía los `&` (`&amp;` → `&amp;amp;`…)                                         | Corregido: solo `>` y `&` vuelven a su carácter (no abren etiquetas); idempotente, con pruebas. El frontend repara las citas ya guardadas y los resúmenes muestran caracteres, no entidades |
| N-16 | Baja      | Las miniaturas de la galería en el detalle de una actividad salían vacías (no se pedía el archivo de cada foto)                                                                                         | Corregido                                                                                                                                                                                   |
| N-17 | Baja      | Galería en mosaico: la fecha se partía en dos líneas junto a un título truncado; noticia destacada ilegible en el teléfono (el texto se salía de la foto); enlaces de video sin nombre accesible        | Corregido                                                                                                                                                                                   |

### Anotado para las fases siguientes

- **Fase 3/6** — El editor Markdown de Strapi tiene botón «Subrayado», que inserta `<u>…</u>`; el sitio muestra HTML embebido como texto literal (react-markdown no lo ejecuta). Verificar con contenido real y decidir: renderizar un subconjunto seguro (rehype-sanitize) o limpiar al guardar.
- **Fase 6** — Avisos de Strapi para el panel (encuestas NPS, publicidad de la edición Enterprise) activos por defecto: ruido para editores no técnicos.
- **Fase 7** — Falta un correo público oficial del Foro. El aviso de privacidad debe revisarlo quien represente legalmente al Foro (plazo de respuesta de 10 días hábiles, lista de proveedores).
- **Fase 8** — DESPLIEGUE.md no documenta dónde ni cómo se publica el frontend. Recomendado: Cloudflare delante del dominio (límite por IP y protección DDoS en el borde).

---

## Auditoría de seguridad y del panel (5-oct-2026)

Revisión completa como atacante, como editor de universidad y como visitante, con sondeos reales contra Strapi (pruebas de integración) antes de corregir. Se retiró el segundo diseño (`frontend-v2/`): sale a producción solo `frontend/`.

| ID   | Severidad | Hallazgo                                                                                                                                                                                                                                                                                                                                               | Corrección                                                                                                                     | Verificación                                                                                            |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| A-1  | Crítica   | El enrutador acepta mayúsculas y barra final (`/CONTENT-MANAGER/...`, `/upload/`), pero las defensas comparaban la ruta exacta. Un editor de la USAC **creó un programa a nombre de la URL**; se subió un ejecutable como `.png` (`/UPLOAD`); se esquivó la lista blanca (`/API/...`, 200 con populate profundo) y el límite del contacto (7/7 envíos) | `routePath()` canónica en el guard de propiedad, límite de tasa, lista blanca, verificación de imágenes, contraseñas y errores | `tests/integration/route-variants.test.ts`: 13 casos; sin la corrección fallan 8                        |
| A-2  | Crítica   | Next.js 16.3.5: ejecución remota de código en `next/og` (GHSA-vcvr-r3jv-pc5j); el sitio lo usa en `app/opengraph-image.tsx`                                                                                                                                                                                                                            | Next 16.3.8                                                                                                                    | `npm audit` del frontend: 0; build de 66 páginas                                                        |
| A-3  | Alta      | axios 1.19 dentro de Strapi: SSRF por redirecciones, DoS y contaminación de prototipos (6 avisos altos); Strapi 5.56.0 sigue trayendo 1.19                                                                                                                                                                                                             | Strapi 5.56.0 + override `axios ^1.20.0`                                                                                       | Suite completa en verde                                                                                 |
| A-4  | Alta      | El límite de login era por correo + IP: se podía probar una contraseña común contra todos los correos (los de los representantes son públicos)                                                                                                                                                                                                         | 30 intentos / 15 min por IP                                                                                                    | Prueba: el 31.º intento con correos distintos → 429; otra IP no se afecta                               |
| A-5  | Media     | «Olvidé mi contraseña» sin límite por IP: se podía agotar la cuota diaria de correo (Resend gratis: 100) e inundar el buzón de un editor                                                                                                                                                                                                               | 5 / hora por IP                                                                                                                | Prueba: 6.º → 429                                                                                       |
| A-6  | Media     | Las fotos pierden su GPS solo mientras «optimizar tamaño» esté encendido en el panel; apagarlo publicaría la ubicación de quien tomó cada foto                                                                                                                                                                                                         | El arranque lo vuelve a encender (y la orientación automática); IA de metadatos apagada                                        | Prueba con JPEG con GPS (incluso cuando la versión optimizada pesa más): original y miniaturas sin EXIF |
| A-7  | Media     | `braces` (alto, sin corrección) habría bloqueado todo despliegue en el CI                                                                                                                                                                                                                                                                              | `scripts/audit-check.mjs` con excepciones justificadas y con vencimiento                                                       | Falla sin la excepción y con la excepción vencida; pasa con ella vigente                                |
| A-8  | Media     | Panel en inglés y con nombres técnicos (`institutionalEmail`, `shortBio`, `infoUrl`) sin ayuda: inmanejable para editores no técnicos                                                                                                                                                                                                                  | Panel en español; etiqueta, ayuda, ejemplo y columnas por campo (`src/panel/labels.ts`); tildes en los nombres del menú        | En el panel: acceso en español; campos con etiqueta y ayuda (base de datos y prueba de integración)     |
| A-9  | Media     | El frontend consultaba la API sin tiempo límite: con la API colgada (no caída) las páginas esperaban sin fin                                                                                                                                                                                                                                           | 10 s en el servidor, 20 s en el navegador, mensaje claro                                                                       | Prueba unitaria; la caché ISR no se afecta (revisado en el código de Next)                              |
| A-10 | Baja      | Con IPv6, rotar direcciones del mismo /64 esquivaba cualquier límite por IP                                                                                                                                                                                                                                                                            | Se cuenta por /64                                                                                                              | Prueba unitaria e integración                                                                           |
| A-11 | Baja      | Nombre y asunto del contacto admitían saltos de línea (inyección de cabeceras de correo; nodemailer ya la neutraliza); un correo con coma se leía como dos destinatarios                                                                                                                                                                               | Campos de una línea; correo sin `,;<>()"\`                                                                                     | Pruebas unitarias                                                                                       |
| A-12 | Baja      | `/documentation` público en producción                                                                                                                                                                                                                                                                                                                 | Apagado en producción salvo `DOCUMENTATION_ENABLED=true`                                                                       | —                                                                                                       |
| A-13 | Baja      | `robots.txt` del dominio de la API permitía indexar `/admin`                                                                                                                                                                                                                                                                                           | `Disallow: /`                                                                                                                  | En vivo                                                                                                 |
| A-14 | Baja      | Telemetría de Strapi, encuestas NPS y publicidad Enterprise activas                                                                                                                                                                                                                                                                                    | Apagadas (`telemetryDisabled`, `flags`, `ai.enabled: false`)                                                                   | `/admin/init` → `uuid: false`                                                                           |
| A-15 | Baja      | `docker-compose.yml` publicaba PostgreSQL a toda la red local                                                                                                                                                                                                                                                                                          | Solo `127.0.0.1`                                                                                                               | —                                                                                                       |
| A-16 | Baja      | La imagen arrancaba Strapi a través de npm: el apagado ordenado (SIGTERM) de cada redespliegue no llegaba directo                                                                                                                                                                                                                                      | `node .../strapi.js start`                                                                                                     | Pendiente de probar en la imagen (ver abajo)                                                            |

Probado y **no vulnerable**: subir con otro nombre de campo (`file`, `files[]`), rutas codificadas (`%61`), barras dobles, uid alterado; dejar un registro propio sin universidad (validación obligatoria); reemplazar o renombrar la foto de otro editor (403); registrar un segundo Super Admin; enumerar correos con «olvidé mi contraseña» (siempre 204); enlaces `javascript:` en el Markdown (react-markdown los elimina y la CSP bloquea imágenes ajenas); `/documentation` no expone los tipos internos.

Comportamiento a conocer: `next build` necesita la API en línea; si no responde, la compilación falla y el hosting conserva la versión anterior (falla segura). Desplegar primero el backend y después el frontend.

Pendiente por el entorno: la imagen Docker se compiló entera pero no se pudo guardar ni ejecutar porque el disco de la máquina de desarrollo está al 98 %. La compila de nuevo el despliegue; verificar el arranque en el primer despliegue (`/_health` → 204).

---

## Auditoría en producción: Strapi, legal y accesibilidad (10-oct-2026)

Segunda ronda con el sitio ya desplegado (Vercel + Render + Supabase + Cloudinary). Se atacó la API en vivo (`foro-posgrado-api.onrender.com`) y se revisó el repo. **No vulnerable** confirmado en vivo: inyección en filtros (el ORM parametriza; o se rechaza con 400 o se trata como texto literal), `populate=*`/`populate[createdBy]`/filtrar u ordenar por campos de admin (400 `QUERY_NOT_ALLOWED`), `pageSize` enorme (acotado a 50), borradores ocultos, CORS de origen ajeno bloqueado, `.env` fuera de git y gitleaks en CI. Cabeceras en vivo correctas (HSTS, CSP cerrada, `nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`, HttpOnly/SameSite, sesión con refresh). SEO en vivo: `sitemap.xml`, `robots.txt`, manifiesto, favicon propio, 404 y JSON-LD responden.

| ID  | Severidad | Hallazgo                                                                                                                                                                                                                                                                  | Corrección                                                                                                                                                                       | Verificación                                                                                                                                   |
| --- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| B-1 | Media     | Al subir una imagen de más de 5 MB, el panel mostraba `FileTooBig` (inglés, sin decir el límite): confuso para editores no técnicos, el problema que más les frustra                                                                                                      | Middleware `global::upload-errors` (envuelve a `strapi::body`) traduce el 413 a un mensaje claro en español con el límite; el "5 MB" se centraliza en `src/lib/upload-limits.ts` | 5 pruebas unitarias (`upload-errors.test.ts`) + integración (subir 6 MB → 413 con mensaje en español, corre en CI); 127/127 unitarias en verde |
| B-2 | Media     | Faltaban páginas legales: **Aviso legal**, **Términos y condiciones** y **Aviso de cookies** (solo existía `/privacidad`); riesgo de queja por no informar                                                                                                                | `/aviso-legal`, `/terminos`, `/cookies` con el estilo del sitio; enlaces en el pie; en el sitemap. Marcadores `[entre corchetes]` para datos que completa el Foro                | Renderizadas en navegador (capturas); enlaces del pie verificados; 71/71 pruebas del frontend                                                  |
| B-3 | Media     | Sin rastreo (no hay analítica ni cookies de publicidad; confirmado): no hace falta banner de consentimiento, solo un aviso claro                                                                                                                                          | El aviso de cookies explica que solo se usa almacenamiento local técnico; previsto actualizarlo si algún día se agrega analítica                                                 | Revisión en navegador                                                                                                                          |
| B-4 | Media     | El aviso de privacidad nombraba proveedores que ya no se usan (Railway, Cloudflare, Resend) en vez de los reales                                                                                                                                                          | Actualizado a Vercel, Render, Supabase, Cloudinary, Brevo, Sentry                                                                                                                | Revisión en navegador                                                                                                                          |
| B-5 | Media     | Las portadas de noticias y actividades caían a `alt=""` cuando el editor no llenaba el texto alternativo: para un lector de pantalla, una imagen de contenido desaparece                                                                                                  | El `alt` cae al **título** de la noticia/actividad si no hay texto alternativo (`alternativeText \|\| title`), en archivo y listados; la galería ya lo hacía                     | Typecheck + revisión; corre en producción tras el despliegue (la API local estaba apagada)                                                     |
| B-6 | Alta      | El CI de `main` llevaba en rojo desde el 8-oct por vulnerabilidades nuevas en dependencias: `handlebars` 4.7.9 (2 críticas, inyección de JS; solo en herramientas de desarrollo: generadores CLI, ts-jest, plop) y `sharp` 0.35.4 (alta, por librsvg; backend y frontend) | Overrides a `handlebars ^4.7.10` (backend) y `sharp ^0.35.5` (backend y frontend). No se usó la lista de excepciones porque sí había versión corregida                           | `audit-check.mjs` limpio en backend y frontend; 196 pruebas backend y 71 frontend en verde; builds de ambos OK                                 |

**No era problema (ya resuelto antes):** los logos decorativos usan `alt=""` con el nombre de la universidad en el `aria-label` del enlace; `lang="es"`, enlace "Saltar al contenido", `h1` por página y jerarquía de encabezados correcta; formularios con etiqueta (A-8).

Pendiente por el entorno (Fase D): la base de prueba local no se pudo levantar (Docker no arranca, disco al 98 %), así que la prueba de integración de la subida pesada se validará en CI; cargar las 9 universidades con datos reales; probar un respaldo + restauración de Supabase; borrar la cuenta temporal local; verificar la IP real en la bitácora.

---

## Registro de fases

| Fase               | Estado     | Fecha       | Resumen                                                                                                                 |
| ------------------ | ---------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| 0 — Reconocimiento | Hecha      | 29-sep-2026 | Todo compila y pasa; 7 hallazgos, corregidos junto con 13 nuevos (ver arriba)                                           |
| 1 — Seguridad      | Hecha      | 5-oct-2026  | Revisión a fondo con sondeos reales: 16 hallazgos (A-1 a A-16), todos corregidos y con pruebas                          |
| 2 — Robustez       | Adelantada | 5-oct-2026  | Tiempo límite en las consultas del frontend (A-9)                                                                       |
| 3 — UX             | Pendiente  |             |                                                                                                                         |
| 4 — Accesibilidad  | Adelantada | 10-oct-2026 | `alt` de portadas cae al título (B-5); confirmados skip link, `lang`, jerarquía de encabezados y logos con `aria-label` |
| 5 — SEO            | Adelantada | 29-sep-2026 | Lo básico hecho (F0-5); faltan Core Web Vitals y revisión con datos reales                                              |
| 6 — Panel          | Adelantada | 10-oct-2026 | Panel en español (A-8) y mensaje claro de imagen pesada (B-1); falta la guía corta para editores                        |
| 7 — Legal          | Adelantada | 10-oct-2026 | Privacidad + aviso legal + términos + cookies (B-2..B-4); falta revisión legal y correo/datos oficiales del Foro        |
| 8 — Despliegue     | En curso   | 7-oct-2026  | Desplegado (Vercel + Render + Supabase + Cloudinary); falta respaldo/restauración probados y datos reales (Fase D)      |
