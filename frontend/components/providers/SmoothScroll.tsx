'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useQuality } from '@/lib/quality';

/** Instancia global para scrollTo programático (p. ej. links de ancla). */
let lenisRef: Lenis | null = null;
export const getLenis = () => lenisRef;

/**
 * Elección recordada en este equipo: el scroll suave no le alcanzó y se usa el nativo. Se guarda
 * en localStorage (no es un dato personal) para no repetir la prueba en cada visita.
 */
const SCROLL_KEY = 'foro:scroll';
const nativeRemembered = () => {
  try {
    return localStorage.getItem(SCROLL_KEY) === 'native';
  } catch {
    return false;
  }
};
const rememberNative = () => {
  try {
    localStorage.setItem(SCROLL_KEY, 'native');
  } catch {}
};

/** Primeros fotogramas de scroll real que se miden, y cuántos lentos (> 25 ms) se toleran. */
const WATCH_FRAMES = 150;
const MAX_SLOW_SHARE = 0.1;

/**
 * Scroll suave (Lenis) sincronizado con el ticker de GSAP para que ScrollTrigger y el scroll
 * compartan el mismo reloj, **solo si el equipo lo sostiene**.
 *
 * Con Lenis, la página se mueve desde el hilo principal en cada fotograma: si ese fotograma tarda
 * (una entrada animada, un filtro, la línea de hitos), el scroll se detiene ese instante. El scroll
 * nativo, en cambio, lo mueve el navegador en otro hilo y nunca se traba. Por eso Lenis arranca a
 * prueba: durante los primeros ~2,5 s de scroll real se miden los fotogramas, y si más del 10 %
 * llega tarde se apaga y queda el nativo (y se recuerda en este equipo). En la computadora donde se
 * reportó el problema (i5 con gráficos integrados) el 15–17 % llegaba tarde.
 *
 * `?lenis=1` fuerza el suave sin prueba y `?lenis=0` el nativo, para comparar mediciones.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const quality = useQuality();

  useEffect(() => {
    if (quality !== 'full') return;
    const param = new URLSearchParams(location.search).get('lenis');
    if (param === '0' || (param !== '1' && nativeRemembered())) return;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      anchors: { offset: -96 },
      respectReducedMotion: true,
      // <html> mide 100 % del viewport, así que observarlo no sirve para saber cuándo crece el
      // documento (rutas nuevas, pin-spacers de GSAP, imágenes). Se observa <body>, que sí crece.
      // Antes se usaba `naiveDimensions`, que relee el alto de la página en cada fotograma y
      // obligaba al navegador a recalcular estilos y layout justo antes de mover el scroll.
      content: document.body,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenisRef = lenis;

    let alive = true;
    const teardown = () => {
      if (!alive) return;
      alive = false;
      gsap.ticker.remove(tick);
      gsap.ticker.remove(watch);
      lenis.destroy();
      if (lenisRef === lenis) lenisRef = null;
      gsap.ticker.lagSmoothing(500, 33);
    };

    // Vigía: mide solo mientras Lenis está moviendo la página
    let samples = 0;
    let slow = 0;
    let last = 0;
    const watch = () => {
      if (!lenis.isScrolling) {
        last = 0;
        return;
      }
      const now = performance.now();
      if (last) {
        samples++;
        if (now - last > 25) slow++;
      }
      last = now;
      if (samples < WATCH_FRAMES) return;
      gsap.ticker.remove(watch);
      if (slow / samples > MAX_SLOW_SHARE) {
        // El scroll sigue desde donde está: Lenis ya había movido la página hasta ahí
        rememberNative();
        teardown();
      }
    };
    if (param !== '1') gsap.ticker.add(watch);

    return teardown;
  }, [quality]);

  // Con scroll nativo, los enlaces a una sección de la misma página viajan suave (con Lenis lo hace
  // su opción `anchors`). El alto de la barra lo descuenta `scroll-padding-top` (v6.css).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (lenisRef || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = a?.getAttribute('href')?.slice(1);
      const target = id ? document.getElementById(decodeURIComponent(id)) : null;
      if (!target) return;
      // En captura y sin propagar: el <Link> de Next también saltaría (sin suavidad) a la sección
      e.preventDefault();
      e.stopPropagation();
      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Al cambiar de ruta: arriba y recalcular triggers (el alto de la página cambió)
  useEffect(() => {
    const lenis = lenisRef;
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    const id = window.setTimeout(() => {
      ScrollTrigger.refresh();
      lenis?.resize();
    }, 200);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return <>{children}</>;
}
