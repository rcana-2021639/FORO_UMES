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

---

## Registro de fases

| Fase               | Estado                            | Fecha       | Resumen                          |
| ------------------ | --------------------------------- | ----------- | -------------------------------- |
| 0 — Reconocimiento | Hecha (falta integración: Docker) | 29-sep-2026 | Todo compila y pasa; 7 hallazgos |
| 1 — Seguridad      | Pendiente                         |             |                                  |
| 2 — Robustez       | Pendiente                         |             |                                  |
| 3 — UX             | Pendiente                         |             |                                  |
| 4 — Accesibilidad  | Pendiente                         |             |                                  |
| 5 — SEO            | Pendiente                         |             |                                  |
| 6 — Panel          | Pendiente                         |             |                                  |
| 7 — Legal          | Pendiente                         |             |                                  |
| 8 — Despliegue     | Pendiente                         |             |                                  |
