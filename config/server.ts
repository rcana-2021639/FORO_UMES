import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  // URL pública del backend (enlaces en correos, OpenAPI). En Railway: https://<app>.up.railway.app
  url: env('PUBLIC_URL', ''),
  // Detrás del proxy del hosting (Railway/Render) para que ctx.ip y HTTPS se detecten bien
  proxy: env.bool('TRUST_PROXY', false),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});

export default config;
