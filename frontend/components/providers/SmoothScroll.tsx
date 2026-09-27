'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useQuality } from '@/lib/quality';

/**
 * Lenis global sincronizado con el ticker de GSAP para que ScrollTrigger y el scroll suave
 * compartan el mismo reloj. Respeta prefers-reduced-motion (Lenis lo hace de fábrica).
 */
/** Instancia global para scrollTo programático (p. ej. links de ancla). */
let lenisRef: Lenis | null = null;
export const getLenis = () => lenisRef;

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const quality = useQuality();

  // Solo en modo completo: en equipos modestos el scroll nativo es más fluido que el interpolado
  useEffect(() => {
    if (quality !== 'full') return;
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      anchors: { offset: -96 },
      respectReducedMotion: true,
      // <html> mide 100 % del viewport, así que el ResizeObserver de Lenis nunca ve crecer el
      // documento (rutas nuevas, pin-spacers de GSAP, imágenes). Con el límite calculado en vivo
      // el scroll ya no se queda "trabado" en la altura de la página anterior.
      naiveDimensions: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenisRef = lenis;

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef = null;
    };
  }, [quality]);

  // Al cambiar de ruta: arriba y recalcular triggers (el alto de la página cambió)
  useEffect(() => {
    const lenis = lenisRef;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      lenis?.resize();
    }, 200);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
