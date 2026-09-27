'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { DepthText } from '@/components/fx/DepthText';
import { Tilt } from '@/components/fx/Tilt';
import { gsap } from '@/lib/gsap';
import { formatDate, yearOf } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Milestone } from '@/lib/milestones';

/**
 * Capítulo 05 · Hitos del Foro. Eje central que se dibuja con el scroll y por el que sube un
 * pulso de luz; a cada lado, tarjetas en 3D: entran girando desde su lado (rotateY), se inclinan
 * con el puntero (Tilt) y su contenido flota en capas (parallax en Z). Los años son bloques con
 * profundidad (DepthText) que flotan sobre el eje. Jade = ingreso de universidad, violeta =
 * actividad.
 */
export function TimelinePath({ milestones }: { milestones: Milestone[] }) {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGLineElement>(null);
  const pulse = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const p = path.current;
    if (!el || !p) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        p,
        { drawSVG: '0%' },
        {
          drawSVG: '100%',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 55%', scrub: 0.5 },
        }
      );
      // El pulso recorre el eje con el scroll
      if (pulse.current)
        gsap.fromTo(
          pulse.current,
          { top: '0%' },
          {
            top: '100%',
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 55%', scrub: 0.8 },
          }
        );
      const desktop = window.innerWidth >= 768;
      gsap.utils.toArray<HTMLElement>('[data-milestone]', el).forEach((item) => {
        const left = item.dataset.side === 'left';
        gsap.from(item, {
          autoAlpha: 0,
          x: desktop ? (left ? -60 : 60) : 0,
          y: desktop ? 0 : 24,
          rotateY: desktop ? (left ? 24 : -24) : 0,
          transformOrigin: left ? '100% 50%' : '0% 50%',
          duration: 1.1,
          ease: 'expo.out',
          scrollTrigger: { trigger: item, start: 'top 80%', once: true },
        });
      });
      gsap.utils.toArray<HTMLElement>('[data-year]', el).forEach((item) => {
        gsap.from(item, {
          autoAlpha: 0,
          scale: 0.6,
          rotateX: -60,
          duration: 0.9,
          ease: 'back.out(1.6)',
          scrollTrigger: { trigger: item, start: 'top 82%', once: true },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [milestones.length]);

  if (!milestones.length) {
    return (
      <p className="text-fg-muted">
        La línea de tiempo empieza con la primera actividad publicada. Todavía no hay ninguna.
      </p>
    );
  }

  const rows: ({ kind: 'year'; year: number } | { kind: 'item'; m: Milestone; i: number })[] = [];
  let lastYear: number | null = null;
  milestones.forEach((m, i) => {
    const y = yearOf(m.date);
    if (y && y !== lastYear) {
      rows.push({ kind: 'year', year: y });
      lastYear = y;
    }
    rows.push({ kind: 'item', m, i });
  });

  return (
    <div ref={root} className="relative [perspective:1400px]">
      {/* Eje */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-5 h-full w-6 md:left-1/2 md:-translate-x-1/2"
        viewBox="0 0 24 100"
        preserveAspectRatio="none"
      >
        <line
          x1="12"
          y1="0"
          x2="12"
          y2="100"
          stroke="var(--line)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          ref={path}
          x1="12"
          y1="0"
          x2="12"
          y2="100"
          stroke="var(--accent-sage)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Pulso de luz sobre el eje */}
      <span
        ref={pulse}
        aria-hidden
        className="pointer-events-none absolute left-5 z-[2] h-16 w-6 -translate-x-1/2 -translate-y-1/2 md:left-1/2"
      >
        <span className="absolute inset-x-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-clay to-transparent blur-[1px]" />
        <span className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay shadow-[0_0_18px_4px_color-mix(in_oklab,var(--color-clay)_60%,transparent)]" />
      </span>

      <ol className="relative space-y-8 md:space-y-4">
        {rows.map((r) =>
          r.kind === 'year' ? (
            <li
              key={`y${r.year}`}
              className="relative flex pl-10 md:justify-center md:pl-0"
              aria-label={`Año ${r.year}`}
            >
              <span
                className="float-y relative z-10 inline-block"
                style={{ '--float-amp': '5px', '--float-dur': '5s' } as React.CSSProperties}
              >
                <span
                  data-year
                  className="inline-flex items-center rounded-full border border-line bg-bg px-5 py-2 shadow-[0_18px_40px_-20px_rgb(var(--shadow-ink)/0.5)]"
                >
                  <DepthText
                    text={String(r.year)}
                    layers={12}
                    depth={1}
                    fontSize="1.6rem"
                    tilt={8}
                    depthColor="var(--accent-sage)"
                    orbitSpeed={0.25}
                    fontVariationSettings="'opsz' 32, 'WONK' 1"
                    letterSpacing="-0.02em"
                  />
                </span>
              </span>
            </li>
          ) : (
            <Item key={r.m.key} m={r.m} side={r.i % 2 === 0 ? 'left' : 'right'} />
          )
        )}
      </ol>
    </div>
  );
}

function Item({ m, side }: { m: Milestone; side: 'left' | 'right' }) {
  const uni = m.kind === 'university';
  const color = uni ? 'var(--accent-sage)' : 'var(--accent-lilac)';
  const body = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]"
      >
        <span
          className="absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.14] blur-3xl transition-opacity duration-700 group-hover:opacity-40"
          style={{ background: color }}
        />
      </span>
      <span
        className="relative flex items-center justify-between gap-3"
        data-depth
        style={{ '--z': 18 } as React.CSSProperties}
      >
        <span
          className="ui-label inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-paper"
          style={{ background: color }}
        >
          {uni ? 'Ingreso al Foro' : m.kicker.split(' · ')[0]}
        </span>
        <span className="mono-label text-fg-muted">{formatDate(m.date)}</span>
      </span>
      <span
        className="relative mt-3 block text-[1.3rem] leading-[1.15] text-fg"
        style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 30", '--z': 34 } as React.CSSProperties}
        data-depth
      >
        {m.title}
      </span>
      {m.href && (
        <span
          className="ui-label relative mt-4 inline-flex items-center gap-2 text-fg-muted transition-colors duration-300 group-hover:text-fg"
          data-depth
          style={{ '--z': 24 } as React.CSSProperties}
        >
          {uni ? 'Abrir perfil' : 'Ver la actividad'}{' '}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </span>
      )}
    </>
  );

  return (
    <li
      data-milestone
      data-side={side}
      className="relative grid grid-cols-[2.5rem_1fr] md:grid-cols-[1fr_3rem_1fr]"
    >
      <div className={cn('col-start-2', side === 'right' ? 'md:col-start-3' : 'md:col-start-1')}>
        <Tilt max={8} scale={1.02} className="rounded-[12px]">
          {m.href ? (
            <Link
              href={m.href}
              className="group relative block rounded-[12px] border border-line bg-surface-1 p-5 transition-colors duration-500 hover:border-fg/30 md:p-6 [transform-style:preserve-3d]"
            >
              {body}
            </Link>
          ) : (
            <div className="group relative block rounded-[12px] border border-line bg-surface-1 p-5 md:p-6 [transform-style:preserve-3d]">
              {body}
            </div>
          )}
        </Tilt>
      </div>
      {/* Nodo sobre el eje, con anillo que respira */}
      <span
        aria-hidden
        className="absolute top-6 left-5 z-10 grid h-7 w-7 -translate-x-1/2 place-items-center md:left-1/2"
      >
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-20 [animation-duration:2.6s]"
          style={{ background: color }}
        />
        <span className="absolute inset-1 rounded-full opacity-30" style={{ background: color }} />
        <span className="h-3 w-3 rounded-full border-2 border-bg" style={{ background: color }} />
      </span>
    </li>
  );
}
