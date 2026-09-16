'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import { folio } from '@/lib/format';

const STEPS = [
  {
    title: 'Se sientan a la mesa',
    text: 'Las nueve universidades, representadas por sus direcciones de posgrado, se reúnen de forma periódica. Ninguna preside: el Foro es una mesa redonda.',
  },
  {
    title: 'Acuerdan iniciativas',
    text: 'De cada sesión salen acuerdos: criterios compartidos, actividades conjuntas, proyectos interinstitucionales y mecanismos de movilidad académica.',
  },
  {
    title: 'Publican resultados',
    text: 'Los aportes se documentan y se hacen públicos aquí: resultados, iniciativas en marcha y beneficios concretos para estudiantes y programas.',
  },
];

/** 9 puntos: dispersos → en círculo (mesa) → en fila (acta publicada). */
const SCATTER = [
  [18, 22],
  [72, 14],
  [40, 48],
  [86, 42],
  [12, 66],
  [58, 70],
  [30, 86],
  [78, 84],
  [52, 28],
];
const CIRCLE = Array.from({ length: 9 }, (_, i) => {
  const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
  return [50 + 30 * Math.cos(a), 50 + 30 * Math.sin(a)];
});
const ROW = Array.from({ length: 9 }, (_, i) => [12 + i * 9.5, 50]);

/**
 * Capítulo 04 · Cómo trabaja el Foro. Pin + scrub (scroll anim #2): la sección queda fija y,
 * con el progreso del scroll, cambian el número, el texto y la figura de 9 puntos.
 * Bajo 768 px no se fija: los tres pasos se apilan (versión adaptada, no escondida).
 */
export function ProcessPinned() {
  const root = useRef<HTMLDivElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const ring = useRef<SVGCircleElement>(null);
  const line = useRef<SVGLineElement>(null);
  const steps = useRef<(HTMLDivElement | null)[]>([]);
  const nums = useRef<(HTMLSpanElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: el,
          start: 'top top+=96',
          end: '+=250%',
          pin: true,
          scrub: 0.7,
        },
      });
      // Estado inicial
      gsap.set(steps.current.slice(1), { autoAlpha: 0, y: 24 });
      gsap.set(nums.current.slice(1), { yPercent: 100 });
      gsap.set(ring.current, { drawSVG: '0%', opacity: 0 });
      gsap.set(line.current, { drawSVG: '0%', opacity: 0 });

      // Paso 1 → 2
      tl.to(
        dots.current,
        {
          attr: { cx: (i: number) => CIRCLE[i][0], cy: (i: number) => CIRCLE[i][1] },
          duration: 1,
          stagger: 0.03,
        },
        0
      )
        .to(ring.current, { drawSVG: '100%', opacity: 1, duration: 0.8 }, 0.4)
        .to(steps.current[0], { autoAlpha: 0, y: -24, duration: 0.4 }, 0.5)
        .to(steps.current[1], { autoAlpha: 1, y: 0, duration: 0.4 }, 0.7)
        .to(nums.current[0], { yPercent: -100, duration: 0.5 }, 0.5)
        .to(nums.current[1], { yPercent: 0, duration: 0.5 }, 0.5)
        .to(bar.current, { scaleX: 0.5, duration: 1 }, 0)
        // Paso 2 → 3
        .to(ring.current, { drawSVG: '0%', opacity: 0, duration: 0.6 }, 1.5)
        .to(
          dots.current,
          {
            attr: { cx: (i: number) => ROW[i][0], cy: (i: number) => ROW[i][1] },
            duration: 1,
            stagger: 0.03,
          },
          1.6
        )
        .to(line.current, { drawSVG: '100%', opacity: 1, duration: 0.8 }, 2.0)
        .to(steps.current[1], { autoAlpha: 0, y: -24, duration: 0.4 }, 1.9)
        .to(steps.current[2], { autoAlpha: 1, y: 0, duration: 0.4 }, 2.1)
        .to(nums.current[1], { yPercent: -100, duration: 0.5 }, 1.9)
        .to(nums.current[2], { yPercent: 0, duration: 0.5 }, 1.9)
        .to(bar.current, { scaleX: 1, duration: 1 }, 1.6);
      return () => tl.scrollTrigger?.kill();
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className="container-x">
      <div className="grid gap-10 md:min-h-[calc(100svh-8rem)] md:grid-cols-12 md:items-center">
        {/* Número grande con máscara vertical (solo desktop; en móvil cada paso lleva su número) */}
        <div className="hidden md:col-span-3 md:block">
          <div className="relative h-[1em] overflow-hidden font-display text-[clamp(6rem,14vw,12rem)] leading-none text-accent">
            {STEPS.map((_, i) => (
              <span
                key={i}
                ref={(n) => {
                  nums.current[i] = n;
                }}
                className="absolute inset-0"
                style={{ fontVariationSettings: "'opsz' 144, 'WONK' 1" }}
              >
                {folio(i + 1)}
              </span>
            ))}
          </div>
          <span className="mt-4 block h-px w-full bg-line">
            <span ref={bar} className="block h-px origin-left scale-x-[0.16] bg-amber" />
          </span>
        </div>

        {/* Textos: en desktop se superponen y cruzan; en móvil se apilan */}
        <div className="relative md:col-span-5 md:min-h-[14rem]">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              ref={(n) => {
                steps.current[i] = n;
              }}
              className="mb-10 md:absolute md:inset-0 md:mb-0"
            >
              <span className="mono-label text-fg-muted md:hidden">Paso {folio(i + 1)}</span>
              <h3 className="mt-2 text-fg md:mt-0">{s.title}</h3>
              <p className="mt-4 max-w-[46ch] leading-relaxed text-fg-muted">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Figura de 9 puntos */}
        <div className="md:col-span-4">
          <svg viewBox="0 0 100 100" className="mx-auto w-full max-w-[22rem]" aria-hidden>
            <circle
              ref={ring}
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="var(--color-jade)"
              strokeWidth="0.4"
            />
            <line
              ref={line}
              x1="10"
              y1="50"
              x2="90"
              y2="50"
              stroke="var(--color-jade)"
              strokeWidth="0.4"
            />
            {SCATTER.map(([x, y], i) => (
              <circle
                key={i}
                ref={(n) => {
                  dots.current[i] = n;
                }}
                cx={x}
                cy={y}
                r={i === 0 ? 2.4 : 1.7}
                fill={i === 0 ? 'var(--color-amber)' : 'var(--fg)'}
              />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
