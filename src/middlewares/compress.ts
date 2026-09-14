import type { Core } from '@strapi/strapi';
import compress from 'koa-compress';
import { constants } from 'node:zlib';

/**
 * Compresión de respuestas (gzip/brotli) a nivel de aplicación (Sprint 6, tarea 9).
 * Si el proxy del hosting ya comprime, esta capa simplemente no vuelve a comprimir.
 */
export default (_config: unknown, _ctx: { strapi: Core.Strapi }) =>
  compress({
    threshold: 1024, // no comprimir respuestas menores a 1 KB
    br: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } },
  });
