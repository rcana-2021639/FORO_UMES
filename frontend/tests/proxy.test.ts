import { NextRequest } from 'next/server';
// Next 16.3 aún lo exporta con el nombre anterior (la documentación ya dice unstable_doesProxyMatch)
import {
  getRewrittenUrl,
  isRewrite,
  unstable_doesMiddlewareMatch as doesProxyMatch,
} from 'next/experimental/testing/server';
import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';
import { config, proxy } from '../proxy';

const run = (path: string) => proxy(new NextRequest(`https://foro.example.org${path}`));

describe('proxy: 404 real para ids imposibles', () => {
  it('solo corre en las páginas de detalle', () => {
    for (const url of ['/noticias/abc', '/actividades/abc', '/universidades/abc']) {
      expect(doesProxyMatch({ config, nextConfig, url })).toBe(true);
    }
    for (const url of ['/', '/noticias', '/_next/static/x.js', '/sitemap.xml']) {
      expect(doesProxyMatch({ config, nextConfig, url })).toBe(false);
    }
  });

  it('un id válido sigue a la página', () => {
    expect(isRewrite(run('/noticias/wru83xj2cmt0v0tbnktiri7h'))).toBe(false);
  });

  it('un id imposible se reescribe a una ruta inexistente (404)', () => {
    for (const path of [
      '/noticias/abc',
      '/actividades/%3Cscript%3E',
      '/universidades/..%2Fadmin',
    ]) {
      const res = run(path);
      expect(isRewrite(res)).toBe(true);
      expect(getRewrittenUrl(res)).toBe('https://foro.example.org/404');
    }
  });
});
