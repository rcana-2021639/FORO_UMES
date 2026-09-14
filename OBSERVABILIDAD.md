# Observabilidad — Backend del Foro Interuniversitario

Cómo saber qué está pasando en el sistema y qué hacer cuando algo falla (Sprint 6).

## 1. Registros (logs)

### Formato

| Entorno       | Formato                                                                    | Nivel por defecto               |
| ------------- | -------------------------------------------------------------------------- | ------------------------------- |
| `development` | Texto legible con colores                                                  | `http` (una línea por petición) |
| `production`  | **Una línea JSON por evento**: `{"level","message","timestamp",...campos}` | `info`                          |

El nivel se cambia con `LOG_LEVEL` (`error` < `warn` < `info` < `http` < `debug`). En producción, `LOG_LEVEL=http` activa el registro por petición si se necesita diagnosticar tráfico; `debug` solo puntualmente.

### Registro por petición (`src/middlewares/request-context.ts`)

Cada petición genera un **`requestId`** (UUID) que:

- se devuelve en la cabecera `X-Request-Id`;
- aparece en el formato estándar de error (`error.requestId`);
- se incluye en la línea de log de la petición.

Si el proxy del hosting ya envía `X-Request-Id`, se reutiliza. Campos registrados: `requestId, method, path, status, durationMs, ip, adminUserId` (solo si hay sesión del panel).

**Nunca se registran**: query strings (pueden llevar datos personales), cuerpos, tokens, contraseñas ni el contenido de los mensajes de contacto.

### Otras líneas útiles

| Prefijo               | Qué indica                                                                |
| --------------------- | ------------------------------------------------------------------------- |
| `[security]`          | Arranque: rol/permisos sincronizados, rutas deshabilitadas                |
| `[indexes]`           | Índices adicionales verificados                                           |
| `[contact]`           | Mensaje recibido, honeypot descartado, notificación enviada/fallida       |
| `[rate-limit]`        | Una IP superó un límite (ruta y regla)                                    |
| `[audit]`             | Fallo al escribir en la bitácora (la petición original no se ve afectada) |
| `unhandled api error` | Error 5xx en `/api/*` con `requestId`, ruta y nombre del error            |

### Dónde consultarlos

- **Local**: consola de `npm run develop`.
- **Railway**: panel del servicio → _Deployments → View logs_ (búsqueda por texto: pega el `requestId` que reportó el usuario o el frontend).

## 2. Errores

### Respuesta al cliente

Toda ruta `/api/*` responde errores con:

```json
{
  "error": {
    "status": 404,
    "code": "NOT_FOUND",
    "message": "El recurso solicitado no existe.",
    "requestId": "…"
  }
}
```

Códigos: `VALIDATION_ERROR`, `QUERY_NOT_ALLOWED`, `NOT_FOUND`, `FORBIDDEN`, `UNAUTHORIZED`, `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`, `INVALID_IMAGE`, `INTERNAL_ERROR`.

Un `500` **nunca** incluye trazas ni detalles internos: solo el mensaje genérico y el `requestId` para buscar el detalle en logs/Sentry (`src/middlewares/api-errors.ts`).

### Sentry (`@strapi/plugin-sentry`)

- Se activa solo si existe `SENTRY_DSN`. Sin DSN el plugin queda deshabilitado (desarrollo).
- `sendMetadata: false`: no se envían cabeceras, cuerpo ni IP de la petición. Solo la excepción y su traza.
- `SENTRY_ENVIRONMENT` separa `staging` de `production`; `SENTRY_RELEASE` (opcional) etiqueta la versión desplegada.
- Cuenta y proyecto: los crea el equipo del Foro en sentry.io (nivel gratuito: 5,000 eventos/mes). Pegar el DSN en las variables de Railway.

## 3. Métricas

| Métrica                                          | Dónde verla                                                                                                                                                                                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CPU, memoria, red del servicio                   | Panel de Railway → _Metrics_                                                                                                                                                                                                                 |
| Tiempo de respuesta por endpoint (promedio, p95) | Logs JSON: campo `durationMs` filtrado por `path`. Railway y la mayoría de agregadores permiten graficarlo. Si se quiere un panel dedicado, exportar los logs a un agregador (Better Stack, Axiom, Grafana Cloud — todos con nivel gratuito) |
| Tasa de error                                    | Sentry (eventos por hora) + logs con `status >= 500`                                                                                                                                                                                         |
| Conexiones a PostgreSQL                          | Panel de Railway → servicio Postgres → _Metrics_                                                                                                                                                                                             |
| Salud del proceso                                | `GET /_health` → `204` (usarlo como health check del hosting)                                                                                                                                                                                |

## 4. Rendimiento

- **Paginación** máxima de 50 y **populate mínimo** por defecto en todos los listados (`src/lib/public-api.ts`): evita N+1 y respuestas gigantes. Revisado en `/api/activities` y `/api/news-items`: solo se cargan `coverImage` y universidades (nombre y siglas).
- **Índices** para las consultas frecuentes (`database/indexes.ts`).
- **Pool de conexiones** a PostgreSQL: `DATABASE_POOL_MIN` / `DATABASE_POOL_MAX` (por defecto 2/10). Ajustar `MAX` por debajo del límite del plan de la base administrada (Railway Postgres: revisar `max_connections` del plan; dejar margen para el panel y las migraciones).
- **Compresión** gzip/brotli en respuestas > 1 KB (`src/middlewares/compress.ts`).
- **Cache en memoria** solo donde se justifica: `GET /api/forum-summary` (5 consultas agregadas, TTL 60 s). No se introduce Redis: el tráfico esperado no lo requiere y añadiría un servicio más que operar. Si en producción `/api/universities` o `/api/academic-programs` muestran carga alta, se puede añadir el mismo patrón de cache de corta duración sin cambiar la arquitectura.

## 5. Qué hacer ante una alerta de errores

1. **Identificar**: tomar el `requestId` (lo devuelve la API y lo verá el frontend) o el evento de Sentry.
2. **Buscar en logs** por ese `requestId`: la línea `unhandled api error` tiene ruta y nombre del error; la línea de petición tiene duración y estado.
3. **Clasificar**:
   - Muchos `429` → una IP abusando; los límites están funcionando. Si es tráfico legítimo (p. ej. el frontend haciendo demasiadas peticiones), revisar el frontend antes de subir el límite en `src/middlewares/rate-limit.ts`.
   - `500` con `KnexTimeoutError` / `ECONNREFUSED` → base de datos caída o pool agotado: revisar el servicio Postgres en Railway y `DATABASE_POOL_MAX`.
   - `500` tras un despliegue → revertir (ver `DESPLIEGUE.md`) y reproducir en local.
   - Errores solo en el panel → revisar la bitácora de auditoría (quién hizo qué justo antes).
4. **Reportar** el `requestId` y la hora en el canal del equipo.
