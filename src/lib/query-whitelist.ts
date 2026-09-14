/**
 * Lista blanca de filtros, orden y populate por recurso público (plan técnico, Sprint 4, tarea 7).
 * Nada fuera de esta lista se acepta: evita filtrar por campos internos o relaciones no previstas.
 *
 * `filters`: árbol de campos permitidos. `true` = campo escalar; objeto = relación con sus subcampos.
 * `sort`: campos por los que se puede ordenar.
 * `populate`: relaciones/medios que se pueden poblar.
 */
export type FieldTree = { [key: string]: true | FieldTree };

export type ResourceRules = { filters: FieldTree; sort: string[]; populate: string[] };

const UNIVERSITY_REF: FieldTree = { id: true, documentId: true, acronym: true, name: true };
const ACTIVITY_REF: FieldTree = { id: true, documentId: true };

export const PUBLIC_QUERY_RULES: Record<string, ResourceRules> = {
  universities: {
    filters: { id: true, documentId: true, name: true, acronym: true, displayOrder: true },
    sort: ['displayOrder', 'name', 'acronym'],
    populate: ['logo', 'representatives', 'academicPrograms'],
  },
  representatives: {
    filters: { id: true, documentId: true, fullName: true, university: UNIVERSITY_REF },
    sort: ['fullName'],
    populate: ['photo', 'university'],
  },
  'academic-programs': {
    filters: {
      id: true,
      documentId: true,
      name: true,
      level: true,
      modality: true,
      university: UNIVERSITY_REF,
    },
    sort: ['name', 'level', 'modality'],
    populate: ['university'],
  },
  activities: {
    filters: {
      id: true,
      documentId: true,
      title: true,
      type: true,
      date: true,
      participatingUniversities: UNIVERSITY_REF,
    },
    sort: ['date', 'title'],
    populate: ['coverImage', 'participatingUniversities', 'contributions', 'galleryItems'],
  },
  contributions: {
    filters: {
      id: true,
      documentId: true,
      type: true,
      publishedOn: true,
      relatedActivity: ACTIVITY_REF,
    },
    sort: ['publishedOn', 'title'],
    populate: ['relatedActivity'],
  },
  'news-items': {
    filters: { id: true, documentId: true, title: true, publishedAt: true },
    sort: ['publishedAt', 'title'],
    populate: ['coverImage'],
  },
  'gallery-items': {
    filters: { id: true, documentId: true, type: true, date: true, relatedActivity: ACTIVITY_REF },
    sort: ['date', 'title'],
    populate: ['file', 'relatedActivity'],
  },
};

// Operadores de filtro de Strapi que se aceptan
const OPERATORS = new Set([
  '$eq',
  '$eqi',
  '$ne',
  '$nei',
  '$in',
  '$notIn',
  '$lt',
  '$lte',
  '$gt',
  '$gte',
  '$contains',
  '$notContains',
  '$containsi',
  '$notContainsi',
  '$startsWith',
  '$endsWith',
  '$null',
  '$notNull',
  '$between',
  '$and',
  '$or',
  '$not',
]);

export type WhitelistError = { field: string; allowed: string[] };

const flatten = (tree: FieldTree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([k, v]) =>
    v === true ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`)
  );

/** Devuelve null si los filtros son válidos, o el primer campo no permitido. */
export function validateFilters(
  filters: unknown,
  tree: FieldTree,
  path = ''
): WhitelistError | null {
  if (filters === null || filters === undefined) return null;
  if (Array.isArray(filters)) {
    for (const item of filters) {
      const err = validateFilters(item, tree, path);
      if (err) return err;
    }
    return null;
  }
  if (typeof filters !== 'object') return null; // valor escalar de un operador

  for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
    if (OPERATORS.has(key)) {
      // $and/$or reinician en el mismo nivel; $not y comparadores conservan el subárbol
      const err = validateFilters(value, tree, path);
      if (err) return err;
      continue;
    }
    if (key.startsWith('$')) return { field: `${path}${key}`, allowed: flatten(tree) };

    const rule = tree[key];
    if (!rule) return { field: `${path}${key}`, allowed: flatten(tree) };
    if (rule === true) {
      // campo escalar: lo que sigue solo pueden ser operadores o un valor
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const bad = Object.keys(value).find((k) => !OPERATORS.has(k));
        if (bad) return { field: `${path}${key}.${bad}`, allowed: flatten(tree) };
      }
      continue;
    }
    const err = validateFilters(value, rule, `${path}${key}.`);
    if (err) return err;
  }
  return null;
}

/** Acepta "campo", "campo:asc", ["a:desc","b"]; devuelve el primer campo no permitido. */
export function validateSort(sort: unknown, allowed: string[]): WhitelistError | null {
  const items = Array.isArray(sort) ? sort : sort === undefined ? [] : [sort];
  for (const item of items) {
    if (typeof item !== 'string') return { field: String(item), allowed };
    for (const part of item.split(',')) {
      const field = part.trim().split(':')[0];
      if (field && !allowed.includes(field)) return { field, allowed };
    }
  }
  return null;
}

/** populate puede ser "*", "a,b", ["a","b"] o { a: {...}, b: true }. */
export function validatePopulate(populate: unknown, allowed: string[]): WhitelistError | null {
  if (populate === undefined || populate === '*') return null;
  let keys: string[] = [];
  if (typeof populate === 'string') keys = populate.split(',').map((s) => s.trim());
  else if (Array.isArray(populate)) keys = populate.map(String);
  else if (typeof populate === 'object' && populate !== null) keys = Object.keys(populate);
  for (const key of keys) {
    if (key && !allowed.includes(key)) return { field: key, allowed };
  }
  return null;
}
