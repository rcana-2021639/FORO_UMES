'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type SectionTheme = 'paper' | 'paper-2' | 'night' | 'dusk';

/**
 * Las variables de cada tema (fondo, tinta, filetes, acentos, chispa) viven en CSS sobre cada
 * `[data-section-theme]` (v6.css) y en `.section-dark`. En tiempo de ejecución solo cambia
 * `data-theme` en <html>: el fondo de la página cruza de un tono a otro con dos capas fijas que se
 * funden por opacidad (en la GPU). Antes se reescribían nueve variables en la raíz con cada cambio
 * de capítulo: el navegador recalculaba el estilo de los ~6 000 elementos de la portada de golpe.
 */
export function applyTheme(theme: SectionTheme) {
  const root = document.documentElement;
  if (root.dataset.theme !== theme) root.dataset.theme = theme;
}

/**
 * Cambio de tema por sección (scroll anim #9): cada <section data-section-theme="night">
 * cambia las variables vivas del documento cuando cruza la mitad del viewport; el body
 * interpola con `transition` en CSS. No hay toggle manual: el "modo oscuro" es narrativo.
 */
export function SectionThemeObserver() {
  const pathname = usePathname();

  useEffect(() => {
    applyTheme('paper');
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section-theme]'));
    // IntersectionObserver (no ScrollTrigger): mide el layout real, incluidos los pin-spacers
    // que GSAP inserta en las secciones fijadas. Activo cuando la sección cruza la franja central.
    const active = new Set<HTMLElement>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) active.add(e.target as HTMLElement);
          else active.delete(e.target as HTMLElement);
        });
        // La última sección activa en orden de documento gana; si no hay ninguna, papel
        const current = sections.filter((s) => active.has(s)).at(-1);
        applyTheme((current?.dataset.sectionTheme as SectionTheme) ?? 'paper');
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      applyTheme('paper');
    };
  }, [pathname]);

  return null;
}
