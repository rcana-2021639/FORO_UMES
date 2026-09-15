import { errors } from '@strapi/utils';

const { ValidationError } = errors;

type ProfileData = { adminUser?: unknown };

const extractId = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  if (value && typeof value === 'object') {
    const v = value as { id?: unknown; connect?: unknown[]; set?: unknown[] };
    if (v.id !== undefined) return Number(v.id);
    const first = (v.set ?? v.connect ?? [])[0];
    return first ? extractId(first) : null;
  }
  return null;
};

/**
 * Un usuario del panel solo puede tener un Perfil de editor (una universidad).
 * Mensaje claro para el Super Admin; el índice único en base de datos es la red de seguridad.
 */
async function assertSingleProfile(data: ProfileData, currentId?: number) {
  const adminUserId = extractId(data.adminUser);
  if (adminUserId === null) return;
  const existing = (await strapi.db.query('api::editor-profile.editor-profile').findOne({
    where: { adminUser: adminUserId, ...(currentId ? { id: { $ne: currentId } } : {}) },
    select: ['id'],
  })) as { id: number } | null;
  if (existing) {
    throw new ValidationError(
      'Este usuario ya tiene un Perfil de editor. Edite el existente en lugar de crear otro; una persona que edite dos universidades necesita dos cuentas.'
    );
  }
}

export default {
  async beforeCreate(event: { params: { data: ProfileData } }) {
    await assertSingleProfile(event.params.data);
  },
  async beforeUpdate(event: { params: { data: ProfileData; where: { id: number } } }) {
    await assertSingleProfile(event.params.data, event.params.where.id);
  },
};
