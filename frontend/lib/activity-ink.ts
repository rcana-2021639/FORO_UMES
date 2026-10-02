import { DEEP, PALETTE } from './palette';
import type { ActivityType } from './types';

/**
 * Tinta de cada tipo de actividad: el boleto, su talón y la tarjeta de fecha se imprimen con ella.
 * `bg` es el fondo profundo, `stub` el talón y `accent` la etiqueta clara.
 */
export const ACTIVITY_INK: Record<ActivityType, { bg: string; stub: string; accent: string }> = {
  Encuentro: { bg: DEEP.sage, stub: PALETTE.sage, accent: PALETTE.sage2 },
  Conferencia: { bg: DEEP.lilac, stub: PALETTE.lilac, accent: PALETTE.lilac2 },
  Seminario: { bg: DEEP.clay, stub: PALETTE.clay2, accent: PALETTE.clay },
  Reunion: { bg: DEEP.sky, stub: '#4b4aa8', accent: PALETTE.sky },
  Proyecto: { bg: DEEP.coral, stub: '#8e4fb8', accent: PALETTE.coral },
};

/** Días enteros de hoy (hora local) a una fecha AAAA-MM-DD; negativo si ya pasó. */
export function daysUntil(iso: string, today = new Date()): number {
  const t = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - t) / 86_400_000);
}

/** "Hoy", "Mañana", "Faltan 21 días", "Fue ayer", "Hace 3 meses"… */
export function relativeDay(days: number): string {
  if (days === 0) return 'Es hoy';
  if (days === 1) return 'Es mañana';
  if (days > 1) return `Faltan ${days} días`;
  if (days === -1) return 'Fue ayer';
  const ago = -days;
  if (ago < 31) return `Hace ${ago} días`;
  const months = Math.round(ago / 30.44);
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  const years = Math.round(ago / 365.25);
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}
