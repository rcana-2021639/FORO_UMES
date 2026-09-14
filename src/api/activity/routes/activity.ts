/**
 * activity router — solo lectura pública. Las rutas de escritura no existen en la API
 * (el contenido se administra desde el panel), lo que reduce la superficie de ataque.
 */
import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::activity.activity', { only: ['find', 'findOne'] });
