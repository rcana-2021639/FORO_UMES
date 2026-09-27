'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { DepthText } from '@/components/fx/DepthText';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { CONTRIBUTION_LABEL, excerpt, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Contribution, ContributionType } from '@/lib/types';
import { deepTint } from '@/lib/palette';

const TYPES: { type: ContributionType; blurb: string; tint: string; glow: string }[] = [
  {
    type: 'Resultado',
    blurb: 'Lo que ya ocurrió y se puede medir: convenios, estudios, publicaciones.',
    tint: deepTint('sage'),
    glow: 'var(--color-sage-2)',
  },
  {
    type: 'Iniciativa',
    blurb: 'Lo que está en marcha: proyectos conjuntos, pilotos, mesas de trabajo.',
    tint: deepTint('lilac'),
    glow: 'var(--color-lilac-2)',
  },
  {
    type: 'Beneficio',
    blurb: 'Lo que ganan estudiantes y programas: movilidad, reconocimiento, acceso.',
    tint: deepTint('clay'),
    glow: 'var(--color-clay)',
  },
];

/**
 * Capítulo 06 · Aportes. Tres paneles (Resultado / Iniciativa / Beneficio) en acordeón: el
 * activo se abre al 55 % y muestra sus aportes; los demás se cierran y se inclinan. Adaptado de
 * React Bits `AccordionGallery`, con contenido en vez de fotografías y las tres tintas del
 * tintas nácar (salvia, lila, arcilla). Hover o foco abre; en columna (móvil) se apila vertical.
 */
export function ContributionsSticky({ contributions }: { contributions: Contribution[] }) {
  const groups = TYPES.map((t) => ({
    ...t,
    items: contributions.filter((c) => c.type === t.type),
  }));
  const count = groups.length;
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      groups.findIndex((g) => g.items.length > 0)
    )
  );
  const [vertical, setVertical] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setVertical(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const layout = useCallback(
    (animate: boolean) => {
      const panels = panelRefs.current;
      if (!panels.length) return;
      const r = 0.55;
      const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
      tl.current?.kill();
      const dur = animate && !prefersReducedMotion() ? 0.7 : 0;
      const t = gsap.timeline();
      panels.forEach((panel, i) => {
        if (!panel) return;
        const on = i === active;
        const rot = on ? 0 : i < active ? 7 : -7;
        t.to(
          panel,
          {
            flexGrow: on ? grow : 1,
            ...(vertical ? { rotateX: -rot } : { rotateY: rot }),
            duration: dur,
            ease: 'power3.out',
          },
          0
        );
        const body = bodyRefs.current[i];
        if (body) {
          t.to(
            body,
            {
              opacity: on ? 1 : 0,
              y: on ? 0 : 18,
              duration: on ? dur : dur * 0.5,
              ease: 'power3.out',
            },
            on ? 0.12 : 0
          );
          // Los aportes del panel abierto entran uno a uno, girando desde abajo
          if (on) {
            const rows = body.querySelectorAll<HTMLElement>('[data-row]');
            t.fromTo(
              rows,
              { autoAlpha: 0, y: 22, rotateX: -35, transformOrigin: '50% 0%' },
              { autoAlpha: 1, y: 0, rotateX: 0, duration: dur, ease: 'expo.out', stagger: 0.07 },
              0.2
            );
          }
        }
      });
      tl.current = t;
    },
    [active, count, vertical]
  );

  useEffect(() => {
    layout(!first.current);
    first.current = false;
  }, [layout]);

  useEffect(
    () => () => {
      tl.current?.kill();
    },
    []
  );

  if (contributions.length === 0)
    return (
      <p className="max-w-[44ch] text-fg-muted">
        Ningún aporte publicado todavía. Cuando una universidad documente el primero, aparecerá en
        esta mesa.
      </p>
    );

  return (
    <div
      ref={rootRef}
      role="list"
      aria-label="Aportes del Foro por tipo"
      className={cn(
        'flex w-full gap-3 [perspective:1400px]',
        vertical ? 'h-[min(150vw,44rem)] flex-col' : 'h-[clamp(26rem,54vh,34rem)] flex-row'
      )}
    >
      {groups.map((g, i) => {
        const on = i === active;
        return (
          <div
            key={g.type}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            role="listitem"
            tabIndex={0}
            aria-current={on || undefined}
            aria-label={`${CONTRIBUTION_LABEL[g.type]}: ${g.items.length} aporte${g.items.length === 1 ? '' : 's'}`}
            onPointerEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((i + 1) % count);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((i - 1 + count) % count);
              }
            }}
            className="relative isolate flex min-h-0 min-w-0 flex-1 cursor-pointer flex-col overflow-hidden rounded-[6px] text-paper outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-night"
            style={{ backgroundImage: g.tint, transformOrigin: 'center' }}
          >
            <span aria-hidden className="acc-panel__grain" />
            {/* Anillo que gira despacio en la esquina: cada carpeta tiene su sello */}
            <span
              aria-hidden
              className="spin-slow pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full border border-dashed border-paper/25"
              style={{ '--spin-dur': `${40 + i * 12}s` } as React.CSSProperties}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full border border-paper/10"
              style={{ transform: 'scale(0.7)' }}
            />
            {/* Halo del color del panel, más presente cuando está abierto */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-1/3 -right-1/4 h-[70%] w-[70%] rounded-full opacity-50 blur-3xl transition-opacity duration-700"
              style={{ background: g.glow, opacity: on ? 0.45 : 0.18 }}
            />

            {/* Etiqueta: vertical cuando el panel está cerrado (horizontal) */}
            <div className="relative flex items-start justify-between gap-4 p-5 md:p-6">
              <span
                className="transition-transform duration-500"
                style={{ transform: on ? 'scale(1)' : 'scale(0.72)', transformOrigin: '0 0' }}
              >
                <DepthText
                  text={CONTRIBUTION_LABEL[g.type]}
                  layers={16}
                  depth={1.4}
                  faceColor="var(--color-paper)"
                  depthColor={g.glow}
                  fontSize="clamp(2rem, 3.6vw, 3.2rem)"
                  tilt={on ? 8 : 3}
                  pointerTracking={on}
                  orbitSpeed={0.16}
                  fontVariationSettings="'opsz' 96, 'SOFT' 40, 'WONK' 1"
                />
              </span>
              <span className="mono-label shrink-0 rounded-full border border-paper/30 px-2.5 py-0.5 text-paper/80">
                {g.items.length}
              </span>
            </div>

            <div
              ref={(el) => {
                bodyRefs.current[i] = el;
              }}
              className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 opacity-0 md:px-6 md:pb-6"
              aria-hidden={!on}
            >
              <p className="max-w-[40ch] text-[0.98rem] leading-relaxed text-paper/80">{g.blurb}</p>
              {g.items.length ? (
                <ul className="mt-5 min-h-0 flex-1 divide-y divide-paper/15 overflow-y-auto border-t border-paper/15 pr-1 [scrollbar-width:thin]">
                  {g.items.map((c) => (
                    <li
                      key={c.documentId}
                      data-row
                      className="group/row rounded-[6px] py-4 transition-[background-color,padding] duration-300 hover:bg-paper/[0.06] hover:px-3"
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="mono-label text-paper/60">
                          {formatDate(c.publishedOn)}
                        </span>
                        {c.relatedActivity?.documentId && on && (
                          <Link
                            href={`/actividades/${c.relatedActivity.documentId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="ui-label border-b border-transparent pb-0.5 text-paper/90 transition-colors hover:border-current"
                          >
                            ver la actividad →
                          </Link>
                        )}
                      </div>
                      <h3
                        className="mt-2 text-[1.15rem] leading-snug text-paper"
                        style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 30" }}
                      >
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="mt-1.5 max-w-[52ch] text-[0.88rem] leading-relaxed text-paper/70">
                          {excerpt(c.description, 150)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 text-[0.9rem] text-paper/60">
                  Todavía no hay {CONTRIBUTION_LABEL[g.type].toLowerCase()}s documentados.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
