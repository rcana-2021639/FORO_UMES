import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  // Lista blanca de filtros/orden/populate en GET /api/* (Sprint 4)
  'global::query-whitelist',
  'strapi::body',
  // Política de contraseñas del panel + auditoría de login (necesita el cuerpo ya parseado)
  'global::admin-security',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
