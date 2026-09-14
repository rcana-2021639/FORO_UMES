import type { Core } from '@strapi/strapi';

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
});

export default config;
