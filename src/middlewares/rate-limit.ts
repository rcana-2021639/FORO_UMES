import { createHash, timingSafeEqual } from 'node:crypto';
import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { RateLimiter, type RateLimitRule } from '../lib/rate-limiter';
import { buildApiError } from '../lib/api-error';

/**
 * Límite de tasa diferenciado por ruta (plan técnico, Sprint 5, tarea 4).
 * - POST /api/contact: estricto (5 por hora por IP) — anti spam.
 * - /api/* desde el servidor del frontend (X-Frontend-Token válido): cupo propio, amplio.
 * - Resto de /api/*: permisivo (protege de abuso básico sin molestar a un visitante).
 * - /admin/login lo protege el limitador nativo de Strapi (config/admin.ts → rateLimit).
 *
 * Implementación en memoria (ver src/lib/rate-limiter.ts): adecuada para un proceso único.
 */
type RateLimitConfig = { frontendToken?: string } | undefined;
type Matcher = (ctx: Context) => boolean;

/** Un token más corto no se acepta: se podría adivinar. */
export const FRONTEND_TOKEN_MIN_LENGTH = 32;

const sha256 = (value: string) => createHash('sha256').update(value).digest();

/**
 * Reconoce al servidor del frontend (Next.js) por la cabecera X-Frontend-Token. Todas sus
 * consultas salen de la misma IP: con el cupo de un visitante, cualquiera podría agotarlo pidiendo
 * URLs inventadas y dejar el sitio entero sin datos. La cabecera solo cambia el cupo, no da acceso
 * a nada que el público no pueda leer. Se compara en tiempo constante (hash de igual longitud).
 */
export function frontendMatcher(token: string | undefined): Matcher {
  if (!token || token.length < FRONTEND_TOKEN_MIN_LENGTH) return () => false;
  const expected = sha256(token);
  return (ctx) => {
    const received = ctx.get('x-frontend-token');
    return received.length > 0 && timingSafeEqual(sha256(received), expected);
  };
}

export function buildRules(isFrontend: Matcher): Array<{ match: Matcher; rule: RateLimitRule }> {
  return [
    {
      match: (ctx) => ctx.method === 'POST' && ctx.path === '/api/contact',
      rule: { name: 'contact', windowMs: 60 * 60 * 1000, max: 5 },
    },
    {
      // El frontend cachea casi todo (ISR): el uso legítimo ronda decenas por minuto
      match: (ctx) => ctx.path.startsWith('/api/') && isFrontend(ctx),
      rule: { name: 'frontend', windowMs: 60 * 1000, max: 1500 },
    },
    {
      match: (ctx) => ctx.path.startsWith('/api/'),
      rule: { name: 'api', windowMs: 60 * 1000, max: 120 },
    },
  ];
}

const limiter = new RateLimiter();

export default (config: RateLimitConfig, { strapi }: { strapi: Core.Strapi }) => {
  const token = config?.frontendToken;
  if (token && token.length < FRONTEND_TOKEN_MIN_LENGTH) {
    strapi.log.warn(
      `[rate-limit] FRONTEND_API_TOKEN tiene menos de ${FRONTEND_TOKEN_MIN_LENGTH} caracteres: se ignora`
    );
  } else if (!token && process.env.NODE_ENV === 'production') {
    strapi.log.warn(
      '[rate-limit] sin FRONTEND_API_TOKEN: el frontend comparte el límite de un visitante'
    );
  }
  const rules = buildRules(frontendMatcher(token));

  return async (ctx: Context, next: Next) => {
    const entry = rules.find((r) => r.match(ctx));
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
