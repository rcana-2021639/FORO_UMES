/**
 * Buscador global (DESIGN_NOTES §28.4, fase 6). El índice lo arma el servidor en
 * `app/indice-de-busqueda/route.ts` (se renueva cada 5 minutos) y el navegador lo pide la primera
 * vez que alguien abre el buscador; buscar no consulta a la API del Foro.
 */
export type SearchKind = 'programa' | 'universidad' | 'actividad' | 'noticia' | 'pagina';

export interface SearchEntry {
  kind: SearchKind;
  title: string;
  /** Segunda línea: universidad y nivel, fecha, nombre completo… */
  meta?: string;
  href: string;
  /** Texto adicional que también se busca (siglas, nivel, modalidad) pero no se muestra. */
  keywords?: string;
  /** Sitio externo (ficha oficial de un programa): se abre en otra pestaña. */
  external?: boolean;
}

export interface SearchHit extends SearchEntry {
  score: number;
}

/** Minúsculas y sin tildes: "Gestión" y "gestion" son lo mismo. */
export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Palabras que no ayudan a encontrar nada ("maestría en gestión de la calidad"). */
const STOP = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'e', 'a', 'para', 'con']);

export function terms(query: string): string[] {
  return fold(query)
    .split(/[^a-z0-9ñ]+/)
    .filter((t) => t && !STOP.has(t));
}

/**
 * Puntaje de una entrada: todas las palabras buscadas deben aparecer (en el título, la segunda
 * línea o las palabras clave). Pesa más lo que está en el título y, sobre todo, al principio de
 * una palabra del título; una sigla exacta ("usac") va primero.
 */
export function scoreEntry(e: SearchEntry, ts: string[]): number {
  if (!ts.length) return 0;
  const title = fold(e.title);
  const rest = fold(`${e.meta ?? ''} ${e.keywords ?? ''}`);
  const words = title.split(/[^a-z0-9ñ]+/);
  let score = 0;
  for (const t of ts) {
    if (words.includes(t)) score += 12;
    else if (words.some((w) => w.startsWith(t))) score += 8;
    else if (title.includes(t)) score += 4;
    else if (rest.split(/[^a-z0-9ñ]+/).some((w) => w.startsWith(t))) score += 3;
    else if (rest.includes(t)) score += 1;
    else return 0;
  }
  if (title.startsWith(ts[0])) score += 3;
  // Entre dos igual de buenas, la de título más corto (más precisa)
  return score - title.length / 200;
}

/** Orden de los grupos en la lista de resultados. */
export const KIND_ORDER: SearchKind[] = [
  'pagina',
  'universidad',
  'programa',
  'actividad',
  'noticia',
];

export const KIND_LABEL: Record<SearchKind, string> = {
  pagina: 'Páginas',
  universidad: 'Universidades',
  programa: 'Programas',
  actividad: 'Actividades',
  noticia: 'Noticias',
};

/**
 * Busca y agrupa: como mucho `perKind` resultados por grupo, cada grupo ordenado por puntaje, y los
 * grupos ordenados por su mejor resultado (si la mejor coincidencia es una universidad, va arriba).
 */
export function search(
  index: SearchEntry[],
  query: string,
  perKind = 6
): { kind: SearchKind; hits: SearchHit[]; total: number }[] {
  const ts = terms(query);
  if (!ts.length) return [];
  const groups = new Map<SearchKind, SearchHit[]>();
  for (const e of index) {
    const score = scoreEntry(e, ts);
    if (score <= 0) continue;
    const list = groups.get(e.kind) ?? [];
    list.push({ ...e, score });
    groups.set(e.kind, list);
  }
  return [...groups.entries()]
    .map(([kind, hits]) => {
      hits.sort((a, b) => b.score - a.score);
      return { kind, hits: hits.slice(0, perKind), total: hits.length };
    })
    .sort(
      (a, b) =>
        b.hits[0].score - a.hits[0].score || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
    );
}
