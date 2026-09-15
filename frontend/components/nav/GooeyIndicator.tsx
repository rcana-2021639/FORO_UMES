'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

interface Rect {
  x: number;
  w: number;
}

interface Props {
  /** Contenedor de los links (para medir posiciones relativas). */
  container: React.RefObject<HTMLElement | null>;
  activeIndex: number;
  hoverIndex: number | null;
  /** Selector de cada link dentro del contenedor. */
  itemSelector?: string;
}

/**
 * Indicador gooey: dos gotas bajo `filter: url(#gooey-filter)`.
 * La gota "cabeza" persigue al link hovered/activo con un spring rápido; la gota "cola"
 * lo hace con uno más lento. Mientras viajan, el filtro las funde en un puente líquido
 * (metaball). Al detenerse, se apilan y vuelven a ser una sola pastilla.
 */
export function GooeyIndicator({ container, activeIndex, hoverIndex, itemSelector = 'a' }: Props) {
  const [rects, setRects] = useState<Rect[]>([]);

  const x = useMotionValue(0);
  const w = useMotionValue(0);
  const head = {
    x: useSpring(x, { stiffness: 420, damping: 30 }),
    w: useSpring(w, { stiffness: 420, damping: 30 }),
  };
  const tail = {
    x: useSpring(x, { stiffness: 140, damping: 20 }),
    w: useSpring(w, { stiffness: 140, damping: 20 }),
  };

  // Medir links (y re-medir en resize / cambio de fuente)
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const measure = () => {
      const base = el.getBoundingClientRect();
      const items = Array.from(el.querySelectorAll<HTMLElement>(itemSelector));
      setRects(
        items.map((i) => ({ x: i.getBoundingClientRect().left - base.left, w: i.offsetWidth }))
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [container, itemSelector]);

  const target = hoverIndex ?? activeIndex;
  useEffect(() => {
    const r = rects[target];
    if (!r) return;
    x.set(r.x);
    w.set(r.w);
  }, [rects, target, x, w]);

  if (!rects.length || target < 0) return null;

  return (
    <div aria-hidden className="gooey pointer-events-none absolute inset-0">
      <motion.span
        className="absolute top-1/2 h-8 -translate-y-1/2 rounded-full bg-jade"
        style={{ x: tail.x, width: tail.w }}
      />
      <motion.span
        className="absolute top-1/2 h-8 -translate-y-1/2 rounded-full bg-jade"
        style={{ x: head.x, width: head.w }}
      />
    </div>
  );
}
