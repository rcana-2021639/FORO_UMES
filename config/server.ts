import type { Core } from '@strapi/strapi';
import cronTasks from './cron-tasks';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // URL pública del backend (enlaces en correos, OpenAPI). En Railway: https://<app>.up.railway.app
  url: env('PUBLIC_URL', ''),
  // Detrás del proxy del hosting (Railway/Render): confía en X-Forwarded-For / X-Forwarded-Proto
  // para que la IP real llegue al límite de tasa y a la bitácora, y HTTPS se detecte bien.
  proxy: { koa: env.bool('TRUST_PROXY', false), ipHeader: 'X-Forwarded-For', maxIpsCount: 1 },
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // Transferencia remota de datos (`strapi transfer` contra /admin/transfer/*): con un token,
  // permite reemplazar TODA la base desde fuera. El Foro no la usa; apagada, esas rutas dan 404.
  // Para migrar datos entre entornos se enciende temporalmente con REMOTE_TRANSFER_ENABLED=true.
  transfer: {
    remote: { enabled: env.bool('REMOTE_TRANSFER_ENABLED', false) },
  },
  // Tareas programadas (config/cron-tasks.ts): p. ej. borrar mensajes de contacto vencidos
  cron: { enabled: env.bool('CRON_ENABLED', true), tasks: cronTasks },
});

export default config;
