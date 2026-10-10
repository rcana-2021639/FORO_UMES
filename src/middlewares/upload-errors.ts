import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { routePath } from '../lib/route-path';
import { oversizeMessage } from '../lib/upload-limits';

/**
 * Mensaje claro en español cuando una subida al panel supera el límite de tamaño.
 *
 * El corte de tamaño lo aplica `config/middlewares.ts` (formidable `maxFileSize`) ANTES de
 * procesar la imagen; al superarlo, `strapi::body` responde 413 con el texto literal
 * `FileTooBig` (en inglés y sin decir el límite). El traductor de errores (`api-errors`) solo
 * actúa en `/api/*`, pero el panel sube por `/upload`, así que ahí llegaba ese texto crudo.
 *
 * Este middleware se coloca ANTES de `strapi::body` (lo envuelve): cuando la subida de
 * `/upload` o `/api/upload` termina en 413, reemplaza el mensaje por uno entendible para el
 * editor, conservando el formato de error que la biblioteca de medios del panel espera.
 */
const isUploadRoute = (ctx: Context) =>
  ctx.method === 'POST' && /^\/(api\/)?upload$/.test(routePath(ctx.path));

type ErrorBody = {
  data?: unknown;
  error?: { status?: number; name?: string; message?: string; details?: unknown };
};

export default (_config: unknown, _ctx: { strapi: Core.Strapi }) => {
  return async (ctx: Context, next: Next) => {
    await next();

    if (ctx.status !== 413 || !isUploadRoute(ctx)) return;

    const body = ctx.body as ErrorBody | undefined;
    const current = body?.error?.message ?? '';
    // Solo el error de tamaño de archivo: no tocar otros 413 (p. ej. cuerpo JSON demasiado grande)
    const isFileTooBig =
      current === 'FileTooBig' || /maxFileSize|too big|file too large/i.test(current);
    if (!isFileTooBig) return;

    ctx.body = {
      data: null,
      error: {
        status: 413,
        name: 'PayloadTooLargeError',
        message: oversizeMessage(),
        details: {},
      },
    };
  };
};
