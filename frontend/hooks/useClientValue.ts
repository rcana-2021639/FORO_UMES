'use client';

import { useSyncExternalStore } from 'react';

// Al hidratar, React usa el valor del servidor y solo vuelve a leer si la suscripción avisa:
// se avisa una vez, justo después, para que el valor del navegador llegue a la pantalla.
const onceAfterHydration = (cb: () => void) => {
  const id = window.setTimeout(cb, 0);
  return () => window.clearTimeout(id);
};

/**
 * Valor que solo existe en el navegador y no cambia durante la visita (parámetros de la URL,
 * soporte de WebGL…). En el servidor y en la hidratación vale `server`; luego, `read()`.
 * `read` debe devolver siempre el mismo valor (primitivo o cacheado) entre llamadas.
 */
export function useClientValue<T>(read: () => T, server: T): T {
  return useSyncExternalStore(onceAfterHydration, read, () => server);
}
