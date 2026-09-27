'use client';

import { useEffect, useState } from 'react';
import { getLenis } from '@/components/providers/SmoothScroll';
import { cn } from '@/lib/cn';

export interface RailItem {
  id: string;
  label: string;
}

/**
 * Índice lateral de la portada: dónde estoy y qué viene. Un punto por bloque; el activo se
 * alarga y muestra su nombre, los demás lo muestran al pasar el cursor. Solo en escritorio
 * (en móvil el orden vertical ya es el índice). Se oculta sobre la portada para no competir
 * con los tres caminos.
 */
export function SectionRail({ items }: { items: RailItem[] }) {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const els = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => !!el);
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const idx = items.findLastIndex((it) => visible.get(it.id));
        if (idx >= 0) setActive(idx);
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((el) => io.observe(el));
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [items]);

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.2 });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav
      aria-label="En esta página"
      data-shown={shown}
      className={cn(
        'section-rail fixed top-1/2 right-4 z-[900] hidden -translate-y-1/2 xl:block',
        shown ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <ol className="flex flex-col items-end gap-3">
        {items.map((it, i) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              onClick={(e) => go(e, it.id)}
              aria-current={i === active ? 'location' : undefined}
              className="section-rail__item group"
            >
              <span className="section-rail__label">
                <span className="mono-label mr-1.5 opacity-60">{i + 1}</span>
                {it.label}
              </span>
              <span className="section-rail__dot" aria-hidden />
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
