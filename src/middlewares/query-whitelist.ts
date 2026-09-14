import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import {
  PUBLIC_QUERY_RULES,
  validateFilters,
  validatePopulate,
  validateSort,
  type WhitelistError,
} from '../lib/query-whitelist';
import { PUBLIC_DEFAULT_POPULATE } from '../lib/public-api';

const RESOURCE_TO_UID: Record<string, string> = {
  universities: 'api::university.university',
  representatives: 'api::representative.representative',
  'academic-programs': 'api::academic-program.academic-program',
  activities: 'api::activity.activity',
  contributions: 'api::contribution.contribution',
  'news-items': 'api::news.news',
  'gallery-items': 'api::gallery-item.gallery-item',
};

/**
 * Middleware global: en GET /api/<recurso>, rechaza con 400 cualquier filtro, orden o populate
 * fuera de la lista blanca del recurso (src/lib/query-whitelist.ts).
 * `populate=*` se reemplaza por el populate mínimo por defecto en lugar de exponer todo.
 */
export default (_config: unknown, _ctx: { strapi: Core.Strapi }) => {
  return async (ctx: Context, next: Next) => {
    if (ctx.method !== 'GET') return next();
    const match = /^\/api\/([a-z-]+)(?:\/|$)/.exec(ctx.path);
    const resource = match?.[1];
    const rules = resource ? PUBLIC_QUERY_RULES[resource] : undefined;
    if (!rules) return next();

    const query = ctx.query as Record<string, unknown>;

    const reject = (kind: string, err: WhitelistError) => {
      ctx.status = 400;
      ctx.body = {
        error: {
          status: 400,
          code: 'QUERY_NOT_ALLOWED',
          message: `No se permite ${kind} por "${err.field}". Permitidos: ${err.allowed.join(', ')}.`,
        },
      };
    };

    const f = validateFilters(query.filters, rules.filters);
    if (f) return reject('filtrar', f);
    const s = validateSort(query.sort, rules.sort);
    if (s) return reject('ordenar', s);
    const p = validatePopulate(query.populate, rules.populate);
    if (p) return reject('poblar (populate)', p);

    if (query.populate === '*') {
      const uid = RESOURCE_TO_UID[resource as string];
      query.populate = PUBLIC_DEFAULT_POPULATE[uid];
    }

    return next();
  };
};
