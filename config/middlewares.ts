import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  // Orígenes permitidos: el frontend real en producción (FRONTEND_URL, separados por coma)
  // y localhost en desarrollo. Nunca "*" en producción.
  const frontendUrls = env.array('FRONTEND_URL', []) as string[];
  const corsOrigins =
    env('NODE_ENV') === 'production'
      ? frontendUrls
      : [...frontendUrls, 'http://localhost:3000', 'http://127.0.0.1:3000'];

  // Host de las imágenes en producción (R2/CDN), para la CSP
  const mediaHost = env('S3_PUBLIC_URL', '');

  return [
    'strapi::logger',
    'strapi::errors',
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            'connect-src': ["'self'", 'https:'],
            'img-src': [
              "'self'",
              'data:',
              'blob:',
              'market-assets.strapi.io',
              ...(mediaHost ? [mediaHost] : []),
            ],
            'media-src': ["'self'", 'data:', 'blob:', ...(mediaHost ? [mediaHost] : [])],
            upgradeInsecureRequests: null,
          },
        },
        frameguard: { action: 'deny' },
        hsts: { maxAge: 31536000, includeSubDomains: true },
        xssFilter: false, // cabecera obsoleta; la CSP la reemplaza
      },
    },
    {
      name: 'strapi::cors',
      config: {
        origin: corsOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
        credentials: false,
        keepHeadersOnError: true,
      },
    },
    // Sin cabecera X-Powered-By: no anunciar la tecnología del servidor
    'strapi::query',
    // Lista blanca de filtros/orden/populate en GET /api/* (Sprint 4)
    'global::query-whitelist',
    // Límite de tasa por ruta (Sprint 5)
    'global::rate-limit',
    'strapi::body',
    // Verificación de "magic bytes" de imágenes subidas (Sprint 5)
    'global::upload-guard',
    // Política de contraseñas del panel + auditoría de login (necesita el cuerpo ya parseado)
    'global::admin-security',
    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};

export default config;
