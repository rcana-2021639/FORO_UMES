import { afterEach, describe, expect, it, vi } from 'vitest';

/** next.config.ts arma la CSP según el entorno: se carga de nuevo con cada combinación. */
async function loadConfig(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const { default: config } = await import('../next.config');
  const [rule] = await config.headers!();
  const headers = Object.fromEntries(rule.headers.map((h) => [h.key, h.value]));
  const csp = Object.fromEntries(
    headers['Content-Security-Policy'].split('; ').map((d: string) => {
      const [name, ...sources] = d.split(' ');
      return [name, sources];
    })
  );
  return { config, headers, csp, source: rule.source };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

const PROD = {
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: 'https://api.foro.example.org',
  NEXT_PUBLIC_MEDIA_URL: 'https://media.foro.example.org/uploads',
  NEXT_PUBLIC_SITE_URL: 'https://foro.example.org',
};

describe('cabeceras de seguridad del frontend', () => {
  it('se aplican a todas las rutas', async () => {
    const { source, headers } = await loadConfig(PROD);
    expect(source).toBe('/:path*');
    expect(headers).toMatchObject({
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
    });
    expect(headers['Strict-Transport-Security']).toMatch(/max-age=\d{8}/);
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });

  it('CSP de producción: lista cerrada, sin eval y con HTTPS forzado', async () => {
    const { csp } = await loadConfig(PROD);
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['script-src']).not.toContain("'unsafe-eval'");
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
    expect(csp['form-action']).toEqual(["'self'"]);
    expect(csp['connect-src']).toEqual(["'self'", 'https://api.foro.example.org']);
    expect(csp['img-src']).toEqual(
      expect.arrayContaining(['https://api.foro.example.org', 'https://media.foro.example.org'])
    );
    expect(csp['frame-src']).toEqual([
      'https://www.youtube-nocookie.com',
      'https://player.vimeo.com',
    ]);
    expect(csp).toHaveProperty('upgrade-insecure-requests');
    // ningún comodín: ni "*" ni "https:" a secas
    for (const sources of Object.values(csp) as string[][]) {
      expect(sources.filter((s) => s === '*' || s === 'https:' || s === 'http:')).toEqual([]);
    }
  });

  it('en desarrollo permite eval (React) y la recarga en caliente, y no fuerza HTTPS', async () => {
    const { csp } = await loadConfig({
      NODE_ENV: 'development',
      NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    });
    expect(csp['script-src']).toContain("'unsafe-eval'");
    expect(csp['connect-src']).toContain('ws:');
    expect(csp).not.toHaveProperty('upgrade-insecure-requests');
  });

  it('el optimizador de imágenes solo acepta orígenes conocidos (sin comodines)', async () => {
    const { config } = await loadConfig(PROD);
    const hosts = config.images!.remotePatterns!.map((p) => ('hostname' in p ? p.hostname : ''));
    expect(hosts).toEqual(
      expect.arrayContaining(['api.foro.example.org', 'media.foro.example.org', 'img.youtube.com'])
    );
    expect(hosts.some((h) => h.includes('*'))).toBe(false);
    expect(config.poweredByHeader).toBe(false);
  });
});
