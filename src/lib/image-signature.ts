/**
 * Verificación de "magic bytes" de imágenes (Sprint 5, tarea 5).
 * La extensión y el tipo MIME declarado los controla el cliente; los primeros bytes del
 * archivo no. Un ejecutable renombrado a .png se detecta aquí.
 */
export const ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

const EXT_BY_MIME: Record<AllowedImageMime, string[]> = {
  'image/png': ['png'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/webp': ['webp'],
};

/** Detecta el tipo real a partir de los primeros bytes; null si no es PNG/JPEG/WebP. */
export function detectImageMime(bytes: Uint8Array): AllowedImageMime | null {
  if (bytes.length < 12) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export type SignatureCheck = { ok: true; mime: AllowedImageMime } | { ok: false; reason: string };

/** Comprueba que bytes, MIME declarado y extensión cuenten la misma historia. */
export function checkImageSignature(
  bytes: Uint8Array,
  declaredMime: string | undefined,
  filename: string | undefined
): SignatureCheck {
  const real = detectImageMime(bytes);
  if (!real) return { ok: false, reason: 'El archivo no es una imagen PNG, JPEG o WebP válida.' };

  if (declaredMime && declaredMime.toLowerCase() !== real) {
    return {
      ok: false,
      reason: `El tipo declarado (${declaredMime}) no coincide con el contenido (${real}).`,
    };
  }

  const ext = (filename ?? '').split('.').pop()?.toLowerCase() ?? '';
  if (!EXT_BY_MIME[real].includes(ext)) {
    return {
      ok: false,
      reason: `La extensión .${ext || '(ninguna)'} no corresponde a una imagen ${real}.`,
    };
  }

  return { ok: true, mime: real };
}
