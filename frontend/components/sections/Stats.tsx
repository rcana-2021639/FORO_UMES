'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { DepthText } from '@/components/fx/DepthText';
import { Tilt } from '@/components/fx/Tilt';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { gsap } from '@/lib/gsap';
import type { ForumSummary } from '@/lib/types';

/**
 * Nueve sillas, una mesa. Cuatro cifras como bloques de texto con profundidad (React Bits
 * `DepthText`): el número se apila en capas que se inclinan con el puntero, cuenta desde cero al
 * entrar y la losa entera se levanta en 3D. Debajo de la fila, el canto de la mesa: una regla con
 * nueve marcas que se encienden de izquierda a derecha. Sobre marfil, sin cambiar de tema.
 */
export function Stats({ counts, year }: { counts: ForumSummary['counts']; year: number }) {
  const items = [
    {
      value: counts.universities,
      label: 'universidades',
      note: 'en su orden oficial, sin cabecera',
      depth: 'var(--color-sage)',
    },
    {
      value: counts.academicPrograms,
      label: 'programas de posgrado',
      note: 'maestrías, doctorados, especializaciones y diplomados',
      depth: 'var(--color-lilac)',
    },
    {
      value: counts.activitiesThisYear,
      label: `actividades en ${year}`,
      note: 'encuentros, seminarios, reuniones y proyectos',
      depth: 'var(--color-clay-2)',
    },
    {
      value: counts.contributions,
      label: 'aportes publicados',
      note: 'resultados, iniciativas y beneficios documentados',
      depth: 'var(--color-sky)',
    },
  ];

  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { once: true, margin: '-12% 0px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || !inView || reduced) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-stat]', {
        autoAlpha: 0,
        rotateX: -40,
        y: 40,
        transformOrigin: '50% 100%',
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.12,
      });
      gsap.fromTo(
        '[data-seat]',
        { scale: 0.2, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.08, delay: 0.6 }
      );
      gsap.fromTo(
        '[data-edge]',
        { scaleX: 0 },
        { scaleX: 1, duration: 1.4, ease: 'expo.inOut', delay: 0.4 }
      );
    }, el);
    return () => ctx.revert();
  }, [inView, reduced]);

  return (
    <div ref={root} className="[perspective:1400px]">
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((it, i) => (
          <Tilt
            key={it.label}
            as="div"
            max={7}
            scale={1.015}
            className="rounded-[12px]"
            style={{ '--z': 28 } as React.CSSProperties}
          >
            <div
              data-stat
              className="group relative flex h-full flex-col justify-between rounded-[12px] border border-line bg-surface-1 p-6 md:p-7 [transform-style:preserve-3d]"
              style={{ '--tone': it.depth } as React.CSSProperties}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]"
              >
                <span
                  className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-[0.16] blur-3xl transition-opacity duration-700 group-hover:opacity-40"
                  style={{ background: 'var(--tone)' }}
                />
              </span>
              <span
                aria-hidden
                className="mono-label absolute top-5 right-5 rounded-full border border-line px-2 py-0.5 text-fg-muted"
              >
                0{i + 1}
              </span>
              <dd className="m-0" data-depth style={{ '--z': 36 } as React.CSSProperties}>
                <Counter value={it.value} start={inView} delay={0.3 + i * 0.15} depth={it.depth} />
              </dd>
              <div className="mt-6" data-depth style={{ '--z': 16 } as React.CSSProperties}>
                <dt
                  className="font-display text-[1.4rem] leading-tight text-fg"
                  style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 30" }}
                >
                  {it.label}
                </dt>
                <dd className="ui-label mt-1 max-w-[26ch] text-fg-muted">{it.note}</dd>
              </div>
            </div>
          </Tilt>
        ))}
      </dl>

      {/* Canto de la mesa: la regla y las nueve marcas */}
      <div className="relative mt-10 h-8 md:mt-14" aria-hidden>
        <span
          data-edge
          className="absolute inset-x-0 top-1/2 h-px origin-left bg-gradient-to-r from-accent-sage via-fg to-accent-lilac"
        />
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-[2%]">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              data-seat
              className="grid h-6 w-6 place-items-center rounded-full border border-line bg-bg"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  background: [
                    'var(--color-clay)',
                    'var(--color-sage)',
                    'var(--color-lilac)',
                    'var(--color-sky)',
                    'var(--color-sage)',
                    'var(--color-clay)',
                    'var(--color-lilac)',
                    'var(--color-sky)',
                    'var(--color-sage)',
                  ][i],
                }}
              />
            </span>
          ))}
        </div>
      </div>
      <p className="eyebrow mt-4 text-center text-fg-muted">
        Nueve marcas en el canto: cada universidad tiene su lugar.
      </p>
    </div>
  );
}

/** Número con profundidad que cuenta desde cero (spring) al entrar en pantalla. */
function Counter({
  value,
  start,
  delay,
  depth,
}: {
  value: number;
  start: boolean;
  delay: number;
  depth: string;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 32, stiffness: 80, mass: 1 });

  useEffect(() => {
    if (!start) return;
    if (reduced) {
      mv.jump(value);
      spring.jump(value);
      return;
    }
    const id = window.setTimeout(() => mv.set(value), delay * 1000);
    return () => window.clearTimeout(id);
  }, [start, value, delay, reduced, mv, spring]);

  useEffect(
    () =>
      spring.on('change', (v) => {
        const r = Math.round(v);
        setN((prev) => (prev === r ? prev : r));
      }),
    [spring]
  );

  return (
    <DepthText
      text={new Intl.NumberFormat('es-GT').format(n)}
      layers={22}
      depth={1.4}
      faceColor="var(--fg)"
      depthColor={depth}
      tilt={9}
      fontSize="clamp(3.6rem, 6.5vw, 5.8rem)"
      orbitSpeed={0.22}
    />
  );
}
