'use client';

import { useEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react';

interface Props {
  label: string;
  /** Ejes de la fuente variable lejos del puntero, p. ej. "'wght' 300, 'SOFT' 30". */
  from: string;
  /** Ejes cerca del puntero. */
  to: string;
  /** Contenedor respecto al cual se mide el puntero (normalmente la sección). */
  containerRef: RefObject<HTMLElement | null>;
  radius?: number;
  falloff?: 'linear' | 'exponential' | 'gaussian';
  className?: string;
  style?: CSSProperties;
}

/**
 * Texto cuyos ejes variables (peso, óptica, suavidad de Fraunces) responden a la distancia del
 * puntero letra por letra. Adaptado de React Bits `VariableProximity`: sin Roboto Flex (hereda la
 * fuente del padre), sin dependencia de Motion, y solo recalcula cuando el puntero se mueve.
 */
export function VariableProximity({
  label,
  from,
  to,
  containerRef,
  radius = 120,
  falloff = 'gaussian',
  className,
  style,
}: Props) {
  const letters = useRef<(HTMLSpanElement | null)[]>([]);
  const pos = useRef({ x: -9999, y: -9999 });
  const last = useRef({ x: 0, y: 0 });

  const axes = useMemo(() => {
    const parse = (s: string) =>
      new Map(
        s
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const [name, value] = p.split(/\s+/);
            return [name.replace(/['"]/g, ''), parseFloat(value)] as const;
          })
      );
    const a = parse(from);
    const b = parse(to);
    return Array.from(a.entries()).map(([axis, f]) => ({ axis, f, t: b.get(axis) ?? f }));
  }, [from, to]);

  useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      pos.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => {
      pos.current = { x: -9999, y: -9999 };
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    c.addEventListener('pointerleave', onLeave);

    let raf = 0;
    const fall = (d: number) => {
      const n = Math.min(Math.max(1 - d / radius, 0), 1);
      if (falloff === 'exponential') return n * n;
      if (falloff === 'gaussian') return Math.exp(-((d / (radius / 2)) ** 2) / 2);
      return n;
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const { x, y } = pos.current;
      if (last.current.x === x && last.current.y === y) return;
      last.current = { x, y };
      const cr = c.getBoundingClientRect();
      letters.current.forEach((el) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - cr.left;
        const cy = r.top + r.height / 2 - cr.top;
        const d = Math.hypot(x - cx, y - cy);
        if (d >= radius) {
          el.style.fontVariationSettings = from;
          return;
        }
        const k = fall(d);
        el.style.fontVariationSettings = axes
          .map(({ axis, f, t }) => `'${axis}' ${f + (t - f) * k}`)
          .join(', ');
      });
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      c.removeEventListener('pointerleave', onLeave);
    };
  }, [containerRef, axes, from, radius, falloff]);

  const words = label.split(' ');
  let i = 0;
  return (
    <span className={className} style={style}>
      {words.map((w, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {Array.from(w).map((ch) => {
            const idx = i++;
            return (
              <span
                key={idx}
                ref={(el) => {
                  letters.current[idx] = el;
                }}
                aria-hidden
                className="inline-block"
                style={{
                  fontVariationSettings: from,
                  transition: 'font-variation-settings 80ms linear',
                }}
              >
                {ch}
              </span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
      <span className="sr-only">{label}</span>
    </span>
  );
}
