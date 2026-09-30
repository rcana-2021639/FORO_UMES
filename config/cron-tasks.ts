import type { Core } from '@strapi/strapi';
import { purgeExpiredContactMessages } from '../src/lib/contact-retention';

/**
 * Tareas programadas (config/server.ts → cron). Hora de Guatemala; a las 3:00 no hay tráfico.
 */
export default {
  // Aviso de privacidad: los mensajes de contacto se conservan CONTACT_RETENTION_DAYS días
  purgeExpiredContactMessages: {
    task: async ({ strapi }: { strapi: Core.Strapi }) => {
      await purgeExpiredContactMessages(strapi, strapi.config.get('contact.retentionDays'));
    },
    options: { rule: '0 3 * * *', tz: 'America/Guatemala' },
  },
};
