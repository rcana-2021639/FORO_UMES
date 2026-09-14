import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { isHoneypotFilled, validateContact } from '../../../lib/contact-validation';
import { apiError } from '../../../lib/api-error';

const ACCEPTED = { data: { received: true, message: 'Gracias, su mensaje fue recibido.' } };

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async submit(ctx: Context) {
    const body = (ctx.request.body ?? {}) as Record<string, unknown>;

    // Honeypot relleno → probable bot. Se responde igual que un envío válido, sin guardar nada,
    // para no dar pistas a quien automatiza el abuso.
    if (isHoneypotFilled(body)) {
      strapi.log.info('[contact] envío descartado por honeypot');
      ctx.status = 201;
      ctx.body = ACCEPTED;
      return;
    }

    const result = validateContact(body);
    if (!result.ok) {
      return apiError(ctx, 400, 'VALIDATION_ERROR', 'Revise los campos del formulario.', {
        fields: result.errors,
      });
    }

    await strapi.documents('api::contact-message.contact-message').create({
      data: { ...result.data, handled: false },
    });

    ctx.status = 201;
    ctx.body = ACCEPTED;
  },
});
