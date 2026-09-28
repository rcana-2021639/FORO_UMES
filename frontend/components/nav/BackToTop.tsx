'use client';

import { getLenis } from '@/components/providers/SmoothScroll';

/**
 * Volver arriba: el anillo se llena con el avance del scroll (animación ligada al scroll, solo
 * CSS) y la flecha sube un poco al pasar el cursor. Con Lenis activo, el viaje es suave.
 */
export function BackToTop() {
  const go = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { duration: 1.6 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('contenido')?.focus({ preventScroll: true });
  };
  return (
    <button
      type="button"
      onClick={go}
      className="to-top"
      aria-label="Volver al inicio de la página"
    >
      <svg viewBox="0 0 48 48" aria-hidden className="to-top__ring">
        <circle cx="24" cy="24" r="21" className="to-top__track" />
        <circle cx="24" cy="24" r="21" pathLength={1} className="to-top__fill" />
      </svg>
      <svg viewBox="0 0 16 16" aria-hidden className="to-top__arrow">
        <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" />
      </svg>
    </button>
  );
}
