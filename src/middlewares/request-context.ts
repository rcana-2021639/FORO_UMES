import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { randomUUID } from 'node:crypto';

/**
 * Identificador de solicitud + registro estructurado por petición (Sprint 6, tarea 1).
 * Reemplaza a `strapi::logger`.
 *
 * - Genera `requestId` (o reutiliza `X-Request-Id` si el proxy ya lo envía), lo expone en
 *   `ctx.state.requestId`, en la cabecera de respuesta y en el formato estándar de error.
 * - Registra método, ruta (sin query string, para no guardar datos personales), código,
 *   duración, IP y usuario del panel (id) si lo hay. Nunca cuerpos, tokens ni contraseñas.
 */
export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  const isProduction = process.env.NODE_ENV === 'production';

  return async (ctx: Context, next: Next) => {
    const incoming = ctx.get('x-request-id');
    const requestId = /^[\w.-]{8,64}$/.test(incoming) ? incoming : randomUUID();
    ctx.state.requestId = requestId;
    ctx.set('X-Request-Id', requestId);

    const start = process.hrtime.bigint();
    try {
      await next();
    } finally {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const user = ctx.state.user as { id?: number } | undefined;
      const entry = {
        requestId,
        method: ctx.method,
        path: ctx.path,
        status: ctx.status,
        durationMs: Math.round(durationMs * 10) / 10,
        ip: ctx.ip,
        ...(user?.id ? { adminUserId: user.id } : {}),
      };

      if (isProduction) {
        strapi.log.http('request', entry);
      } else {
        strapi.log.http(
          `${entry.method} ${entry.path} ${entry.status} (${entry.durationMs} ms) rid=${requestId.slice(0, 8)}`
        );
      }
    }
  };
};
