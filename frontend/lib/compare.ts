import { LEVELS, LEVEL_META } from './levels';
import type { LevelCounts, ModalityCounts } from './format';
import type { ProgramLevel } from './types';

/**
 * "Comparar" de /universidades (DESIGN_NOTES §29.6): en vez de una tabla que hay que descifrar,
 * se elige una pregunta y una frase la responde con los datos; la tabla se ordena por esa pregunta.
 */
export type CompareKey = 'total' | ProgramLevel | 'online' | 'joined';

export interface CompareRow {
  acronym: string;
  /** Orden oficial del Foro: desempata siempre. */
  order: number;
  total: number;
  levels: LevelCounts;
  modalities: ModalityCounts;
  joined: number | null;
}

export const COMPARE_QUESTIONS: { key: CompareKey; label: string }[] = [
  { key: 'total', label: 'Cuántos programas' },
  ...LEVELS.map((l) => ({ key: l as CompareKey, label: LEVEL_META[l].plural })),
  { key: 'online', label: 'Estudiar a distancia' },
  { key: 'joined', label: 'Desde cuándo están' },
];

/** La cifra de cada universidad para esa pregunta (el año de ingreso para "desde cuándo"). */
export function compareValue(key: CompareKey, r: CompareRow): number | null {
  if (key === 'total') return r.total;
  if (key === 'online') return r.modalities.Virtual + r.modalities.Hibrida;
  if (key === 'joined') return r.joined;
  return r.levels[key];
}

/** Las filas en el orden que responde la pregunta: más primero; para "desde cuándo", las más antiguas. */
export function compareSort(key: CompareKey, rows: CompareRow[]): CompareRow[] {
  const asc = key === 'joined';
  return [...rows].sort((a, b) => {
    const x = compareValue(key, a) ?? (asc ? 9999 : -1);
    const y = compareValue(key, b) ?? (asc ? 9999 : -1);
    return (asc ? x - y : y - x) || a.order - b.order;
  });
}

/** "A", "A y B", "A, B y C". */
export function listEs(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/** Grupos de filas con la misma cifra, en el orden de la respuesta. */
function groups(key: CompareKey, rows: CompareRow[]) {
  const out: { value: number; names: string[] }[] = [];
  for (const r of compareSort(key, rows)) {
    const v = compareValue(key, r);
    if (v == null) continue;
    const last = out[out.length - 1];
    if (last && last.value === v) last.names.push(r.acronym);
    else out.push({ value: v, names: [r.acronym] });
  }
  return out;
}

const verb = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** La respuesta en una o dos frases, con los nombres y las cifras. */
export function compareAnswer(key: CompareKey, rows: CompareRow[]): string {
  const n = rows.length;
  if (!n) return 'Todavía no hay universidades publicadas.';

  if (key === 'joined') {
    const g = groups(key, rows);
    if (!g.length) return 'Todavía no hay fechas de ingreso publicadas.';
    const first = g[0];
    const last = g[g.length - 1];
    const s1 = `${listEs(first.names)} ${verb(first.names.length, 'está', 'están')} desde el inicio (${first.value}).`;
    if (g.length === 1) return s1;
    return `${s1} La más reciente en sumarse es ${listEs(last.names)} (${last.value}).`;
  }

  const g = groups(key, rows).filter((x) => x.value > 0);
  const what =
    key === 'total'
      ? 'programas'
      : key === 'online'
        ? 'programas virtuales o híbridos'
        : LEVEL_META[key].plural.toLowerCase();
  if (!g.length) return `Ninguna universidad tiene ${what} publicados todavía.`;
  const [top, second] = g;
  const each = top.names.length > 1 ? ' cada una' : '';

  if (key === 'total') {
    const low = g[g.length - 1];
    const s1 = `${listEs(top.names)} ${verb(top.names.length, 'tiene', 'tienen')} la oferta más grande: ${top.value} programas${each}.`;
    if (g.length === 1) return s1;
    return `${s1} La más pequeña es la de ${listEs(low.names)} (${low.value}).`;
  }

  const offering = g.reduce((k, x) => k + x.names.length, 0);
  const s1 =
    key === 'online'
      ? offering === n
        ? `Las ${n} tienen opciones a distancia.`
        : `${offering === 1 ? 'Solo una' : `Solo ${offering} de las ${n}`} ${verb(offering, 'tiene', 'tienen')} opciones a distancia.`
      : offering === n
        ? `Las ${n} ofrecen ${what}.`
        : `${offering === 1 ? 'Solo una' : `Solo ${offering} de las ${n}`} ${verb(offering, 'ofrece', 'ofrecen')} ${what}.`;
  // Todas las que ofrecen tienen la misma cifra: se nombran juntas
  if (g.length === 1) {
    return `${s1.slice(0, -1)}: ${listEs(top.names)}, con ${top.value}${each}.`;
  }
  const s2 = `${listEs(top.names)} ${verb(top.names.length, 'tiene', 'tienen')} más: ${top.value}${each}.`;
  const s3 = second
    ? ` Le ${verb(second.names.length, 'sigue', 'siguen')} ${listEs(second.names)} (${second.value}).`
    : '';
  return `${s1} ${s2}${s3}`;
}
