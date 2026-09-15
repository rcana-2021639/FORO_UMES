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

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:1337').replace(
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
 * Único punto de entrada a la API. Entiende el formato de error del backend y lanza ApiError.
 * Se usa tanto en Server Components (con `revalidate`) como en el cliente.
 */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const url = `${API_URL}/api${path}${toSearch(opts.query)}`;
  const res = await fetch(url, {
    ...opts.init,
    headers: { Accept: 'application/json', ...(opts.init?.headers ?? {}) },
    next: { revalidate: opts.revalidate ?? 60 },
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
        'populate[0]': 'logo',
        'populate[1]': 'representatives',
        'populate[2]': 'academicPrograms',
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
        'populate[0]': 'coverImage',
        'populate[1]': 'participatingUniversities',
        'populate[2]': 'contributions',
        'populate[3]': 'galleryItems',
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

/**
 * Para Server Components: nunca rompe el render por un fallo de la API. Devuelve `fallback`
 * y deja el error en consola del servidor (el error boundary queda para fallos de render).
 */
export async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.warn('[api]', err instanceof Error ? err.message : err);
    return fallback;
  }
}
