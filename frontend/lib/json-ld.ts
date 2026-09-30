/**
 * Datos estructurados (JSON-LD, schema.org) para buscadores y asistentes: quién es el Foro, qué
 * universidades lo forman y qué es cada noticia, actividad o perfil. Funciones puras: reciben los
 * datos de la API y devuelven objetos listos para <JsonLd />.
 * Validar con https://search.google.com/test/rich-results y https://validator.schema.org
 */
import { mediaUrl } from './api';
import { excerpt } from './format';
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME, SITE_URL, absoluteUrl } from './site';
import type { Activity, NewsItem, University } from './types';

type Thing = Record<string, unknown>;

const ORG_ID = `${SITE_URL}/#organizacion`;
const SITE_ID = `${SITE_URL}/#sitio`;

const clean = <T extends Thing>(obj: T): T =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)
    )
  ) as T;

const imageOf = (media?: { url?: string; formats?: { large?: { url: string } } | null } | null) =>
  mediaUrl(media?.formats?.large?.url ?? media?.url);

/** El Foro como organización; con las universidades como miembros cuando se conocen. */
export function organizationJsonLd(universities: University[] = []): Thing {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icons/icon-512.png'),
    description: SITE_DESCRIPTION,
    areaServed: { '@type': 'Country', name: 'Guatemala' },
    address: { '@type': 'PostalAddress', addressCountry: 'GT' },
    member: universities.map((u) =>
      clean({
        '@type': 'CollegeOrUniversity',
        name: u.name,
        alternateName: u.acronym,
        url: absoluteUrl(`/universidades/${u.documentId}`),
        sameAs: u.website ? [u.website] : undefined,
      })
    ),
  });
}

/** El sitio web en sí (nombre e idioma), publicado por el Foro. */
export function websiteJsonLd(): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: absoluteUrl('/'),
    inLanguage: 'es-GT',
    publisher: { '@id': ORG_ID },
  };
}

/** Migas de pan: Inicio › Sección › Página. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): Thing {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function newsArticleJsonLd(n: NewsItem): Thing {
  const url = absoluteUrl(`/noticias/${n.documentId}`);
  return clean({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: n.title.slice(0, 110),
    description: n.summary ?? excerpt(n.content, 200),
    image: imageOf(n.coverImage) ? [imageOf(n.coverImage)] : undefined,
    datePublished: n.publishedAt ?? n.createdAt,
    dateModified: n.updatedAt,
    inLanguage: 'es-GT',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    author: { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: absoluteUrl('/') },
    publisher: {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icons/icon-512.png') },
    },
  });
}

/**
 * Actividad como evento. El backend no guarda lugar ni hora, así que Google no mostrará la ficha
 * enriquecida de evento (la exige), pero el tipo, la fecha y quién organiza siguen describiéndola.
 */
export function eventJsonLd(a: Activity): Thing {
  const url = absoluteUrl(`/actividades/${a.documentId}`);
  return clean({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: a.title,
    description: excerpt(a.description, 300),
    startDate: a.date,
    image: imageOf(a.coverImage) ? [imageOf(a.coverImage)] : undefined,
    url,
    inLanguage: 'es-GT',
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: [
      { '@type': 'Organization', '@id': ORG_ID, name: SITE_NAME, url: absoluteUrl('/') },
      ...(a.participatingUniversities ?? []).map((u) => ({
        '@type': 'CollegeOrUniversity',
        name: u.name,
        url: absoluteUrl(`/universidades/${u.documentId}`),
      })),
    ],
  });
}

export function universityJsonLd(u: University): Thing {
  return clean({
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: u.name,
    alternateName: u.acronym,
    description: u.shortDescription ? excerpt(u.shortDescription, 300) : undefined,
    url: absoluteUrl(`/universidades/${u.documentId}`),
    logo: mediaUrl(u.logo?.url),
    sameAs: u.website ? [u.website] : undefined,
    address: { '@type': 'PostalAddress', addressCountry: 'GT' },
    memberOf: { '@id': ORG_ID },
  });
}
