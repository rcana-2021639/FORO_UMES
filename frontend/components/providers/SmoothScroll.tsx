'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * Lenis global sincronizado con el ticker de GSAP para que ScrollTrigger y el scroll suave
 * compartan el mismo reloj. Respeta prefers-reduced-motion (Lenis lo hace de fábrica).
 */
/** Instancia global para scrollTo programático (p. ej. links de ancla). */
let lenisRef: Lenis | null = null;
export const getLenis = () => lenisRef;

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      anchors: { offset: -96 },
      respectReducedMotion: true,
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
  }, []);

  // Al cambiar de ruta: arriba y recalcular triggers (el alto de la página cambió)
  useEffect(() => {
    lenisRef?.scrollTo(0, { immediate: true });
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
