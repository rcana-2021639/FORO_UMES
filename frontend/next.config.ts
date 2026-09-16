import type { NextConfig } from 'next';
import path from 'node:path';

const api = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:1337');

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  images: {
    remotePatterns: [
      {
        protocol: api.protocol.replace(':', '') as 'http' | 'https',
        hostname: api.hostname,
        port: api.port,
      },
      { protocol: 'https', hostname: '**.railway.app' },
    ],
  },
};

export default nextConfig;
