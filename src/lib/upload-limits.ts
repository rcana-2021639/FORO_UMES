/**
 * Límite de tamaño de las imágenes subidas al panel, en un solo lugar.
 *
 * Lo usan: `config/plugins.ts` (sizeLimit del plugin upload), `config/middlewares.ts`
 * (corte de formidable antes de procesar), el middleware `upload-errors` (mensaje claro al
 * editor) y `src/panel/labels.ts` (regla que se muestra en cada campo). Así el "5 MB" no se
 * desincroniza entre esos archivos.
 */
export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Regla breve que ve el editor en la ayuda de cada campo de imagen. */
export const IMAGE_RULES = `PNG, JPG o WebP de hasta ${MAX_UPLOAD_MB} MB.`;

/** Mensaje que ve el editor cuando la imagen supera el límite. */
export const oversizeMessage = () =>
  `La imagen supera el límite de ${MAX_UPLOAD_MB} MB. ` +
  `Comprímela o elige una más liviana (máximo ${MAX_UPLOAD_MB} MB por archivo).`;
