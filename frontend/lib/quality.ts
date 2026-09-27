'use client';

import { useSyncExternalStore } from 'react';

/**
 * Nivel de efectos según el equipo. `full`: todo. `lite`: mismas animaciones, sin WebGL, sin
 * inclinación 3D ni desenfoques animados, scroll nativo. `still`: el usuario pidió menos movimiento.
 *
 * El primer veredicto lo da QUALITY_SCRIPT en <head> (antes de pintar, sin parpadeo). Después,
 * `probeFrameRate` mide 2 s de fotogramas y baja a `lite` si el equipo no llega a ~40 fps.
 */
export type Quality = 'full' | 'lite' | 'still';

import { QUALITY_KEY as KEY } from './quality-script';

function read(): Quality {
  if (typeof document === 'undefined') return 'full';
  const q = document.documentElement.dataset.quality;
  return q === 'lite' || q === 'still' ? q : 'full';
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setQuality(q: Quality) {
  document.documentElement.dataset.quality = q;
  try {
    if (q === 'lite') sessionStorage.setItem(KEY, 'lite');
  } catch {}
  listeners.forEach((l) => l());
}

/** Nivel actual; en SSR asume `full` y el cliente corrige en la hidratación. */
export function useQuality(): Quality {
  return useSyncExternalStore(subscribe, read, () => 'full');
}

export const getQuality = read;

/**
 * Mide ~2 s de fotogramas tras la carga. Si la mediana pasa de 24 ms (< ~40 fps) el equipo no
 * sostiene el modo completo: baja a `lite` para el resto de la sesión.
 */
export function probeFrameRate() {
  if (read() !== 'full' || new URLSearchParams(location.search).has('efectos')) return () => {};
  const frames: number[] = [];
  let last = 0;
  let raf = 0;
  const start = performance.now();
  const tick = (t: number) => {
    if (last) frames.push(t - last);
    last = t;
    if (t - start < 2000) {
      raf = requestAnimationFrame(tick);
      return;
    }
    // Pestaña en segundo plano: el navegador frena rAF; no es culpa del equipo
    if (document.visibilityState !== 'visible' || frames.length < 20) return;
    const sorted = frames.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    if (median > 24) setQuality('lite');
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
