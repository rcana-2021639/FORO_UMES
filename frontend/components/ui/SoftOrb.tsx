'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  className?: string;
  /** Sigue al puntero con una inclinación suave (solo puntero fino). */
  follow?: boolean;
}

/**
 * Orbe sin WebGL: tres manchas de color con `filter: blur` que giran despacio dentro de un
 * círculo, más un anillo de nueve asientos. Sustituye al `Orb` OGL de React Bits (y a la estela
 * `GlowCursor`) porque dos contextos WebGL en la misma sección hacían que el capítulo de
 * contacto se trabara. Todo son transforms y opacidad: lo mueve el compositor, no el hilo principal.
 */
export function SoftOrb({ className, follow = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !follow || !window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2;
      ty = ((e.clientY - (r.top + r.height / 2)) / window.innerHeight) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty('--ox', `${cx * 14}px`);
      el.style.setProperty('--oy', `${cy * 14}px`);
      el.style.setProperty('--rx', `${-cy * 8}deg`);
      el.style.setProperty('--ry', `${cx * 8}deg`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [follow]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn('soft-orb', className)}
      style={{ transform: 'perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' }}
    >
      <div className="soft-orb__disc">
        <span className="soft-orb__blob soft-orb__blob--a" />
        <span className="soft-orb__blob soft-orb__blob--b" />
        <span className="soft-orb__blob soft-orb__blob--c" />
        <span className="soft-orb__grain" />
      </div>
      <svg viewBox="0 0 100 100" className="soft-orb__ring">
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="0.5"
          strokeDasharray="1 3"
        />
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={50 + 46 * Math.cos(a)}
              cy={50 + 46 * Math.sin(a)}
              r="1.6"
              fill="currentColor"
              style={{ animationDelay: `${i * 0.35}s` }}
              className="soft-orb__seat"
            />
          );
        })}
      </svg>
    </div>
  );
}
