'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/** true si el usuario pidió menos movimiento. En SSR devuelve false. */
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}

/** Versión sincrónica para código imperativo (GSAP, OGL) fuera de React. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

/** Puntero fino = mouse/trackpad. Define si se monta el cursor custom y los efectos magnéticos. */
export const hasFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

const FINE = '(pointer: fine)';
function subscribeFine(cb: () => void) {
  const mq = window.matchMedia(FINE);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
/** true con mouse/trackpad; false en táctil y en SSR. */
export function useFinePointer() {
  return useSyncExternalStore(
    subscribeFine,
    () => window.matchMedia(FINE).matches,
    () => false
  );
}
