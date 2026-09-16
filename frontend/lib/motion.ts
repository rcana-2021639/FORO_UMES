/**
 * Utilidades de movimiento compartidas (ver DESIGN_NOTES §15).
 * Un stagger lineal (0, 100, 200…) se ve generado; este acelera al principio y se
 * relaja después, con una pequeña variación determinista para que no sea matemático.
 */
export function stagger(i: number, base = 0.07, cap = 0.9) {
  const eased = 1 - Math.pow(1 - Math.min(i, 12) / 12, 1.6);
  const jitter = ((i * 7919) % 5) * 0.012;
  return Math.min(cap, eased * 12 * base + jitter);
}

export const EASE = {
  premium: [0.16, 1, 0.3, 1] as const,
  snap: [0.22, 1, 0.36, 1] as const,
  cinematic: [0.83, 0, 0.17, 1] as const,
};
