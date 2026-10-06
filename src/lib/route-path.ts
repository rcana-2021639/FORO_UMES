import { posix } from 'node:path';

/**
 * Ruta canónica de una petición, para que los middlewares y el guard decidan sobre la MISMA ruta
 * que resuelve el enrutador de Strapi.
 *
 * El enrutador (koa-router) no distingue mayúsculas y acepta una barra final: `/API/CONTACT`,
 * `/api/contact/` y `/api/contact` llegan al mismo controlador. Comparar `ctx.path` tal cual
 * permitía saltarse el límite de tasa, la lista blanca de consultas, la verificación de imágenes y
 * el guard de propiedad con solo cambiar mayúsculas o agregar "/" (auditoría de producción, A-1).
 *
 * Solo sirve para COMPARAR: no cambia la ruta que se enruta ni la que se registra en el log.
 */
export function routePath(path: string): string {
  const normalized = posix
    .normalize(path || '/')
    .toLowerCase()
    .replace(/\/+$/, '');
  return normalized || '/';
}
