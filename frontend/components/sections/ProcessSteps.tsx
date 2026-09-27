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
    lead: 'Nueve direcciones de posgrado, ninguna preside.',
    text: 'Las nueve universidades, representadas por sus direcciones de posgrado, se reúnen de forma periódica. Ninguna preside: cada universidad tiene el mismo voto.',
    facts: ['Reuniones periódicas', 'Un voto por universidad', 'Sin presidencia fija'],
    color: 'var(--color-violet-300)',
    ink: 'linear-gradient(150deg, #1f1545 0%, #3a2677 58%, #261a4f 100%)',
  },
  {
    title: 'Acuerdan iniciativas',
    lead: 'De cada sesión salen acuerdos concretos.',
    text: 'Criterios compartidos, actividades conjuntas, proyectos interinstitucionales y mecanismos de movilidad académica entre programas.',
    facts: ['Criterios comunes', 'Actividades conjuntas', 'Movilidad académica'],
    color: 'var(--color-orchid-2)',
    ink: 'linear-gradient(150deg, #2f1c5c 0%, #5b3aa8 58%, #3a2677 100%)',
  },
  {
    title: 'Publican resultados',
    lead: 'Lo acordado se documenta y se hace público aquí.',
    text: 'Resultados medibles, iniciativas en marcha y beneficios concretos para estudiantes y programas, en la sección de aportes y en las noticias del Foro.',
    facts: ['Resultados', 'Iniciativas en marcha', 'Beneficios'],
    color: 'var(--color-violet-200)',
    ink: 'linear-gradient(150deg, #4f339e 0%, #7c5ae0 58%, #5b3aa8 100%)',
  },
] as const;

const N = 9;
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
const CIRCLE: [number, number][] = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2;
  return [50 + 32 * Math.cos(a), 50 + 32 * Math.sin(a)];
});
const ROW: [number, number][] = Array.from({ length: N }, (_, i) => [12 + i * 9.5, 50]);
const SHAPES = [SCATTER, CIRCLE, ROW];

const AUTO_MS = 7000;

/**
 * Capítulo 04 · Cómo trabaja la mesa. Escenario 3D: las tres tarjetas viven en un mismo espacio
 * con perspectiva; la activa viene al frente y las otras dos se retiran a los lados, giradas.
 * Al cambiar de paso, el número (DepthText, con capas) y el título (FoldText, se despliega)
 * cambian, y la figura de nueve puntos —sobre un plano inclinado que flota— se recompone con
 * GSAP. Autoavance con barra, pausa al pasar el cursor, flechas del teclado.
 */
export function ProcessSteps() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { margin: '-20% 0px' });
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
            className="relative h-[30rem] [perspective:1600px] sm:h-[32rem]"
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
                  style={{
                    zIndex: active ? 3 : 1,
                    transformStyle: 'preserve-3d',
                    background: s.ink,
                  }}
                  className={cn(
                    'absolute inset-x-0 inset-y-4 mx-auto w-[min(100%,30rem)] overflow-hidden rounded-[18px] text-left text-paper shadow-[0_50px_90px_-40px_rgb(0_0_0/0.65)] outline-none',
                    !active && 'cursor-pointer'
                  )}
                >
                  {/* Grano y luz */}
                  <span aria-hidden className="acc-panel__grain" />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgb(255_255_255/0.22),transparent_55%)]"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-20 -bottom-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
                    style={{ background: s.color }}
                  />

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
                      <span className="mono-label rounded-full border border-paper/30 px-2.5 py-0.5 text-paper/80">
                        paso {i + 1} / {STEPS.length}
                      </span>
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
                            <ul className="mt-5 flex flex-wrap gap-2">
                              {s.facts.map((f) => (
                                <li
                                  key={f}
                                  className="ui-label rounded-full border border-paper/30 bg-paper/10 px-3 py-1 text-paper"
                                >
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
                          active && !paused && !reduced && inView
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
          >
            <Chevron dir="prev" label="Anterior" />
          </button>
          <button
            type="button"
            onClick={() => go(step + 1)}
            aria-label="Paso siguiente"
            className="steps-arrow steps-arrow--next"
          >
            <Chevron dir="next" label="Siguiente" />
          </button>
        </div>

        {/* Figura en un plano inclinado + controles */}
        <div className="lg:col-span-5">
          <Figure step={step} reduced={reduced} color={current.color} />
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex gap-2" role="tablist" aria-label="Ir a un paso">
              {STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  role="tab"
                  aria-selected={i === step}
                  aria-label={`Paso ${i + 1}`}
                  onClick={() => go(i)}
                  className={cn(
                    'h-2.5 rounded-full transition-[width,background-color] duration-500 ease-(--ease-snap)',
                    i === step ? 'w-10' : 'w-2.5 bg-fg/25 hover:bg-fg/50'
                  )}
                  style={i === step ? { background: s.color } : undefined}
                />
              ))}
            </div>
            <span className="ui-label text-fg-muted">
              {paused
                ? 'En pausa mientras lees'
                : 'Avanza solo · usa las flechas o pulsa una tarjeta'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Nueve puntos sobre un plano inclinado que flota; se recomponen con GSAP según el paso. */
function Figure({ step, reduced, color }: { step: number; reduced: boolean; color: string }) {
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  const glow = useRef<(SVGCircleElement | null)[]>([]);
  const ring = useRef<SVGCircleElement>(null);
  const line = useRef<SVGLineElement>(null);
  const plane = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shape = SHAPES[step];
    const d = reduced ? 0 : 1.2;
    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut', duration: d } });
    dots.current.forEach((c, i) => {
      if (!c) return;
      tl.to(c, { attr: { cx: shape[i][0], cy: shape[i][1] } }, i * 0.045);
      const g = glow.current[i];
      if (g) tl.to(g, { attr: { cx: shape[i][0], cy: shape[i][1] } }, i * 0.045);
    });
    tl.to(
      ring.current,
      { drawSVG: step === 1 ? '100%' : '0%', opacity: step === 1 ? 1 : 0, duration: d * 0.8 },
      0.2
    );
    tl.to(
      line.current,
      { drawSVG: step === 2 ? '100%' : '0%', opacity: step === 2 ? 1 : 0, duration: d * 0.8 },
      0.2
    );
    // El plano se inclina distinto en cada paso, como si se girara la mesa
    if (plane.current && !reduced)
      tl.to(plane.current, { rotateX: 52 + step * 4, rotateZ: step * 12 - 12, duration: d }, 0);
    return () => {
      tl.kill();
    };
  }, [step, reduced]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[22rem] [perspective:900px]">
      {/* Anillo orbital decorativo, fuera del plano */}
      <span
        aria-hidden
        className="spin-slow pointer-events-none absolute inset-[6%] rounded-full border border-dashed border-line"
        style={{ '--spin-dur': '48s' } as React.CSSProperties}
      />
      <div
        className="float-y absolute inset-[8%] [transform-style:preserve-3d]"
        style={{ '--float-amp': '8px', '--float-dur': '7s' } as React.CSSProperties}
      >
        <div
          ref={plane}
          className="relative h-full w-full rounded-[24px] border border-line bg-surface-1 shadow-[0_40px_70px_-40px_rgb(var(--shadow-ink)/0.5)] [transform-style:preserve-3d]"
          style={{ transform: 'rotateX(52deg) rotateZ(-12deg)' }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[24px] opacity-40 blur-2xl transition-colors duration-700"
            style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 65%)` }}
          />
          <svg viewBox="0 0 100 100" className="relative h-full w-full" aria-hidden>
            <circle
              ref={ring}
              cx="50"
              cy="50"
              r="32"
              fill="none"
              stroke={color}
              strokeWidth="0.7"
              opacity="0"
            />
            <line
              ref={line}
              x1="8"
              y1="50"
              x2="92"
              y2="50"
              stroke={color}
              strokeWidth="0.7"
              opacity="0"
            />
            {SCATTER.map(([x, y], i) => (
              <circle
                key={`g${i}`}
                ref={(n) => {
                  glow.current[i] = n;
                }}
                cx={x}
                cy={y}
                r={i === 0 ? 6.5 : 5}
                fill={i === 0 ? 'var(--color-clay)' : color}
                opacity="0.28"
              />
            ))}
            {SCATTER.map(([x, y], i) => (
              <circle
                key={i}
                ref={(n) => {
                  dots.current[i] = n;
                }}
                cx={x}
                cy={y}
                r={i === 0 ? 2.8 : 2}
                fill={i === 0 ? 'var(--color-clay)' : 'var(--fg)'}
              />
            ))}
          </svg>
        </div>
      </div>
      {/* Sombra proyectada del plano */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-[16%] bottom-[4%] h-8 rounded-[100%] bg-fg/20 blur-xl"
      />
    </div>
  );
}
