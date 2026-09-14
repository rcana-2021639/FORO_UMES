/**
 * Al recibir un mensaje de contacto se notifica por correo al responsable de comunicación
 * del Foro (Sprint 4, tarea 5). El proveedor se configura solo por variables de entorno
 * (config/plugins.ts); si no hay SMTP configurado (desarrollo), el correo se imprime en el log.
 *
 * Nunca se registra el contenido del mensaje en el log (plan técnico, sección 12).
 */
type ContactMessage = {
  id: number;
  documentId: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
};

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );

export default {
  async afterCreate(event: { result: ContactMessage }) {
    const m = event.result;
    const to = strapi.config.get<string | undefined>('contact.notifyEmail');
    const smtpConfigured = Boolean(process.env.SMTP_HOST);

    if (!to) {
      strapi.log.warn(
        `[contact] mensaje #${m.id} recibido pero CONTACT_NOTIFY_EMAIL no está configurado: no se envió notificación`
      );
      return;
    }

    const subject = `[Foro Posgrado] Nuevo mensaje de contacto: ${m.subject || '(sin asunto)'}`;
    const adminUrl = `${strapi.config.get('server.url') || ''}/admin/content-manager/collection-types/api::contact-message.contact-message/${m.documentId}`;
    const text = [
      `Nombre: ${m.name}`,
      `Correo: ${m.email}`,
      `Asunto: ${m.subject || '(sin asunto)'}`,
      '',
      m.message,
      '',
      `Ver en el panel: ${adminUrl}`,
    ].join('\n');
    const html = `<p><strong>Nombre:</strong> ${escapeHtml(m.name)}<br/><strong>Correo:</strong> ${escapeHtml(m.email)}<br/><strong>Asunto:</strong> ${escapeHtml(m.subject || '(sin asunto)')}</p><p style="white-space:pre-wrap">${escapeHtml(m.message)}</p><p><a href="${adminUrl}">Ver en el panel</a></p>`;

    if (!smtpConfigured) {
      strapi.log.info(`[contact] (sin SMTP) notificación simulada a ${to}: "${subject}"`);
      return;
    }

    try {
      await strapi
        .plugin('email')
        .service('email')
        .send({ to, replyTo: m.email, subject, text, html });
      strapi.log.info(`[contact] notificación enviada a ${to} por el mensaje #${m.id}`);
    } catch (err) {
      // El mensaje ya quedó guardado en la base; el correo es "mejor esfuerzo"
      strapi.log.error(
        `[contact] fallo al enviar la notificación del mensaje #${m.id}: ${String(err)}`
      );
    }
  },
};
