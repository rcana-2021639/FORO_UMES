/**
 * Datos del sitio para SEO: nombre, URL pública y si los buscadores pueden indexarlo.
 * Módulo sin 'use client' (lo usan layout, sitemap, robots, manifest y los JSON-LD).
 */
export const SITE_NAME = 'Foro Interuniversitario de Estudios de Posgrado';
export const SITE_SHORT_NAME = 'Foro de Posgrado';
export const SITE_DESCRIPTION =
  'Nueve universidades de Guatemala coordinan sus estudios de posgrado: programas, actividades, aportes y noticias del Foro.';

/** URL pública, sin barra final (NEXT_PUBLIC_SITE_URL; en local, http://localhost:3000). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  ''
);

/** Ruta del sitio → URL absoluta (enlaces canónicos, sitemap, JSON-LD). */
export const absoluteUrl = (path = '/') => new URL(path, `${SITE_URL}/`).toString();

/**
 * Solo el sitio público se deja indexar: en HTTPS y sin NEXT_PUBLIC_NOINDEX=true (staging lo
 * activa para no competir con producción en Google). En local nunca.
 */
export const INDEXABLE =
  SITE_URL.startsWith('https://') && process.env.NEXT_PUBLIC_NOINDEX !== 'true';

/** Colores de la marca (styles/tokens.css) para imágenes generadas y el manifiesto. */
export const BRAND = {
  violet: '#6443c4',
  orchid: '#8e4fb8',
  violetLight: '#9a7bf0',
  violetDeep: '#261a4f',
  lilac: '#ece4ff',
  paper: '#fdfcff',
  ink: '#1e1830',
  inkMuted: '#6b6485',
} as const;
