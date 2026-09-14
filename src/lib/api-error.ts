import type { Context } from 'koa';

/**
 * Formato estándar de error de la API pública (plan técnico, sección 8.4):
 * { error: { status, code, message, requestId, details? } }
 * `requestId` lo asigna el middleware request-id (Sprint 6); aquí se toma si ya existe.
 */
export type ApiErrorBody = {
  error: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
};

export function buildApiError(
  ctx: Context,
  status: number,
  code: string,
  message: string,
  details?: unknown
): ApiErrorBody {
  const requestId = (ctx.state as { requestId?: string }).requestId;
  return {
    error: {
      status,
      code,
      message,
      ...(requestId ? { requestId } : {}),
      ...(details !== undefined ? { details } : {}),
    },
  };
}

export function apiError(
  ctx: Context,
  status: number,
  code: string,
  message: string,
  details?: unknown
): void {
  ctx.status = status;
  ctx.body = buildApiError(ctx, status, code, message, details);
}
