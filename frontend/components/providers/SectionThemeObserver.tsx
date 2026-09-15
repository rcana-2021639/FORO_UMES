'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type SectionTheme = 'paper' | 'paper-2' | 'night';

const THEMES: Record<SectionTheme, { bg: string; fg: string; muted: string; line: string }> = {
  paper: {
    bg: 'var(--color-paper)',
    fg: 'var(--color-ink)',
    muted: 'var(--color-ink-3)',
    line: 'var(--color-line)',
  },
  'paper-2': {
    bg: 'var(--color-paper-2)',
    fg: 'var(--color-ink)',
    muted: 'var(--color-ink-2)',
    line: '#cfc6b0',
  },
  night: {
    bg: 'var(--color-night)',
    fg: 'var(--color-paper)',
    muted: '#9aa4ad',
    line: '#27333f',
  },
};

export function applyTheme(theme: SectionTheme) {
  const t = THEMES[theme];
  const s = document.documentElement.style;
  s.setProperty('--bg', t.bg);
  s.setProperty('--fg', t.fg);
  s.setProperty('--fg-muted', t.muted);
  s.setProperty('--line', t.line);
  document.documentElement.dataset.theme = theme;
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
