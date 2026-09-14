import type { Core } from '@strapi/strapi';
import { ensureExtraIndexes } from '../database/indexes';

export default {
  /**
   * Se ejecuta antes de inicializar la aplicación. Punto de extensión para registrar
   * lógica global (políticas, middlewares) en sprints posteriores.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Se ejecuta después de que Strapi sincronizó el esquema en la base de datos
   * y antes de aceptar peticiones.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureExtraIndexes(strapi);
  },
};
