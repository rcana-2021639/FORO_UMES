/**
 * Espejo en JS de `styles/tokens.css` para lo que no puede leer variables CSS (WebGL, canvas,
 * SVG generado). Si cambia un token, cambia aquí también.
 */
export const PALETTE = {
  paper: '#fdfcff',
  paper2: '#f5f2fc',
  ink: '#1e1830',
  ink3: '#6b6485',
  line: '#e4dff0',
  night: '#1a1330',
  dusk: '#130d24',
  violet200: '#d4c6ff',
  violet300: '#b8a2fa',
  violet400: '#9a7bf0',
  violet500: '#7c5ae0',
  violet600: '#6443c4',
  violet700: '#4f339e',
  violet900: '#261a4f',
  orchid: '#8e4fb8',
  orchid2: '#ebcff2',
  plum: '#7a3d8f',
  mulberry: '#8a3f7a',
  indigo: '#4b4aa8',
  periwinkle: '#d7daff',
  // Alias heredados
  sage: '#7a3d8f',
  sage2: '#ebcff2',
  lilac: '#6443c4',
  lilac2: '#d4c6ff',
  lilac3: '#261a4f',
  clay: '#f3d9f0',
  clay2: '#8a3f7a',
  coral: '#e8b4e0',
  sky: '#d7daff',
  slate: '#4b4aa8',
} as const;

/** Losas oscuras violeta (tarjetas y boletos sobre fondo claro u oscuro). */
export const DEEP = {
  sage: '#2a1838',
  lilac: '#1f1740',
  clay: '#2e1630',
  sky: '#1a1d42',
  coral: '#321a33',
} as const;

/** Degradado de losa oscura: violeta profundo con una veta de su matiz. */
export function deepTint(tone: keyof typeof DEEP, angle = 160) {
  const mid = {
    sage: PALETTE.plum,
    lilac: PALETTE.violet600,
    clay: PALETTE.mulberry,
    sky: PALETTE.indigo,
    coral: PALETTE.orchid,
  }[tone];
  return `linear-gradient(${angle}deg, ${DEEP[tone]} 0%, color-mix(in oklab, ${mid} 72%, ${DEEP[tone]}) 60%, ${DEEP[tone]} 100%)`;
}
