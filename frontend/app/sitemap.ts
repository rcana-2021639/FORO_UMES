import type { MetadataRoute } from 'next';
import { allPages, api, critical, mediaUrl } from '@/lib/api';
import { absoluteUrl } from '@/lib/site';
import type { Media } from '@/lib/types';

/** Se regenera cada hora: lo publicado en el panel llega al sitemap sin redesplegar. */
export const revalidate = 3600;

const cover = (m?: Media | null) => {
  const url = mediaUrl(m?.formats?.large?.url ?? m?.url);
  return url ? [url] : undefined;
};

/** La fecha más reciente de una lista (ISO), para el lastmod de las páginas índice. */
const latest = (dates: (string | null | undefined)[]) =>
  dates.filter(Boolean).sort().at(-1) ?? undefined;

/**
 * sitemap.xml: todas las páginas públicas con su última modificación real (Google usa `lastmod`
 * si es confiable e ignora changefreq/priority, que por eso no se envían) y las portadas de
 * noticias y actividades para Google Imágenes.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [universities, activities, news] = await Promise.all([
    critical(
      allPages((page) => api.universities({ 'pagination[page]': page })),
      []
    ),
    critical(
      allPages((page) => api.activities({ 'pagination[page]': page, 'pagination[pageSize]': 50 })),
      []
    ),
    critical(
      allPages((page) => api.news({ 'pagination[page]': page, 'pagination[pageSize]': 50 })),
      []
    ),
  ]);

  const lastUniversity = latest(universities.map((u) => u.updatedAt));
  const lastActivity = latest(activities.map((a) => a.updatedAt));
  const lastNews = latest(news.map((n) => n.updatedAt));

  const index = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified } : {}),
  });

  return [
    index('/', latest([lastUniversity, lastActivity, lastNews])),
    index('/universidades', lastUniversity),
    index('/programas'),
    index('/actividades', lastActivity),
    index('/noticias', lastNews),
    index('/galeria'),
    index('/contacto'),
    index('/privacidad'),
    index('/terminos'),
    index('/cookies'),
    index('/aviso-legal'),
    ...universities.map((u) => ({
      url: absoluteUrl(`/universidades/${u.documentId}`),
      lastModified: u.updatedAt,
    })),
    ...activities.map((a) => ({
      url: absoluteUrl(`/actividades/${a.documentId}`),
      lastModified: a.updatedAt,
      images: cover(a.coverImage),
    })),
    ...news.map((n) => ({
      url: absoluteUrl(`/noticias/${n.documentId}`),
      lastModified: n.updatedAt,
      images: cover(n.coverImage),
    })),
  ];
}
