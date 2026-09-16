'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ForumSummary } from '@/lib/types';

/**
 * Nueve sillas, una mesa. Cuatro cifras sin cajas: un número enorme en Fraunces ligera sobre
 * una regla que se dibuja, y debajo la frase que lo explica. Contadores con spring
 * (scroll anim #8), patrón de React Bits `CountUp` (useInView + useSpring).
 */
export function Stats({ counts, year }: { counts: ForumSummary['counts']; year: number }) {
  const items = [
    {
      value: counts.universities,
      label: 'universidades',
      note: 'en el orden en que se sientan a la mesa',
    },
    {
      value: counts.academicPrograms,
      label: 'programas de posgrado',
      note: 'maestrías, doctorados, especializaciones y diplomados',
    },
    {
      value: counts.activitiesThisYear,
      label: `actividades en ${year}`,
      note: 'encuentros, seminarios, reuniones y proyectos',
    },
    {
      value: counts.contributions,
      label: 'aportes publicados',
      note: 'resultados, iniciativas y beneficios documentados',
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-14 lg:grid-cols-4 lg:gap-x-12">
      {items.map((it, i) => (
        <div key={it.label} className="group relative">
          <dd className="relative">
            <Counter value={it.value} delay={[0, 0.16, 0.26, 0.5][i]} />
            <Rule delay={[0.1, 0.26, 0.36, 0.6][i]} />
          </dd>
          <dt className="mt-4 font-display text-[1.35rem] leading-tight text-fg">{it.label}</dt>
          <dd className="ui-label mt-1.5 max-w-[26ch] text-fg-muted">{it.note}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Regla que se dibuja de izquierda a derecha cuando el número arranca. */
function Rule({ delay }: { delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reduced = useReducedMotion();
  return (
    <span ref={ref} className="mt-3 block h-px w-full overflow-hidden bg-line">
      <span
        className="block h-px w-full origin-left bg-fg"
        style={{
          transform: inView || reduced ? 'scaleX(1)' : 'scaleX(0)',
          transition: reduced ? 'none' : `transform 1.1s var(--ease-cinematic) ${delay}s`,
        }}
      />
    </span>
  );
}

function Counter({ value, delay }: { value: number; delay: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 34, stiffness: 90, mass: 1 });

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      mv.jump(value);
      return;
    }
    const id = window.setTimeout(() => mv.set(value), delay * 1000);
    return () => window.clearTimeout(id);
  }, [inView, value, delay, reduced, mv]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = new Intl.NumberFormat('es-GT');
    el.textContent = fmt.format(0);
    return spring.on('change', (v) => {
      el.textContent = fmt.format(Math.round(v));
    });
  }, [spring]);

  return (
    <span
      ref={ref}
      className="block font-display text-[clamp(4rem,9vw,8rem)] leading-[0.9] font-light tracking-[-0.04em] text-fg tabular-nums"
      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 60, 'WONK' 1" }}
    >
      0
    </span>
  );
}
