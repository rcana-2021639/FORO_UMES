import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET')!,
    // Sesión del panel de vida corta (plan técnico: 4 horas). Valores en segundos.
    sessions: {
      accessTokenLifespan: 30 * 60, // el token de acceso se renueva cada 30 min
      maxSessionLifespan: 4 * 60 * 60, // la sesión caduca sí o sí a las 4 h
      maxRefreshTokenLifespan: 4 * 60 * 60,
      idleSessionLifespan: 60 * 60, // 1 h sin actividad cierra la sesión
      idleRefreshTokenLifespan: 60 * 60,
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT')!,
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT')!,
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY')!,
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default config;
