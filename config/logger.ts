import type { Core } from '@strapi/strapi';
import { winston, formats } from '@strapi/logger';

/**
 * Registro de la aplicación (Sprint 6, tareas 1-2).
 * - Producción: una línea JSON por evento (timestamp, level, message + campos), legible por
 *   cualquier agregador de logs (Railway, Datadog, Loki...). Nivel mínimo `info`.
 * - Desarrollo: formato legible con colores. Nivel `http` (incluye cada petición) o LOG_LEVEL.
 * Niveles disponibles (de mayor a menor severidad): error, warn, info, http, debug.
 */
export default ({ env }: Core.Config.Shared.ConfigParams) => {
  const isProduction = env('NODE_ENV') === 'production';
  const level = env('LOG_LEVEL', isProduction ? 'info' : 'http');

  const format = isProduction
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    : formats.prettyPrint();

  return {
    level,
    format,
    transports: [new winston.transports.Console()],
  };
};
