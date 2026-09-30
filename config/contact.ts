import type { Core } from '@strapi/strapi';

/** Configuración propia del formulario de contacto. Se lee con strapi.config.get('contact.*'). */
export default ({ env }: Core.Config.Shared.ConfigParams) => ({
  // Correo del responsable de comunicación del Foro que recibe los mensajes
  notifyEmail: env('CONTACT_NOTIFY_EMAIL', ''),
  // Días que se guarda cada mensaje antes de borrarse solo (lo promete el aviso de privacidad)
  retentionDays: env.int('CONTACT_RETENTION_DAYS', 365),
});
