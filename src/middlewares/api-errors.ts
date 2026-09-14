import type { Core } from '@strapi/strapi';
import type { Context, Next } from 'koa';
import { buildApiError } from '../lib/api-error';

/**
 * Manejo centralizado de errores de la API pública (Sprint 6, tarea 3; plan técnico 8.4).
 *
 * Se coloca ANTES de `strapi::errors`, que ya convierte excepciones en respuestas con el
 * formato de Strapi `{ data: null, error: { status, name, message, details } }`. Aquí, solo
 * para rutas `/api/*`, se normaliza esa respuesta al formato estándar del proyecto:
 * `{ error: { status, code, message, requestId, details? } }`.
 *
 * Para 5xx el detalle interno se registra en el log (y llega a Sentry) pero NUNCA se envía al
 * cliente: recibe un mensaje genérico y el requestId para poder rastrearlo.
 * El panel administrativo (/admin, /content-manager) conserva el formato nativo que su UI espera.
 */
const CODE_BY_NAME: Record<string, string> = {
  ValidationError: 'VALIDATION_ERROR',
  YupValidationError: 'VALIDATION_ERROR',
  NotFoundError: 'NOT_FOUND',
  ForbiddenError: 'FORBIDDEN',
  PolicyError: 'FORBIDDEN',
  UnauthorizedError: 'UNAUTHORIZED',
  RateLimitError: 'RATE_LIMITED',
  PayloadTooLargeError: 'PAYLOAD_TOO_LARGE',
  ApplicationError: 'BAD_REQUEST',
  InternalServerError: 'INTERNAL_ERROR',
};

const MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'La solicitud no es válida.',
  401: 'Se requiere autenticación.',
  403: 'No tiene permisos para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  405: 'Método no permitido.',
  413: 'La solicitud es demasiado grande.',
  429: 'Demasiadas solicitudes.',
  500: 'Ocurrió un error interno. Intente de nuevo más tarde.',
};

type StrapiErrorBody = {
  data?: unknown;
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: unknown;
    code?: string;
    requestId?: string;
  };
};

export default (_config: unknown, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx: Context, next: Next) => {
    await next();

    if (!ctx.path.startsWith('/api/') || ctx.status < 400) return;

    const body = ctx.body as StrapiErrorBody | undefined;
    const err = body?.error;
    // Ya viene en el formato estándar (rutas personalizadas y middlewares propios)
    if (err && typeof err.code === 'string' && !('data' in (body ?? {}))) {
      if (!err.requestId) err.requestId = ctx.state.requestId;
      return;
    }

    const status = err?.status ?? ctx.status;
    const isServerError = status >= 500;
    const code = isServerError ? 'INTERNAL_ERROR' : (CODE_BY_NAME[err?.name ?? ''] ?? 'ERROR');
    // Mensajes genéricos en inglés de Strapi ("Not Found", "Forbidden"...) → español
    const isGenericMessage = !err?.message || /^[A-Z][a-z]+( [A-Za-z]+)?$/.test(err.message);
    const message = isServerError
      ? MESSAGE_BY_STATUS[500]
      : isGenericMessage
        ? MESSAGE_BY_STATUS[status] || err?.message || 'Error.'
        : (err?.message ?? 'Error.');
    const details =
      isServerError ||
      (typeof err?.details === 'object' && err?.details && Object.keys(err.details).length === 0)
        ? undefined
        : err?.details;

    if (isServerError) {
      strapi.log.error('unhandled api error', {
        requestId: ctx.state.requestId,
        path: ctx.path,
        name: err?.name,
        message: err?.message,
      });
    }

    ctx.status = status;
    ctx.body = buildApiError(ctx, status, code, message, details);
  };
};
