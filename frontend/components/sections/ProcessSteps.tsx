'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import { DepthText } from '@/components/fx/DepthText';
import { FoldText } from '@/components/fx/FoldText';
import { gsap } from '@/lib/gsap';
import { folio } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { Chevron } from '@/components/ui/Chevron';

const STEPS = [
  {
    title: 'Se reúnen las nueve',
    short: 'Se reúnen',
    stamp: 'Sesión',
    note: 'nadie preside',
    lead: 'Nueve direcciones de posgrado, ninguna preside.',
    text: 'Las nueve universidades, representadas por sus direcciones de posgrado, se reúnen de forma periódica. Ninguna preside: cada universidad tiene el mismo voto.',
    facts: ['Reuniones periódicas', 'Un voto por universidad', 'Sin presidencia fija'],
    color: 'var(--color-violet-300)',
    ink: '#261a4f',
  },
  {
    title: 'Acuerdan iniciativas',
    short: 'Acuerdan',
    stamp: 'Acuerdo',
    note: 'un acuerdo',
    lead: 'De cada sesión salen acuerdos concretos.',
    text: 'Criterios compartidos, actividades conjuntas, proyectos interinstitucionales y mecanismos de movilidad académica entre programas.',
    facts: ['Criterios comunes', 'Actividades conjuntas', 'Movilidad académica'],
    color: 'var(--color-orchid-2)',
    ink: '#3a2677',
  },
  {
    title: 'Publican resultados',
    short: 'Publican',
    stamp: 'Publicado',
    note: 'en este sitio',
    lead: 'Lo acordado se documenta y se hace público aquí.',
    text: 'Resultados medibles, iniciativas en marcha y beneficios concretos para estudiantes y programas, en la sección de aportes y en las noticias del Foro.',
    facts: ['Resultados', 'Iniciativas en marcha', 'Beneficios'],
    color: 'var(--color-violet-200)',
    ink: '#4f339e',
  },
] as const;

const N = 9;
/** Antes de verse: dispersos. Cada paso los recompone (ver Diagram). */
const SCATTER: [number, number][] = [
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
const ring = (r: number, cy = 50): [number, number][] =>
  Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return [50 + r * Math.cos(a), cy + r * Math.sin(a)];
  });
const CIRCLE = ring(34);
const INNER = ring(25);
const ROW: [number, number][] = Array.from({ length: N }, (_, i) => [10 + i * 10, 16]);
const SHAPES = [CIRCLE, INNER, ROW];
/** Estrella de nueve puntas {9/4}: cada universidad unida a las demás, sin centro. */
const STAR = CIRCLE.map((p, i) => [p, CIRCLE[(i + 4) % N]] as const);

const AUTO_MS = 7000;

/**
 * Así trabaja el Foro. Escenario 3D: las tres tarjetas viven en un mismo espacio con perspectiva;
 * la activa viene al frente y las otras dos se retiran a los lados, giradas. Al cambiar de paso,
 * el número (DepthText, con capas) y el título (FoldText, se despliega) cambian, la tarjeta recibe
 * su sello y sus casillas se marcan a mano. A la derecha, un diagrama sobre un plano que flota
 * cuenta el paso con las nueve universidades (siglas desde la API): en rueda y unidas entre sí
 * (nadie preside), alrededor de un acuerdo, y en fila publicando una página. Autoavance con barra,
 * pausa al pasar el cursor, flechas del teclado.
 */
export function ProcessSteps({ acronyms = [] }: { acronyms?: string[] }) {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { margin: '-20% 0px' });
  const seen = useInView(root, { once: true, margin: '-15% 0px' });
  const reduced = useReducedMotion();

  const go = useCallback(
    (i: number) => setStep(((i % STEPS.length) + STEPS.length) % STEPS.length),
    []
  );

  useEffect(() => {
    if (!inView || paused || reduced) return;
    const id = window.setTimeout(() => go(step + 1), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [step, inView, paused, reduced, go]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      go(step + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      go(step - 1);
    }
  };

  const current = STEPS[step];
  const running = !paused && !reduced && inView;

  return (
    <div
      ref={root}
      className="container-x"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        {/* Escenario de tarjetas */}
        <div className="relative lg:col-span-7">
          <div
            role="tablist"
            aria-label="Pasos del Foro"
            onKeyDown={onKey}
            className="relative h-[31rem] [perspective:1600px] sm:h-[32rem]"
          >
            {/* Suelo: un disco con luz del color activo, bajo las tarjetas */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-x-[10%] bottom-2 h-24 rounded-[100%] blur-2xl"
              animate={{ background: current.color, opacity: 0.35 }}
              transition={{ duration: 0.8 }}
            />
            {STEPS.map((s, i) => {
              const rel = (((i - step) % STEPS.length) + STEPS.length) % STEPS.length; // 0 activa, 1 siguiente, 2 anterior
              const pos =
                rel === 0
                  ? { x: '0%', z: 0, ry: 0, s: 1, o: 1 }
                  : rel === 1
                    ? { x: '38%', z: -260, ry: -28, s: 0.86, o: 0.5 }
                    : { x: '-38%', z: -260, ry: 28, s: 0.86, o: 0.5 };
              const active = rel === 0;
              return (
                <motion.button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => go(i)}
                  initial={false}
                  animate={
                    reduced
                      ? {
                          x: 0,
                          z: 0,
                          rotateY: 0,
                          scale: 1,
                          opacity: active ? 1 : 0,
                        }
                      : {
                          x: pos.x,
                          z: pos.z,
                          rotateY: pos.ry,
                          scale: pos.s,
                          opacity: pos.o,
                        }
                  }
                  transition={{ type: 'spring', stiffness: 170, damping: 26, mass: 0.9 }}
                  style={
                    {
                      zIndex: active ? 3 : 1,
                      transformStyle: 'preserve-3d',
                      background: s.ink,
                      '--step': s.color,
                    } as React.CSSProperties
                  }
                  className={cn(
                    'pstep absolute inset-x-0 inset-y-4 mx-auto w-[min(100%,30rem)] overflow-hidden rounded-[12px] text-left text-paper shadow-[0_40px_80px_-44px_rgb(0_0_0/0.6)] outline-none',
                    !active && 'cursor-pointer'
                  )}
                >
                  {/* Grano sobre color plano y renglones de acta, muy tenues */}
                  <span aria-hidden className="acc-panel__grain" />
                  <span aria-hidden className="pstep__rules" />

                  <div className="relative flex h-full flex-col p-7 md:p-9">
                    <div className="flex items-start justify-between">
                      <DepthText
                        text={folio(i + 1)}
                        layers={18}
                        depth={1.6}
                        faceColor="var(--color-paper)"
                        depthColor={s.color}
                        fontSize="clamp(4rem, 7vw, 6rem)"
                        tilt={active ? 9 : 0}
                        pointerTracking={active}
                        orbitSpeed={0.2}
                      />
                      <div className="flex flex-col items-end gap-3">
                        <span className="text-[0.72rem] font-semibold tracking-[0.08em] text-paper/75 uppercase">
                          Paso {i + 1} de {STEPS.length}
                        </span>
                        {/* Sello del paso: cae al llegar la tarjeta al frente */}
                        <span
                          key={active ? `on-${step}` : 'off'}
                          className="pstep__stamp"
                          data-on={active || undefined}
                          aria-hidden
                        >
                          {s.stamp}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto">
                      <h3
                        className="text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.02] text-paper"
                        style={{ fontVariationSettings: "'opsz' 72, 'SOFT' 40, 'WONK' 1" }}
                      >
                        {active ? (
                          <FoldText
                            key={`${i}-${step}`}
                            text={s.title}
                            splitBy="word"
                            hinge="bottom"
                            trigger="mount"
                            stagger={0.07}
                          />
                        ) : (
                          s.title
                        )}
                      </h3>
                      <AnimatePresence initial={false}>
                        {active && (
                          <motion.div
                            initial={reduced ? false : { opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: EASE.premium, delay: 0.25 }}
                          >
                            <p className="mt-4 max-w-[40ch] text-[0.98rem] leading-relaxed text-paper/80">
                              {s.text}
                            </p>
                            {/* Casillas que se marcan a mano, una tras otra */}
                            <ul className="pstep__facts">
                              {s.facts.map((f, k) => (
                                <li key={f} style={{ '--k': k } as React.CSSProperties}>
                                  <svg viewBox="0 0 16 16" aria-hidden>
                                    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" />
                                    <path d="M4.2 8.4l2.6 2.7 5-6.2" pathLength={1} />
                                  </svg>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Barra de autoavance */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-1 origin-left"
                      style={{
                        background: s.color,
                        transform: active ? 'scaleX(1)' : 'scaleX(0)',
                        transition:
                          active && running
                            ? `transform ${AUTO_MS}ms linear`
                            : 'transform 0.2s var(--ease-snap)',
                      }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Flechas a los lados de las tarjetas: se ven justo donde está lo que mueven */}
          <button
            type="button"
            onClick={() => go(step - 1)}
            aria-label="Paso anterior"
            className="steps-arrow steps-arrow--prev"
            data-reveal="pop"
            data-reveal-delay={350}
          >
            <Chevron dir="prev" label="Anterior" />
          </button>
          <button
            type="button"
            onClick={() => go(step + 1)}
            aria-label="Paso siguiente"
            className="steps-arrow steps-arrow--next"
            data-reveal="pop"
            data-reveal-delay={450}
          >
            <Chevron dir="next" label="Siguiente" />
          </button>
        </div>

        {/* Diagrama en un plano que flota + recorrido de los tres pasos */}
        <div className="lg:col-span-5">
          <Diagram
            step={step}
            live={seen}
            reduced={reduced}
            color={current.color}
            note={current.note}
            acronyms={acronyms}
          />
          <ol className="psteps-path" aria-label="Ir a un paso" data-reveal="up">
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => go(i)}
                  className="psteps-path__btn"
                  style={{ '--step': s.color } as React.CSSProperties}
                >
                  <span className="psteps-path__dot">{i + 1}</span>
                  <span className="psteps-path__label">{s.short}</span>
                  {/* Tramo hasta el siguiente: se llena mientras el paso está al frente */}
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden
                      className="psteps-path__line"
                      data-fill={
                        i < step ? 'done' : i === step ? (running ? 'run' : 'hold') : undefined
                      }
                      style={{ '--dur': `${AUTO_MS}ms` } as React.CSSProperties}
                    />
                  )}
                </button>
              </li>
            ))}
          </ol>
          <p className="ui-label mt-3 text-right text-fg-muted">
            {paused ? 'En pausa mientras lees' : 'Avanza solo · usa las flechas o pulsa un paso'}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Las nueve universidades sobre un plano que flota y se inclina distinto en cada paso (GSAP):
 * 1 · en rueda, unidas todas con todas (estrella de nueve puntas): nadie preside.
 * 2 · se acercan a un acuerdo que se sella en el centro (radios hacia él).
 * 3 · en fila, publican: la página del sitio se escribe renglón a renglón debajo.
 */
function Diagram({
  step,
  live,
  reduced,
  color,
  note,
  acronyms,
}: {
  step: number;
  live: boolean;
  reduced: boolean;
  color: string;
  note: string;
  acronyms: string[];
}) {
  const nodes = useRef<(SVGGElement | null)[]>([]);
  const star = useRef<SVGGElement>(null);
  const nonagon = useRef<SVGPolygonElement>(null);
  const spokes = useRef<SVGGElement>(null);
  const seal = useRef<SVGGElement>(null);
  const page = useRef<SVGGElement>(null);
  const plane = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!live) return;
    const shape = SHAPES[step];
    const d = reduced ? 0 : 1.2;
    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut', duration: d } });
    nodes.current.forEach((g, i) => {
      // En fila no caben a tamaño completo: se encogen un poco
      if (g) tl.to(g, { x: shape[i][0], y: shape[i][1], scale: step === 2 ? 0.78 : 1 }, i * 0.045);
    });
    const show = (el: Element | null, on: boolean, at: number) => {
      if (!el) return;
      const paths = el.querySelectorAll('line, polygon, path');
      tl.to(paths, { drawSVG: on ? '100%' : '0%', duration: d * 0.7, stagger: on ? 0.03 : 0 }, at);
      tl.to(el, { opacity: on ? 1 : 0, duration: d * 0.4 }, on ? at : 0);
    };
    show(nonagon.current, step === 0, 0.5);
    show(star.current, step === 0, 0.75);
    show(spokes.current, step === 1, 0.6);
    if (seal.current)
      tl.to(
        seal.current,
        step === 1
          ? {
              scale: 1,
              opacity: 1,
              rotate: -8,
              svgOrigin: '50 50',
              duration: reduced ? 0 : 0.55,
              ease: 'back.out(2.4)',
            }
          : {
              scale: 1.6,
              opacity: 0,
              rotate: 0,
              svgOrigin: '50 50',
              duration: reduced ? 0 : 0.3,
              ease: 'power2.in',
            },
        step === 1 ? 1.05 : 0
      );
    if (page.current) {
      tl.to(
        page.current,
        {
          y: step === 2 ? 0 : 14,
          opacity: step === 2 ? 1 : 0,
          duration: d * 0.6,
          ease: 'power3.out',
        },
        step === 2 ? 0.7 : 0
      );
      show(page.current, step === 2, 0.9);
    }
    // El plano se inclina distinto en cada paso
    if (plane.current && !reduced)
      tl.to(plane.current, { rotateX: 22 + step * 6, rotateZ: step * 7 - 7, duration: d }, 0);
    return () => {
      tl.kill();
    };
  }, [step, reduced, live]);

  return (
    <div className="pdiag relative mx-auto aspect-square w-full max-w-[24rem] [perspective:900px]">
      {/* Anillo orbital decorativo, fuera del plano */}
      <span
        aria-hidden
        className="spin-slow pointer-events-none absolute inset-[4%] rounded-full border border-dashed border-line"
        style={{ '--spin-dur': '48s' } as React.CSSProperties}
      />
      <div
        className="float-y absolute inset-[7%] [transform-style:preserve-3d]"
        style={{ '--float-amp': '8px', '--float-dur': '7s' } as React.CSSProperties}
      >
        <div
          ref={plane}
          className="pdiag__plane relative h-full w-full rounded-[22px] border border-line bg-surface-1 shadow-[0_40px_70px_-40px_rgb(var(--shadow-ink)/0.5)]"
          style={{ transform: 'rotateX(22deg) rotateZ(-7deg)' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[22px] opacity-40 blur-2xl transition-colors duration-700"
            style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 65%)` }}
          />
          <svg viewBox="0 0 100 100" className="relative h-full w-full" aria-hidden>
            {/* 1 · rueda y estrella */}
            <polygon
              ref={nonagon}
              points={CIRCLE.map((p) => p.join(',')).join(' ')}
              className="pdiag__ring"
              opacity="0"
            />
            <g ref={star} className="pdiag__star" opacity="0">
              {STAR.map(([a, b], i) => (
                <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
              ))}
            </g>
            {/* 2 · radios hacia el acuerdo y su sello */}
            <g ref={spokes} className="pdiag__spokes" opacity="0">
              {INNER.map(([x, y], i) => (
                <line key={i} x1={x} y1={y} x2={50} y2={50} />
              ))}
            </g>
            <g ref={seal} className="pdiag__seal" opacity="0">
              <circle cx="50" cy="50" r="10.5" />
              <circle cx="50" cy="50" r="8.6" className="pdiag__seal-in" />
              <path d="M45.4 50.4l3.1 3.2 6.2-7.4" />
            </g>
            {/* 3 · la página que se publica */}
            <g ref={page} className="pdiag__page" opacity="0" transform="translate(0 14)">
              <path d="M50 22 V31" className="pdiag__arrow" />
              <path d="M47.6 28.8 L50 31.4 L52.4 28.8" className="pdiag__arrow" />
              <rect x="20" y="35" width="60" height="54" rx="3" />
              <line x1="27" y1="44" x2="60" y2="44" className="pdiag__line pdiag__line--h" />
              <line x1="27" y1="52" x2="73" y2="52" className="pdiag__line" />
              <line x1="27" y1="58" x2="70" y2="58" className="pdiag__line" />
              <line x1="27" y1="64" x2="66" y2="64" className="pdiag__line" />
              <line x1="27" y1="72" x2="73" y2="72" className="pdiag__line" />
              <line x1="27" y1="78" x2="55" y2="78" className="pdiag__line" />
            </g>
            {/* Las nueve: posición inicial dispersa; GSAP las lleva a la forma del paso */}
            {SCATTER.map(([x, y], i) => {
              const label = acronyms[i] ?? '';
              const fs = label ? Math.min(2.9, 10.2 / (label.length * 0.64)) : 0;
              return (
                <g
                  key={i}
                  ref={(n) => {
                    nodes.current[i] = n;
                  }}
                  className="pdiag__node"
                  transform={`translate(${x} ${y})`}
                >
                  <circle r="6" />
                  {label && (
                    <text y={fs * 0.36} fontSize={fs}>
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {/* Nota a mano del paso */}
      <span key={note} className="pdiag__note" aria-hidden>
        {note}
      </span>
      {/* Sombra proyectada del plano */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[16%] bottom-[2%] h-8 rounded-[100%] bg-fg/20 blur-xl"
      />
    </div>
  );
}
