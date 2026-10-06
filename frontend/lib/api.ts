import type {
  AcademicProgram,
  Activity,
  ApiErrorBody,
  ContactPayload,
  Contribution,
  ForumSummary,
  GalleryItem,
  ListResponse,
  NewsItem,
  Representative,
  SingleResponse,
  University,
} from './types';
import { isDocumentId } from './document-id';

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:1337').replace(
  /\/$/,
  ''
);

/** Error tipado con la forma que devuelve el backend. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(body: ApiErrorBody['error']) {
    super(body.message);
    this.name = 'ApiError';
    this.status = body.status;
    this.code = body.code;
    this.requestId = body.requestId;
    this.details = body.details;
  }
}

/** Mensajes en español por código del backend; el resto usa el `message` original. */
export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK: 'No se pudo conectar con el servidor del Foro. Revisa tu conexión.',
  RATE_LIMITED: 'Demasiadas solicitudes seguidas. Espera un momento e inténtalo de nuevo.',
  QUERY_NOT_ALLOWED: 'La consulta no está permitida.',
  VALIDATION_ERROR: 'Revisa los campos marcados.',
  NOT_FOUND: 'No encontramos lo que buscabas.',
  INTERNAL_SERVER_ERROR: 'Ocurrió un error en el servidor. Ya quedó registrado.',
};

export function describeError(err: unknown): { title: string; description: string } {
  if (err instanceof ApiError) {
    const base = ERROR_MESSAGES[err.code] ?? err.message;
    const folio = err.requestId ? ` · Folio ${err.requestId.slice(0, 8)}` : '';
    return { title: `Error ${err.status}`, description: `${base}${folio}` };
  }
  if (err instanceof TypeError) {
    return { title: 'Sin conexión', description: ERROR_MESSAGES.NETWORK };
  }
  if (err instanceof DOMException && err.name === 'TimeoutError') {
    return {
      title: 'El servidor tardó demasiado',
      description: 'No respondió a tiempo. Espere un momento e inténtelo de nuevo.',
    };
  }
  return { title: 'Error inesperado', description: 'Algo salió mal. Inténtalo de nuevo.' };
}

type Query = Record<string, string | number | boolean | undefined>;

function toSearch(query?: Query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

interface FetchOptions {
  query?: Query;
  /** Segundos de cache en el servidor de Next. 0 = sin cache. */
  revalidate?: number;
  init?: RequestInit;
}

/**
 * En desarrollo la caché dura solo 10 s: lo que se cambie en el panel de Strapi (o un
 * `npm run seed -- --reset`) se ve casi al instante, sin respuestas viejas que apunten a archivos
 * que ya no existen. No se desactiva del todo porque cada portada hace ~10 consultas y el backend
 * limita a 120 por minuto por IP (todas las de Next salen de 127.0.0.1). En producción, la caché
 * de Next según el `revalidate` de cada recurso.
 */
const DEV_REVALIDATE = process.env.NODE_ENV === 'development' ? 10 : null;

/**
 * Credencial del servidor de Next ante el backend. Todas sus consultas salen de la misma IP, así
 * que sin ella compartirían el límite de tasa de UN visitante (120/min): quien pidiera URLs
 * inventadas podría agotarlo y dejar el sitio sin datos. Con ella el backend les da un cupo propio.
 * Solo existe en el servidor (no lleva NEXT_PUBLIC_): nunca viaja al navegador.
 */
const SERVER_HEADERS: Record<string, string> =
  typeof window === 'undefined' && process.env.FRONTEND_API_TOKEN
    ? { 'X-Frontend-Token': process.env.FRONTEND_API_TOKEN }
    : {};

/** Servidor de Next: 10 s. Navegador (formulario de contacto, con señal lenta): 20 s. */
const REQUEST_TIMEOUT_MS = typeof window === 'undefined' ? 10_000 : 20_000;

/**
 * Único punto de entrada a la API. Entiende el formato de error del backend y lanza ApiError.
 * Se usa tanto en Server Components (con `revalidate`) como en el cliente.
 */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_URL}/api${path}${toSearch(opts.query)}`;
  const res = await fetch(url, {
    ...opts.init,
    // Una API colgada (no caída: lenta) dejaría la página esperando sin fin. Con tiempo límite
    // falla como una caída: ISR sigue sirviendo la última versión buena (critical/safe).
    signal: opts.init?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: 'application/json', ...SERVER_HEADERS, ...(opts.init?.headers ?? {}) },
    // Un 0 explícito (p. ej. el envío del formulario) nunca se cachea, tampoco en desarrollo
    next: {
      revalidate: opts.revalidate === 0 ? 0 : (DEV_REVALIDATE ?? opts.revalidate ?? 60),
    },
  });

  if (!res.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await res.json()) as ApiErrorBody;
    } catch {
      /* cuerpo no JSON */
    }
    throw new ApiError(
      body?.error ?? { status: res.status, code: 'HTTP_ERROR', message: res.statusText }
    );
  }
  return (await res.json()) as T;
}

/** Resuelve URLs de medios (Strapi devuelve rutas relativas en local). */
export function mediaUrl(url?: string | null) {
  if (!url) return undefined;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

/**
 * La misma imagen servida por el optimizador de Next: mismo origen que la página (las texturas de
 * WebGL no dependen del CORS del backend) y en WebP del ancho justo. `width` debe ser uno de los
 * tamaños que acepta Next (640, 750, 828, 1080, 1200, 1920…). Los data: y rutas propias pasan igual.
 */
export function sameOriginImage(url: string | undefined | null, width = 1200) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}

/* ---------- Recursos ---------- */

export const api = {
  summary: () => apiFetch<{ data: ForumSummary }>('/forum-summary', { revalidate: 60 }),

  universities: (query?: Query) =>
    apiFetch<ListResponse<University>>('/universities', {
      query: { sort: 'displayOrder', 'pagination[pageSize]': 50, populate: 'logo', ...query },
      revalidate: 300,
    }),

  university: (documentId: string) =>
    apiFetch<SingleResponse<University>>(`/universities/${documentId}`, {
      query: {
        'populate[logo]': 'true',
        // La foto de cada representante vive en su propia relación: sin esto llegan sin avatar
        'populate[representatives][populate][photo]': 'true',
        'populate[academicPrograms]': 'true',
      },
      revalidate: 300,
    }),

  representatives: (query?: Query) =>
    apiFetch<ListResponse<Representative>>('/representatives', {
      query: {
        'populate[0]': 'photo',
        'populate[1]': 'university',
        'pagination[pageSize]': 50,
        sort: 'fullName',
        ...query,
      },
      revalidate: 300,
    }),

  programs: (query?: Query) =>
    apiFetch<ListResponse<AcademicProgram>>('/academic-programs', {
      query: { populate: 'university', 'pagination[pageSize]': 50, sort: 'name', ...query },
      revalidate: 300,
    }),

  /** Toda la oferta: el backend entrega 50 por página, así que se piden las que falten (hasta 4). */
  allPrograms: async (): Promise<ListResponse<AcademicProgram>> => {
    const first = await api.programs({ 'pagination[page]': 1 });
    const pages = Math.min(first.meta.pagination.pageCount, 4);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
        api.programs({ 'pagination[page]': i + 2 })
      )
    );
    return { ...first, data: [...first.data, ...rest.flatMap((r) => r.data)] };
  },

  activities: (query?: Query) =>
    apiFetch<ListResponse<Activity>>('/activities', {
      query: {
        'populate[0]': 'coverImage',
        'populate[1]': 'participatingUniversities',
        sort: 'date:desc',
        'pagination[pageSize]': 25,
        ...query,
      },
      revalidate: 120,
    }),

  activity: (documentId: string) =>
    apiFetch<SingleResponse<Activity>>(`/activities/${documentId}`, {
      query: {
        'populate[coverImage]': 'true',
        'populate[participatingUniversities]': 'true',
        'populate[contributions]': 'true',
        // Sin el archivo de cada foto, las miniaturas de la galería salían vacías
        'populate[galleryItems][populate][file]': 'true',
      },
      revalidate: 120,
    }),

  contributions: (query?: Query) =>
    apiFetch<ListResponse<Contribution>>('/contributions', {
      query: { populate: 'relatedActivity', sort: 'publishedOn:desc', ...query },
      revalidate: 300,
    }),

  news: (query?: Query) =>
    apiFetch<ListResponse<NewsItem>>('/news-items', {
      query: {
        populate: 'coverImage',
        sort: 'publishedAt:desc',
        'pagination[pageSize]': 12,
        ...query,
      },
      revalidate: 60,
    }),

  newsItem: (documentId: string) =>
    apiFetch<SingleResponse<NewsItem>>(`/news-items/${documentId}`, {
      query: { populate: 'coverImage' },
      revalidate: 60,
    }),

  gallery: (query?: Query) =>
    apiFetch<ListResponse<GalleryItem>>('/gallery-items', {
      query: {
        'populate[0]': 'file',
        'populate[1]': 'relatedActivity',
        sort: 'date:desc',
        'pagination[pageSize]': 30,
        ...query,
      },
      revalidate: 300,
    }),

  contact: (payload: ContactPayload) =>
    apiFetch<{ data: { received: boolean } }>('/contact', {
      revalidate: 0,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    }),
};

/* ---------- Carga de datos en Server Components ---------- */

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** `next build` en curso: se están generando las páginas estáticas. */
const building = () => process.env.NEXT_PHASE === 'phase-production-build';

/**
 * Datos principales de una página. Si la API falla se lanza el error, a propósito:
 * - en una página estática, Next conserva la última versión buena en caché y reintenta en la
 *   siguiente visita, en lugar de reemplazarla por una vacía que diría "no hay noticias";
 * - en una dinámica, se muestra la pantalla de error (con "Reintentar"), que es la verdad.
 * Solo durante `next build` se usa `fallback`: una API caída no debe impedir desplegar, y la
 * página se regenera sola al vencer su `revalidate`.
 */
export async function critical<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (!building()) throw err;
    console.warn('[api] build sin datos, se regenerará al vencer la caché:', errorText(err));
    return fallback;
  }
}

/**
 * Datos complementarios (p. ej. la universidad anterior y la siguiente de un perfil): si fallan,
 * la página se muestra igual, sin ellos. El error queda en la consola del servidor.
 */
export async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.warn('[api]', errorText(err));
    return fallback;
  }
}

/**
 * Un registro para su página de detalle; `null` = no existe (la página llama a notFound()).
 * Un id con formato imposible ni siquiera llega al backend: una URL inventada o con `../` no debe
 * gastar consultas (ver SERVER_HEADERS) ni componer rutas raras hacia la API.
 */
export async function findOne<T>(
  documentId: string,
  load: (id: string) => Promise<SingleResponse<T>>
): Promise<T | null> {
  if (!isDocumentId(documentId)) return null;
  try {
    return (await load(documentId)).data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Todos los registros de un listado paginado, hasta `maxPages` páginas (el backend entrega como
 * máximo 50 por página). Para el sitemap.
 */
export async function allPages<T>(
  load: (page: number) => Promise<ListResponse<T>>,
  maxPages = 20
): Promise<T[]> {
  const first = await load(1);
  const pages = Math.min(first.meta.pagination.pageCount, maxPages);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pages - 1) }, (_, i) => load(i + 2))
  );
  return [first, ...rest].flatMap((r) => r.data);
}

/** Tope de páginas de un listado paginado: `?pagina=` no puede generar consultas sin fin. */
export const MAX_PAGE = 100;

/** `?pagina=` a número de página válido (entero entre 1 y MAX_PAGE); cualquier otra cosa → 1. */
export function parsePage(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isSafeInteger(n) && n >= 1 ? Math.min(n, MAX_PAGE) : 1;
}

/**
 * Los `documentId` de un listado para `generateStaticParams`: esas páginas de detalle se generan
 * por adelantado y se renuevan solas (ISR), así que abren al instante y la transición entre
 * páginas puede llevar el elemento pulsado a su sitio (DESIGN_NOTES §28.3). Si la API no responde
 * durante el build se devuelve una lista vacía: las páginas se generan al pedirse, como antes.
 */
export async function staticIds(
  list: Promise<ListResponse<{ documentId: string }>>
): Promise<{ documentId: string }[]> {
  const r = await safe(list, null);
  return (r?.data ?? []).map((x) => ({ documentId: x.documentId }));
}
