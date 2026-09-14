/**
 * Utilidades para leer el valor de una relación tal como llega en el cuerpo de una petición
 * del panel administrativo o de la API. Strapi acepta varios formatos:
 *   - 12                       (id)            - "abc123"            (documentId)
 *   - [12, "abc123"]           (lista)         - { id: 12 } / { documentId: "abc123" }
 *   - { connect: [...], disconnect: [...], set: [...] }
 */
export type RelationRef = { id?: number; documentId?: string };

type RawItem = number | string | RelationRef | null | undefined;

const toRef = (item: RawItem): RelationRef | null => {
  if (item === null || item === undefined) return null;
  if (typeof item === 'number') return { id: item };
  if (typeof item === 'string')
    return /^\d+$/.test(item) ? { id: Number(item) } : { documentId: item };
  if (typeof item === 'object') {
    const ref: RelationRef = {};
    if (item.id !== undefined && item.id !== null) ref.id = Number(item.id);
    if (typeof item.documentId === 'string') ref.documentId = item.documentId;
    return ref.id !== undefined || ref.documentId !== undefined ? ref : null;
  }
  return null;
};

const toRefs = (value: unknown): RelationRef[] => {
  if (Array.isArray(value)) return value.map(toRef).filter((r): r is RelationRef => r !== null);
  const single = toRef(value as RawItem);
  return single ? [single] : [];
};

export type RelationChange = {
  /** La relación viene en la petición (aunque sea vacía) */
  present: boolean;
  /** `set` o lista completa: reemplaza el valor actual */
  replaces: boolean;
  /** Referencias que quedan conectadas (set/lista/connect/escalar) */
  connect: RelationRef[];
  disconnect: RelationRef[];
};

export function readRelation(value: unknown): RelationChange {
  if (value === undefined) return { present: false, replaces: false, connect: [], disconnect: [] };
  if (value === null) return { present: true, replaces: true, connect: [], disconnect: [] };

  if (typeof value === 'object' && !Array.isArray(value)) {
    const v = value as { connect?: unknown; disconnect?: unknown; set?: unknown } & RelationRef;
    if ('connect' in v || 'disconnect' in v || 'set' in v) {
      if (v.set !== undefined) {
        return { present: true, replaces: true, connect: toRefs(v.set), disconnect: [] };
      }
      return {
        present: true,
        replaces: false,
        connect: toRefs(v.connect),
        disconnect: toRefs(v.disconnect),
      };
    }
  }
  return { present: true, replaces: true, connect: toRefs(value), disconnect: [] };
}

export const refMatches = (ref: RelationRef, target: { id: number; documentId: string }): boolean =>
  (ref.id !== undefined && ref.id === target.id) ||
  (ref.documentId !== undefined && ref.documentId === target.documentId);
