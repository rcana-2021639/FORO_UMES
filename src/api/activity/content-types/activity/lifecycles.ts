import { errors } from '@strapi/utils';

const { ValidationError } = errors;

// Strapi puede recibir la relación como lista de ids, lista de objetos o en formato { connect, set, disconnect }
type RelationInput =
  | Array<number | string | { id?: number | string; documentId?: string }>
  | { set?: unknown[]; connect?: unknown[]; disconnect?: unknown[] }
  | null
  | undefined;

type ActivityData = { participatingUniversities?: RelationInput };

const EMPTY_MESSAGE = 'Una actividad debe tener al menos una universidad participante.';

function countConnected(value: RelationInput): number | null {
  if (value === undefined) return null; // no se tocó la relación
  if (value === null) return 0;
  if (Array.isArray(value)) return value.length;
  if (Array.isArray(value.set)) return value.set.length;
  // Solo connect/disconnect: no se puede saber el total sin consultar la BD
  return null;
}

export default {
  beforeCreate(event: { params: { data: ActivityData } }) {
    const count = countConnected(event.params.data.participatingUniversities);
    if (count === null) {
      const rel = event.params.data.participatingUniversities;
      const connects =
        rel && !Array.isArray(rel) && Array.isArray(rel.connect) ? rel.connect.length : 0;
      if (connects === 0) throw new ValidationError(EMPTY_MESSAGE);
      return;
    }
    if (count === 0) throw new ValidationError(EMPTY_MESSAGE);
  },

  async beforeUpdate(event: { params: { data: ActivityData; where: { id: number } } }) {
    const rel = event.params.data.participatingUniversities;
    if (rel === undefined) return;

    const count = countConnected(rel);
    if (count !== null) {
      if (count === 0) throw new ValidationError(EMPTY_MESSAGE);
      return;
    }

    // Formato connect/disconnect: calcular el total resultante contra lo que hay en la BD
    const current = (await strapi.db.query('api::activity.activity').findOne({
      where: event.params.where,
      populate: { participatingUniversities: { select: ['id'] } },
    })) as { participatingUniversities?: Array<{ id: number }> } | null;

    const existing = new Set((current?.participatingUniversities ?? []).map((u) => u.id));
    const asId = (x: unknown) =>
      typeof x === 'object' && x !== null && 'id' in x
        ? Number((x as { id: unknown }).id)
        : Number(x);

    if (rel && !Array.isArray(rel)) {
      (rel.disconnect ?? []).forEach((x) => existing.delete(asId(x)));
      (rel.connect ?? []).forEach((x) => existing.add(asId(x)));
    }

    if (existing.size === 0) throw new ValidationError(EMPTY_MESSAGE);
  },
};
