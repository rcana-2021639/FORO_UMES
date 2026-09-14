import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { RateLimiter, type RateLimitRule } from '../lib/rate-limiter';
import { buildApiError } from '../lib/api-error';

/**
 * Límite de tasa diferenciado por ruta (plan técnico, Sprint 5, tarea 4).
 * - POST /api/contact: estricto (5 por hora por IP) — anti spam.
 * - Resto de /api/*: permisivo (protege de abuso básico sin molestar al frontend).
 * - /admin/login lo protege el limitador nativo de Strapi (config/admin.ts → rateLimit).
 *
 * Implementación en memoria (ver src/lib/rate-limiter.ts): adecuada para un proceso único.
 */
export const RATE_LIMIT_RULES: Array<{ match: (ctx: Context) => boolean; rule: RateLimitRule }> = [
  {
    match: (ctx) => ctx.method === 'POST' && ctx.path === '/api/contact',
    rule: { name: 'contact', windowMs: 60 * 60 * 1000, max: 5 },
  },
  {
    match: (ctx) => ctx.path.startsWith('/api/'),
    rule: { name: 'api', windowMs: 60 * 1000, max: 120 },
  },
];

const limiter = new RateLimiter();

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: Context, next: Next) => {
    const entry = RATE_LIMIT_RULES.find((r) => r.match(ctx));
    if (!entry) return next();

    const result = limiter.hit(entry.rule, ctx.ip);
    ctx.set('X-RateLimit-Limit', String(entry.rule.max));
    ctx.set('X-RateLimit-Remaining', String(result.remaining));

    if (!result.allowed) {
      ctx.set('Retry-After', String(result.retryAfterSeconds));
      strapi.log.warn(
        `[rate-limit] ${entry.rule.name}: límite superado por ${ctx.ip} en ${ctx.path}`
      );
      ctx.status = 429;
      ctx.body = buildApiError(
        ctx,
        429,
        'RATE_LIMITED',
        `Demasiadas solicitudes. Intente de nuevo en ${result.retryAfterSeconds} segundos.`
      );
      return;
    }

    return next();
  };
};

/** Solo para pruebas: reinicia los contadores. */
export const resetRateLimiter = () => limiter.reset();
