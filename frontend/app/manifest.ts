import type { MetadataRoute } from 'next';
import { BRAND, SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME } from '@/lib/site';

/**
 * Manifiesto web: nombre, colores e íconos cuando alguien agrega el sitio a la pantalla de inicio
 * del teléfono. Íconos generados con scripts/generate-icons.mjs.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    lang: 'es-GT',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: BRAND.paper,
    theme_color: BRAND.paper,
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
