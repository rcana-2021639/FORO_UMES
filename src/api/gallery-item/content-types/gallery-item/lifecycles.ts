import { errors } from '@strapi/utils';

const { ValidationError } = errors;

type GalleryData = {
  type?: 'Foto' | 'Video';
  file?: unknown;
  videoUrl?: string | null;
};

/**
 * Regla del plan: `file` es obligatorio si type = Foto; `videoUrl` es obligatorio si type = Video.
 * Un esquema JSON no puede expresar "requerido condicional", por eso se valida aquí.
 */
function validateByType(data: GalleryData, current?: GalleryData) {
  const type = data.type ?? current?.type;
  if (!type) return;

  const file = data.file !== undefined ? data.file : current?.file;
  const videoUrl = data.videoUrl !== undefined ? data.videoUrl : current?.videoUrl;

  if (type === 'Foto' && !file) {
    throw new ValidationError('Un elemento de tipo Foto requiere un archivo de imagen.');
  }
  if (type === 'Video' && !videoUrl) {
    throw new ValidationError('Un elemento de tipo Video requiere el enlace del video (videoUrl).');
  }
}

export default {
  beforeCreate(event: { params: { data: GalleryData } }) {
    validateByType(event.params.data);
  },

  async beforeUpdate(event: { params: { data: GalleryData; where: { id: number } } }) {
    const current = (await strapi.db.query('api::gallery-item.gallery-item').findOne({
      where: event.params.where,
      populate: ['file'],
    })) as GalleryData | null;

    validateByType(event.params.data, current ?? undefined);
  },
};
