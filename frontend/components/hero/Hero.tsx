'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { AuroraLayer } from './AuroraLayer';
import { Button } from '@/components/ui/Button';
import { useSplitReveal } from '@/hooks/useSplitReveal';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { useFinePointer } from '@/hooks/useReducedMotion';

const Constellation = dynamic(() => import('./Constellation'), {
  ssr: false,
  loading: () => <ConstellationFallback />,
});

interface Props {
  year: number;
  universities: number;
  programs: number;
}

/**
 * Portada del "acta" (DESIGN_NOTES §7, capítulo 00).
 * Capas con parallax a velocidades distintas (scroll anim #1): aurora 0.2× · polvo/constelación
 * 1.3× · título 1× · cabecera mono 0.6×. Título con SplitText por caracteres (scroll anim #3).
 */
export function Hero({ year, universities, programs }: Props) {
  const root = useRef<HTMLElement>(null);
  const aurora = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();

  const title = useSplitReveal<HTMLHeadingElement>({ type: 'chars', immediate: true, delay: 0.2 });
  const lead = useSplitReveal<HTMLParagraphElement>({ type: 'lines', immediate: true, delay: 0.9 });

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      const st = {
        trigger: root.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      } satisfies ScrollTrigger.Vars;
      gsap.to(aurora.current, { yPercent: 20, ease: 'none', scrollTrigger: st });
      gsap.to(scene.current, { yPercent: -30, scale: 1.08, ease: 'none', scrollTrigger: st });
      gsap.to(head.current, { yPercent: 60, autoAlpha: 0, ease: 'none', scrollTrigger: st });
      gsap.to(body.current, { yPercent: 12, ease: 'none', scrollTrigger: st });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={root}
      className="relative isolate min-h-[100svh] overflow-clip"
      aria-labelledby="hero-title"
    >
      {/* Capa 1 · aurora (0.2×) en multiply para que se lea como acuarela sobre papel */}
      <div
        ref={aurora}
        className="absolute inset-x-0 -top-[10%] -z-30 h-[120%] mix-blend-multiply opacity-50 will-change-transform"
      >
        <AuroraLayer />
      </div>
      {/* Grano de papel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-[0.07] [filter:url(#grain-filter)]"
      />
      {/* Capa 2 · constelación 3D (1.3×) */}
      <div
        ref={scene}
        className="absolute inset-y-0 right-0 -z-10 w-full will-change-transform md:w-[58%]"
        data-cursor-hide
      >
        <Constellation mobile={!fine} />
      </div>

      <div className="container-x relative flex min-h-[100svh] flex-col justify-between pt-28 pb-10">
        {/* Cabecera del acta (0.6×) */}
        <div
          ref={head}
          className="mono-label flex flex-wrap justify-between gap-x-6 gap-y-2 text-fg-muted"
        >
          <span>
            Acta · Edición <span className="text-amber">{year}</span>
          </span>
          <span className="hidden sm:inline">Guatemala, C. A.</span>
          <span>
            {universities} universidades · {programs} programas
          </span>
        </div>

        <div ref={body} className="mt-14 md:mt-0">
          <h1 id="hero-title" ref={title} className="max-w-[12ch] text-fg">
            Foro Interuniversitario de Estudios de Posgrado
          </h1>
          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
            <p
              ref={lead}
              className="max-w-[38ch] text-[1.1rem] leading-relaxed text-fg-muted md:col-span-6"
            >
              Nueve universidades de Guatemala sentadas a una misma mesa para coordinar, fortalecer
              y dar visibilidad a la formación de posgrado del país.
            </p>
            <div className="flex flex-wrap items-center gap-4 md:col-span-6 md:justify-end">
              <Button href="/programas">Explorar programas</Button>
              <Button variant="ghost" href="#universidades">
                Las nueve universidades ↓
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Fallback estático (SSR, carga y reduced-motion): la misma figura como SVG plano. */
function ConstellationFallback() {
  const pts = [
    [50, 50],
    [70, 38],
    [30, 36],
    [65, 68],
    [34, 64],
    [54, 22],
    [45, 78],
    [80, 54],
    [22, 50],
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [0, 6],
    [1, 5],
    [1, 7],
    [2, 5],
    [2, 8],
    [3, 6],
    [3, 7],
    [4, 6],
    [4, 8],
  ];
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full opacity-60" aria-hidden>
      {edges.map(([a, b]) => (
        <line
          key={`${a}${b}`}
          x1={pts[a][0]}
          y1={pts[a][1]}
          x2={pts[b][0]}
          y2={pts[b][1]}
          stroke="#16150f"
          strokeWidth="0.25"
          opacity="0.5"
        />
      ))}
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === 0 ? 1.6 : 0.9}
          fill={i === 0 ? '#c9782a' : '#16150f'}
        />
      ))}
    </svg>
  );
}
