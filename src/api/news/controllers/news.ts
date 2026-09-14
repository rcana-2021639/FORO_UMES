/**
 * news controller — API pública de solo lectura.
 * Fuerza status=published y aplica un populate mínimo por defecto (ver src/lib/public-api.ts).
 */
import { factories } from '@strapi/strapi';
import { applyPublicQueryDefaults } from '../../../lib/public-api';

const UID = 'api::news.news';

export default factories.createCoreController(UID, ({ strapi: _strapi }) => ({
  async find(ctx) {
    applyPublicQueryDefaults(ctx, UID);
    return super.find(ctx);
  },
  async findOne(ctx) {
    applyPublicQueryDefaults(ctx, UID);
    return super.findOne(ctx);
  },
}));
