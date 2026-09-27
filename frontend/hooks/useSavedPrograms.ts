'use client';

import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'foro:programas-guardados';
const EVENT = 'foro:saved-change';
const EMPTY: string[] = [];
let cache: string[] | null = null;
let cacheRaw: string | null = null;

function read(): string[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === cacheRaw && cache) return cache;
    cacheRaw = raw;
    cache = raw ? (JSON.parse(raw) as string[]) : EMPTY;
    return cache;
  } catch {
    return EMPTY;
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* modo privado o cuota: se ignora, el estado vive en memoria */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/**
 * Programas marcados con la estrella. Solo vive en el navegador (no hay endpoint de
 * favoritos en el backend); se comparte entre el carrusel de la portada y el catálogo.
 */
export function useSavedPrograms() {
  const saved = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const current = read();
    write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);
  const has = useCallback((id: string) => saved.includes(id), [saved]);
  return { saved, toggle, has };
}
