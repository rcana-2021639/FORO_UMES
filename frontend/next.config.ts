import type { NextConfig } from 'next';
import path from 'node:path';

const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:1337');
// Archivos subidos en producción (Cloudflare R2): el S3_PUBLIC_URL del backend. Sin él, los sirve Strapi.
const media = process.env.NEXT_PUBLIC_MEDIA_URL ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL) : null;
const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');
const isDev = process.env.NODE_ENV === 'development';

// Next 16 se niega a optimizar imágenes que vienen de una IP privada (protección contra SSRF).
// En local Strapi vive justo en 127.0.0.1, así que sin esto ninguna foto, sello ni avatar carga.
// Solo se permite cuando la propia API es local; en producción la API es pública y sigue bloqueado.
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const localApi = LOCAL_HOSTS.has(api.hostname);

const pattern = (u: URL, pathname: string) => ({
  protocol: u.protocol.replace(':', '') as 'http' | 'https',
  hostname: u.hostname,
  port: u.port,
  pathname,
});

/* ---------- Content Security Policy ----------
 * Lista cerrada de orígenes: lo que no está aquí, el navegador no lo carga ni lo ejecuta.
 * Sin nonces a propósito: exigirían renderizar cada página en cada visita y perder la caché
 * estática (ISR), que es lo que protege al sitio de picos de tráfico y de caídas de la API. Por eso
 * los scripts inline (datos de hidratación de Next y el arranque de lib/quality-script.ts) se
 * permiten con 'unsafe-inline'. Lo que la política sí impide: scripts de otros dominios, <object>,
 * que otra web meta al Foro en un iframe, cambiar la base de las URLs y enviar formularios fuera.
 * Detalle y riesgo aceptado: SEGURIDAD.md, sección del frontend. */
const MEDIA_ORIGINS = [api.origin, ...(media ? [media.origin] : [])];
const CSP: Record<string, string[]> = {
  'default-src': ["'self'"],
  // 'unsafe-eval' solo en desarrollo: React lo usa para reconstruir las pilas de error del servidor
  'script-src': ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
  'style-src': ["'self'", "'unsafe-inline'"],
  // Las miniaturas de YouTube/Vimeo pasan por el optimizador (mismo origen): el navegador no
  // contacta a Google ni a Vimeo hasta que alguien reproduce un video. data:/blob: para los
  // fotogramas de video dibujados en canvas.
  'img-src': ["'self'", 'data:', 'blob:', ...MEDIA_ORIGINS],
  'media-src': ["'self'", 'blob:', ...MEDIA_ORIGINS],
  'font-src': ["'self'", 'data:'],
  // El formulario de contacto se envía desde el navegador a la API; en desarrollo, la recarga en caliente
  'connect-src': ["'self'", api.origin, ...(isDev ? ['ws:', 'wss:'] : [])],
  // Videos de la galería: YouTube sin cookies y Vimeo
  'frame-src': ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  // Solo con el sitio en HTTPS: en una prueba local de producción (http) rompería las llamadas a la API
  ...(site.protocol === 'https:' ? { 'upgrade-insecure-requests': [] } : {}),
};

const cspValue = Object.entries(CSP)
  .map(([directive, sources]) => [directive, ...sources].join(' '))
  .join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: cspValue },
  // El navegador recuerda por 2 años que el sitio solo se abre con HTTPS (lo ignora en http)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // No adivinar el tipo de un archivo: un .jpg que en realidad es HTML no se ejecuta
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Nadie puede mostrar el sitio dentro de un iframe (clickjacking); equivale a frame-ancestors
  { key: 'X-Frame-Options', value: 'DENY' },
  // Al salir hacia otro sitio solo se comparte el dominio, nunca la ruta completa
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Aislamiento frente a ventanas de otros sitios abiertas desde aquí
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // El sitio no usa cámara, micrófono, ubicación, pagos ni USB: nadie puede pedirlos en su nombre
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  // Sin X-Powered-By: no anunciar la tecnología del servidor
  poweredByHeader: false,
  images: {
    dangerouslyAllowLocalIP: localApi,
    // Lista cerrada: el optimizador de imágenes solo procesa estos orígenes. Un comodín como
    // **.railway.app lo convertiría en un proxy gratuito para las imágenes de cualquiera.
    remotePatterns: [
      pattern(api, '/uploads/**'),
      ...(media ? [pattern(media, `${media.pathname.replace(/\/$/, '')}/**`)] : []),
      // Miniaturas de los videos de la galería (YouTube / Vimeo)
      { protocol: 'https', hostname: 'img.youtube.com', pathname: '/vi/**' },
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/vi/**' },
      { protocol: 'https', hostname: 'vumbnail.com' },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
