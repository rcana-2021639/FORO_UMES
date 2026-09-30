import type { Core } from '@strapi/strapi';

/**
 * Conservación de los mensajes de contacto (aviso de privacidad del sitio, /privacidad).
 * Minimización de datos: el nombre, el correo y el mensaje de una persona no se guardan para
 * siempre. Pasado el plazo se borran solos (config/cron-tasks.ts, todos los días).
 */
export const DEFAULT_CONTACT_RETENTION_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Días efectivos: un valor ausente, no numérico o menor que 1 usa el plazo por defecto. */
export const retentionDays = (days: unknown): number => {
  const n = Number(days);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_CONTACT_RETENTION_DAYS;
};

/** Fecha antes de la cual un mensaje ya venció. */
export const retentionCutoff = (days: unknown, now = new Date()): Date =>
  new Date(now.getTime() - retentionDays(days) * DAY_MS);

/**
 * Borra los mensajes de contacto recibidos antes del plazo de conservación y devuelve cuántos.
 * Nunca registra su contenido (plan técnico, sección 12).
 */
export async function purgeExpiredContactMessages(
  strapi: Core.Strapi,
  days: unknown,
  now = new Date()
): Promise<number> {
  const { count } = await strapi.db
    .query('api::contact-message.contact-message')
    .deleteMany({ where: { createdAt: { $lt: retentionCutoff(days, now) } } });
  if (count) {
    strapi.log.info(
      `[contact] ${count} mensaje(s) con más de ${retentionDays(days)} días eliminados (plazo de conservación)`
    );
  }
  return count;
}
