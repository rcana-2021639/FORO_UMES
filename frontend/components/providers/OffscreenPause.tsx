'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Pausa las animaciones CSS de los bloques que están lejos de la pantalla (`data-away`, ver
 * v6.css). Los bucles decorativos (orbes del inicio, dibujos de la guía, cinta de universidades,
 * latidos) seguían corriendo a miles de píxeles: el navegador recalculaba su estilo en cada
 * fotograma del scroll. Se reanudan antes de volver a verse (margen de 40 % de pantalla), así que
 * nadie nota la pausa; las entradas con retraso, de paso, esperan a que alguien llegue a verlas.
 *
 * El atributo se pone solo en bloques que React ya hidrató: el contenido de la página se hidrata
 * por partes y después que el layout, y si el atributo llegaba antes React veía un HTML distinto al
 * del servidor. Los que aún no están listos se reintentan un poco después.
 */
export function OffscreenPause() {
  const pathname = usePathname();

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>(
        'main section, main [data-anim-scope], body > footer, footer'
      )
    );
    // Lejos o cerca, pendiente de aplicar
    const pending = new Map<Element, boolean>();
    let retry = 0;
    const apply = () => {
      retry = 0;
      for (const [el, away] of pending) {
        if (!hydrated(el)) continue;
        el.toggleAttribute('data-away', away);
        pending.delete(el);
      }
      if (pending.size) retry = window.setTimeout(apply, 400);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) pending.set(e.target, !e.isIntersecting);
        window.clearTimeout(retry);
        apply();
      },
      { rootMargin: '40% 0px' }
    );
    blocks.forEach((b) => io.observe(b));
    return () => {
      window.clearTimeout(retry);
      io.disconnect();
      blocks.forEach((b) => b.removeAttribute('data-away'));
    };
  }, [pathname]);

  return null;
}

/** React marca cada nodo del DOM al hidratarlo (propiedad interna `__reactFiber$…`). */
function hydrated(el: Element) {
  return Object.keys(el).some((k) => k.startsWith('__reactFiber$'));
}
