import { api, safe } from '@/lib/api';
import { ACTIVITY_LABEL, LEVEL_LABEL, MODALITY_LABEL, acronymOf, formatDate } from '@/lib/format';
import { LEVEL_META } from '@/lib/levels';
import type { SearchEntry } from '@/lib/search';

/**
 * Índice del buscador global (lib/search.ts): todo lo que se puede encontrar, en una lista
 * compacta. Se genera en el servidor y se renueva cada 5 minutos; el navegador lo pide solo al abrir
 * el buscador. Si la API no responde, cada parte queda vacía (el buscador sigue con las páginas).
 */
export const revalidate = 300;

const EMPTY = { data: [], meta: { pagination: { page: 1, pageSize: 0, pageCount: 0, total: 0 } } };

const PAGES: SearchEntry[] = [
  { kind: 'pagina', title: 'Inicio', meta: 'Portada del Foro', href: '/' },
  {
    kind: 'pagina',
    title: 'Universidades',
    meta: 'Las nueve, en fichas o para comparar',
    href: '/universidades',
    keywords: 'comparar tabla',
  },
  {
    kind: 'pagina',
    title: 'Programas',
    meta: 'Catálogo completo de posgrado',
    href: '/programas',
    keywords: 'catalogo oferta buscar guardados comparar',
  },
  {
    kind: 'pagina',
    title: 'Actividades',
    meta: 'Encuentros, seminarios y proyectos',
    href: '/actividades',
    keywords: 'eventos calendario hitos',
  },
  { kind: 'pagina', title: 'Noticias', meta: 'Archivo de noticias', href: '/noticias' },
  {
    kind: 'pagina',
    title: 'Galería',
    meta: 'Fotos y videos',
    href: '/galeria',
    keywords: 'fotos videos',
  },
  {
    kind: 'pagina',
    title: 'Contacto',
    meta: 'Escríbele al Foro',
    href: '/contacto',
    keywords: 'escribir mensaje correo',
  },
  {
    kind: 'pagina',
    title: 'Aviso de privacidad',
    meta: 'Qué hace el sitio con tus datos',
    href: '/privacidad',
    keywords: 'datos personales',
  },
  ...(['Maestria', 'Doctorado', 'Especializacion', 'Diplomado'] as const).map((l) => ({
    kind: 'pagina' as const,
    title: LEVEL_META[l].plural,
    meta: `${LEVEL_META[l].hint} ${LEVEL_META[l].span}.`,
    href: `/programas?nivel=${l}`,
    keywords: LEVEL_LABEL[l],
  })),
];

export async function GET() {
  const [universities, programs, activities, news] = await Promise.all([
    safe(api.universities(), EMPTY),
    safe(api.allPrograms(), EMPTY),
    safe(api.activities({ 'pagination[pageSize]': 50 }), EMPTY),
    safe(api.news({ 'pagination[pageSize]': 50 }), EMPTY),
  ]);

  const index: SearchEntry[] = [
    ...PAGES,
    ...universities.data.map((u) => ({
      kind: 'universidad' as const,
      title: u.acronym ?? u.name,
      meta: u.name,
      href: `/universidades/${u.documentId}`,
    })),
    ...programs.data.map((p) => ({
      kind: 'programa' as const,
      title: p.name,
      meta: [acronymOf(p.university), LEVEL_LABEL[p.level], MODALITY_LABEL[p.modality], p.duration]
        .filter(Boolean)
        .join(' · '),
      // La ficha del catálogo vive en /programas; la búsqueda llega ya hecha con su nombre
      href: `/programas?q=${encodeURIComponent(p.name)}`,
      keywords: p.university?.name ?? '',
    })),
    ...activities.data.map((a) => ({
      kind: 'actividad' as const,
      title: a.title,
      meta: `${ACTIVITY_LABEL[a.type]} · ${formatDate(a.date)}`,
      href: `/actividades/${a.documentId}`,
      keywords: (a.participatingUniversities ?? []).map(acronymOf).join(' '),
    })),
    ...news.data.map((n) => ({
      kind: 'noticia' as const,
      title: n.title,
      meta: formatDate(n.publishedAt),
      href: `/noticias/${n.documentId}`,
    })),
  ];

  return Response.json(index, {
    headers: {
      // Datos para el buscador, no una página: que los buscadores no la indexen
      'X-Robots-Tag': 'noindex',
    },
  });
}
