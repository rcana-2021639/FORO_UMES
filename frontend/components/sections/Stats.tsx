'use client';

import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ForumSummary } from '@/lib/types';

/**
 * Capítulo 01 · El Foro en cifras. Contadores con spring (scroll anim #8) que arrancan al
 * entrar en viewport; patrón de React Bits `TextAnimations/CountUp` (useInView + useSpring).
 */
export function Stats({ counts, year }: { counts: ForumSummary['counts']; year: number }) {
  const items = [
    {
      label: 'Universidades integrantes',
      value: counts.universities,
      note: 'orden oficial del Foro',
    },
    {
      label: 'Programas de posgrado',
      value: counts.academicPrograms,
      note: 'maestrías, doctorados, especializaciones',
    },
    {
      label: `Actividades en ${year}`,
      value: counts.activitiesThisYear,
      note: 'encuentros, seminarios, proyectos',
    },
    {
      label: 'Aportes publicados',
      value: counts.contributions,
      note: 'resultados, iniciativas, beneficios',
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={it.label}
          className="group relative bg-bg p-6 transition-colors duration-700 md:p-8"
        >
          <dt className="mono-label text-fg-muted">{it.label}</dt>
          <dd className="mt-8 md:mt-14">
            <Counter value={it.value} delay={i * 0.12} />
            <p className="mono-label mt-3 text-fg-muted">{it.note}</p>
          </dd>
          <span
            aria-hidden
            className="absolute top-0 left-0 h-full w-[2px] origin-top scale-y-0 bg-amber transition-transform duration-700 ease-(--ease-out-expo) group-hover:scale-y-100"
          />
        </div>
      ))}
    </dl>
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
      className="block font-display text-[clamp(3.5rem,8vw,7rem)] leading-none tracking-tight tabular-nums text-fg"
      style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 40, 'WONK' 1" }}
    >
      0
    </span>
  );
}
