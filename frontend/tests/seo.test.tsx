import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  breadcrumbJsonLd,
  eventJsonLd,
  newsArticleJsonLd,
  organizationJsonLd,
  universityJsonLd,
} from '@/lib/json-ld';
import { DEFAULT_OG_IMAGE, pageMetadata } from '@/lib/seo';
import type { Activity, NewsItem, University } from '@/lib/types';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const base = { id: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' };

describe('indexación (lib/site.ts)', () => {
  const load = async (env: Record<string, string>) => {
    vi.resetModules();
    for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
    return import('@/lib/site');
  };
  it('solo el sitio público en HTTPS se deja indexar', async () => {
    expect((await load({ NEXT_PUBLIC_SITE_URL: 'https://foro.example.org' })).INDEXABLE).toBe(true);
    expect((await load({ NEXT_PUBLIC_SITE_URL: 'http://localhost:3000' })).INDEXABLE).toBe(false);
  });
  it('staging se cierra con NEXT_PUBLIC_NOINDEX=true', async () => {
    const site = await load({
      NEXT_PUBLIC_SITE_URL: 'https://staging.example.org',
      NEXT_PUBLIC_NOINDEX: 'true',
    });
    expect(site.INDEXABLE).toBe(false);
  });
  it('absoluteUrl no duplica barras', async () => {
    const site = await load({ NEXT_PUBLIC_SITE_URL: 'https://foro.example.org/' });
    expect(site.absoluteUrl('/noticias')).toBe('https://foro.example.org/noticias');
  });
});

describe('pageMetadata', () => {
  it('canónica, Open Graph y X completos, con la imagen del Foro por defecto', () => {
    const m = pageMetadata({ title: 'Noticias', description: 'Desc', path: '/noticias' });
    expect(m.alternates?.canonical).toBe('/noticias');
    expect(m.openGraph).toMatchObject({ url: '/noticias', title: 'Noticias', locale: 'es_GT' });
    expect(m.openGraph?.images).toEqual([DEFAULT_OG_IMAGE]);
    expect(m.twitter).toMatchObject({ card: 'summary_large_image' });
  });
  it('una noticia usa su portada y se marca como artículo', () => {
    const m = pageMetadata({
      title: 'N',
      path: '/noticias/x',
      image: 'https://cdn/x.jpg',
      type: 'article',
      publishedTime: '2026-09-18T00:00:00Z',
    });
    expect(m.openGraph).toMatchObject({ type: 'article', publishedTime: '2026-09-18T00:00:00Z' });
    expect(m.openGraph?.images).toEqual([{ url: 'https://cdn/x.jpg', alt: 'N' }]);
  });
});

describe('datos estructurados (JSON-LD)', () => {
  const uni = {
    ...base,
    documentId: 'u1',
    name: 'Universidad X',
    acronym: 'UX',
    displayOrder: 1,
    website: 'https://ux.edu.gt',
  } as University;

  it('el Foro como organización, con sus universidades como miembros', () => {
    const org = organizationJsonLd([uni]);
    expect(org['@type']).toBe('Organization');
    expect(org.member).toEqual([
      expect.objectContaining({
        '@type': 'CollegeOrUniversity',
        name: 'Universidad X',
        sameAs: ['https://ux.edu.gt'],
      }),
    ]);
  });
  it('noticia: NewsArticle con fechas y sin campos vacíos', () => {
    const n = {
      ...base,
      documentId: 'n1',
      title: 'T'.repeat(200),
      content: 'Hola **mundo**',
      publishedAt: '2026-09-18T00:00:00Z',
    } as NewsItem;
    const ld = newsArticleJsonLd(n);
    expect(ld).toMatchObject({
      '@type': 'NewsArticle',
      datePublished: '2026-09-18T00:00:00Z',
      description: 'Hola mundo',
    });
    expect((ld.headline as string).length).toBe(110);
    expect(ld).not.toHaveProperty('image');
  });
  it('actividad: Event con la fecha y quién organiza', () => {
    const a = {
      ...base,
      documentId: 'a1',
      title: 'Encuentro',
      type: 'Encuentro',
      date: '2026-10-22',
      participatingUniversities: [{ id: 1, documentId: 'u1', name: 'Universidad X' }],
    } as Activity;
    const ld = eventJsonLd(a);
    expect(ld).toMatchObject({ '@type': 'Event', startDate: '2026-10-22' });
    expect(ld.organizer).toHaveLength(2);
  });
  it('universidad y migas de pan', () => {
    expect(universityJsonLd(uni)).toMatchObject({
      '@type': 'CollegeOrUniversity',
      alternateName: 'UX',
    });
    const bc = breadcrumbJsonLd([
      { name: 'Inicio', path: '/' },
      { name: 'Noticias', path: '/noticias' },
    ]);
    expect(bc.itemListElement).toEqual([
      expect.objectContaining({ position: 1, name: 'Inicio' }),
      expect.objectContaining({ position: 2, name: 'Noticias' }),
    ]);
  });
  it('<JsonLd> escapa "<": un texto del backend no puede cerrar la etiqueta script', () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ name: '</script><script>alert(1)</script>' }} />
    );
    expect(html).not.toContain('</script><script>');
    expect(html).toContain('\\u003c/script>');
  });
});
