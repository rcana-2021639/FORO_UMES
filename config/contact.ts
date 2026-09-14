import type { Core } from '@strapi/strapi';

/** Configuración propia del formulario de contacto. Se lee con strapi.config.get('contact.*'). */
export default ({ env }: Core.Config.Shared.ConfigParams) => ({
  // Correo del responsable de comunicación del Foro que recibe los mensajes
  notifyEmail: env('CONTACT_NOTIFY_EMAIL', ''),
});
