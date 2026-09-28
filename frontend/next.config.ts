import type { NextConfig } from 'next';
import path from 'node:path';

const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:1337');

// Next 16 se niega a optimizar imágenes que vienen de una IP privada (protección contra SSRF).
// En local Strapi vive justo en 127.0.0.1, así que sin esto ninguna foto, sello ni avatar carga.
// Solo se permite cuando la propia API es local; en producción la API es pública y sigue bloqueado.
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const localApi = LOCAL_HOSTS.has(api.hostname);

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  images: {
    dangerouslyAllowLocalIP: localApi,
    remotePatterns: [
      {
        protocol: api.protocol.replace(':', '') as 'http' | 'https',
        hostname: api.hostname,
        port: api.port,
        pathname: '/uploads/**',
      },
      { protocol: 'https', hostname: '**.railway.app' },
      // Miniaturas de los videos de la galería (YouTube / Vimeo)
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'vumbnail.com' },
    ],
  },
};

export default nextConfig;
