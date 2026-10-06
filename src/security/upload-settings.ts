import type { Core } from '@strapi/strapi';

type UploadSettings = {
  sizeOptimization?: boolean;
  responsiveDimensions?: boolean;
  autoOrientation?: boolean;
  aiMetadata?: boolean;
};

/**
 * Ajustes de la Biblioteca de medios que el código mantiene fijos (auditoría de producción, A-6).
 *
 * `sizeOptimization` hace que Strapi vuelva a codificar cada foto con sharp, y eso borra sus
 * metadatos EXIF: ubicación GPS de donde se tomó, modelo del teléfono, fecha y hora. Si alguien lo
 * apaga desde Configuración → Biblioteca de medios, las fotos de las actividades se publicarían con
 * la ubicación de quien las tomó. Por eso se vuelve a encender en cada arranque.
 * `autoOrientation` corrige las fotos de teléfono que saldrían de lado (también limpia EXIF).
 * `aiMetadata` (texto alternativo con IA de Strapi) requiere licencia Enterprise y enviaría las
 * fotos a un servicio externo: se mantiene apagado.
 */
export const ENFORCED_UPLOAD_SETTINGS: Required<UploadSettings> = {
  sizeOptimization: true,
  responsiveDimensions: true,
  autoOrientation: true,
  aiMetadata: false,
};

export async function ensureUploadSettings(strapi: Core.Strapi): Promise<void> {
  const store = strapi.store({ type: 'plugin', name: 'upload', key: 'settings' });
  const current = ((await store.get({})) ?? {}) as UploadSettings;
  const changed = (Object.keys(ENFORCED_UPLOAD_SETTINGS) as Array<keyof UploadSettings>).filter(
    (key) => current[key] !== ENFORCED_UPLOAD_SETTINGS[key]
  );
  if (changed.length === 0) return;

  await store.set({ value: { ...current, ...ENFORCED_UPLOAD_SETTINGS } });
  strapi.log.info(
    `[security] ajustes de la Biblioteca de medios restablecidos: ${changed.join(', ')}`
  );
}
