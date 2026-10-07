'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * `true` desde que el elemento queda a menos de `margin` de la pantalla (por defecto, una pantalla
 * de distancia) y ya no vuelve a `false`. Sirve para montar lo pesado (WebGL, texturas, miniaturas)
 * cuando alguien se acerca y no al cargar la página: en la portada, los dos efectos WebGL de más
 * abajo ocupaban el hilo principal hasta ~3,5 s después de cargar, y lo que apareciera en ese
 * tiempo (las cifras, el scroll) esperaba.
 */
export function useNear(ref: RefObject<Element | null>, margin = '100% 0px') {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setNear(true);
      },
      { rootMargin: margin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
}
