'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { CardSwap, Card, type CardSwapHandle } from './CardSwap';
import { gsap } from '@/lib/gsap';
import { getQuality } from '@/lib/quality';
import { hasFinePointer } from '@/hooks/useReducedMotion';

type Art = 'steps' | 'network' | 'focus' | 'calendar' | 'route';
type FactKey = 'Requisito' | 'Título' | 'Cierre' | 'Recibes' | 'Ritmo';

interface LevelGuide {
  kind: 'level';
  key: string;
  tab: string;
  color: string;
  art: Art;
  title: string;
  text: string;
  facts: [FactKey, string][];
  /** Duración típica en años, sobre una regla de 0 a 5. */
  range: [number, number];
  rangeLabel: string;
  tip: string;
}

interface StepsGuide {
  kind: 'steps';
  key: string;
  tab: string;
  color: string;
  art: Art;
  title: string;
  steps: [string, string][];
  tip: string;
}

/**
 * Guía rápida del posgrado: contenido explicativo y fijo, no programas reales. Sirve para que
 * quien llega entienda en segundos qué distingue cada nivel. Cinco cartas, ni una más.
 */
const GUIDE: (LevelGuide | StepsGuide)[] = [
  {
    kind: 'level',
    key: 'Maestria',
    tab: 'Maestría',
    color: 'var(--color-violet-600)',
    art: 'steps',
    title: 'Profundiza en tu campo',
    text: 'Grado académico después de la licenciatura, orientado a la profesión o a la investigación.',
    facts: [
      ['Requisito', 'Licenciatura'],
      ['Título', 'Maestro/a'],
      ['Cierre', 'Tesis o proyecto'],
    ],
    range: [1, 3],
    rangeLabel: '1 a 3 años',
    tip: 'Las profesionales cierran con un proyecto aplicado; las académicas, con una tesis.',
  },
  {
    kind: 'level',
    key: 'Doctorado',
    tab: 'Doctorado',
    color: 'var(--color-violet-800)',
    art: 'network',
    title: 'Crea conocimiento nuevo',
    text: 'El grado más alto. Culmina con una investigación original defendida ante un tribunal.',
    facts: [
      ['Requisito', 'Maestría'],
      ['Título', 'Doctor/a'],
      ['Cierre', 'Tesis doctoral'],
    ],
    range: [3, 5],
    rangeLabel: '3 a 5 años',
    tip: 'Antes de postularte conviene llevar una idea de tema y un posible asesor.',
  },
  {
    kind: 'level',
    key: 'Especializacion',
    tab: 'Especialización',
    color: 'var(--color-indigo)',
    art: 'focus',
    title: 'Domina un área concreta',
    text: 'Formación técnica y aplicada para un campo específico de tu profesión.',
    facts: [
      ['Requisito', 'Licenciatura'],
      ['Título', 'Especialista'],
      ['Cierre', 'Caso práctico'],
    ],
    range: [0.5, 1.5],
    rangeLabel: '6 a 18 meses',
    tip: 'Pensada para quien ya ejerce y necesita una competencia puntual.',
  },
  {
    kind: 'level',
    key: 'Diplomado',
    tab: 'Diplomado',
    color: 'var(--color-mulberry)',
    art: 'calendar',
    title: 'Actualízate en poco tiempo',
    text: 'Curso corto y práctico. No otorga grado académico, pero sí un diploma universitario.',
    facts: [
      ['Requisito', 'Variable'],
      ['Recibes', 'Diploma'],
      ['Ritmo', 'Fines de semana'],
    ],
    range: [0.17, 0.5],
    rangeLabel: '2 a 6 meses',
    tip: 'Buena forma de probar un área antes de comprometerte con una maestría.',
  },
  {
    kind: 'steps',
    key: 'pasos',
    tab: 'Cómo empezar',
    color: 'var(--color-orchid)',
    art: 'route',
    title: 'Tres pasos para elegir',
    steps: [
      ['Elige el nivel', 'Según el tiempo que tienes y lo que buscas.'],
      ['Compara', 'Universidad, modalidad y duración, lado a lado.'],
      ['Escribe', 'La universidad te guía en la inscripción.'],
    ],
    tip: 'En el catálogo puedes marcar programas con la estrella y compararlos después.',
  },
];

/** Tiempo que cada carta queda al frente: el contenido pide unos segundos de lectura. */
const DELAY = 6500;
/** Inclinación de las cartas (grados). Poca: con tanto texto, más de 2° tuerce las filas. */
const SKEW = 2;

/**
 * Vitrina de la portada: una guía del posgrado en cartas grandes que se barajan solas. Se detienen
 * con el cursor encima o con el foco; un click en una carta del fondo la trae; las flechas del
 * teclado recorren el mazo. Luz que sigue al cursor e inclinación leve. Al llegar al frente, cada
 * carta despierta: su ilustración se dibuja y sus datos entran uno tras otro.
 *
 * El tamaño sale de CSS (unidades de contenedor): el mazo ocupa exactamente el mismo alto que
 * antes, así que la portada no se mueve, y el HTML del servidor ya trae cada carta en su sitio.
 */
export function GuideDeck() {
  const wrap = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const swap = useRef<CardSwapHandle>(null);

  // Inclinación del mazo y luz sobre la carta del frente, siguiendo al cursor
  useEffect(() => {
    const el = wrap.current;
    const t = tilt.current;
    if (!el || !t || getQuality() !== 'full' || !hasFinePointer()) return;
    const rx = gsap.quickTo(t, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(t, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    let frame = 0;
    let last: PointerEvent | null = null;
    const apply = () => {
      frame = 0;
      const e = last;
      if (!e) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rx(-py * 7);
      ry(px * 9);
      const card = el.querySelector<HTMLElement>('[data-front="true"] .guide-card');
      if (card) {
        const c = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${((e.clientX - c.left) / c.width) * 100}%`);
        card.style.setProperty('--my', `${((e.clientY - c.top) / c.height) * 100}%`);
        card.style.setProperty('--px', (px * 2).toFixed(3));
        card.style.setProperty('--py', (py * 2).toFixed(3));
      }
    };
    // Una lectura de layout por fotograma como mucho, aunque el mouse mande más eventos
    const move = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const leave = () => {
      last = null;
      rx(0);
      ry(0);
      el.querySelectorAll<HTMLElement>('.guide-card').forEach((c) => {
        c.style.setProperty('--px', '0');
        c.style.setProperty('--py', '0');
      });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      swap.current?.next();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      swap.current?.prev();
    }
  };

  return (
    <div className="guide">
      <div
        ref={wrap}
        className="guide-wrap"
        role="region"
        aria-roledescription="guía"
        aria-label="Guía rápida del posgrado. Usa las flechas del teclado para cambiar de carta."
        tabIndex={0}
        onKeyDown={onKey}
        onFocus={() => swap.current?.setHeld(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) swap.current?.setHeld(false);
        }}
      >
        <span
          className="deck-chip float-y top-0 left-0"
          style={{ '--float-dur': '6s' } as React.CSSProperties}
        >
          <span className="deck-chip__dot" aria-hidden /> Guía rápida del posgrado
        </span>
        <span
          className="deck-chip deck-chip--soft float-y top-0 right-0"
          style={{ '--float-dur': '7.5s', '--float-amp': '12px' } as React.CSSProperties}
        >
          Presencial · Virtual · Híbrida
        </span>

        <div ref={tilt} className="guide-tilt">
          <div className="guide-anchor">
            <CardSwap ref={swap} delay={DELAY} pauseOnHover skewAmount={SKEW} easing="elastic">
              {GUIDE.map((g, i) => (
                <Card
                  key={g.key}
                  customClass="guide-slot"
                  style={{ '--lv': g.color } as React.CSSProperties}
                >
                  <GuideCard g={g} index={i} />
                </Card>
              ))}
            </CardSwap>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideCard({ g, index }: { g: LevelGuide | StepsGuide; index: number }) {
  return (
    <div className="guide-card" data-art={g.art}>
      <span className="guide-card__grain" aria-hidden />
      <span className="guide-card__light" aria-hidden />
      <span className="guide-card__sweep" aria-hidden />

      <div className="gc">
        <div className="gc-top">
          <span className="gc-level">
            <span className="gc-level__dot" aria-hidden />
            {g.tab}
          </span>
          <span className="gc-index" aria-hidden>
            {String(index + 1).padStart(2, '0')}
            <span> / {String(GUIDE.length).padStart(2, '0')}</span>
          </span>
        </div>

        <div className="gc-hero">
          <div className="gc-copy">
            <p className="gc-title">{g.title}</p>
            {g.kind === 'level' && <p className="gc-text">{g.text}</p>}
          </div>
          <span className="gc-art" aria-hidden>
            <GuideArt art={g.art} />
          </span>
        </div>

        {g.kind === 'level' ? (
          <>
            <Meter range={g.range} label={g.rangeLabel} />
            <dl className="gc-facts">
              {g.facts.map(([k, v], i) => (
                <div key={k} className="gc-fact" style={{ '--i': i } as React.CSSProperties}>
                  <dt>
                    <FactIcon k={k} />
                    {k}
                  </dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <ol className="gc-steps">
            {g.steps.map(([t, d], i) => (
              <li key={t} className="gc-step" style={{ '--i': i } as React.CSSProperties}>
                <span className="gc-step__n" aria-hidden>
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="gc-step__t">{t}</span>
                  <span className="gc-step__d">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        )}

        <p className="gc-tip">
          <svg viewBox="0 0 24 24" aria-hidden className="gc-tip__icon">
            <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
          </svg>
          <span>{g.tip}</span>
        </p>
      </div>
    </div>
  );
}

/** Regla de 0 a 5 años con el tramo típico; se rellena cuando la carta llega al frente. */
function Meter({ range, label }: { range: [number, number]; label: string }) {
  const [a, b] = range;
  return (
    <div className="gc-meter" role="img" aria-label={`Duración típica: ${label}`}>
      <div className="gc-meter__head">
        <span className="gc-k">Duración típica</span>
        <span className="gc-meter__label">{label}</span>
      </div>
      <div className="gc-meter__rail">
        {[1, 2, 3, 4].map((t) => (
          <span key={t} className="gc-meter__tick" style={{ left: `${(t / 5) * 100}%` }} />
        ))}
        <span
          className="gc-meter__fill"
          style={{ left: `${(a / 5) * 100}%`, width: `${((b - a) / 5) * 100}%` }}
        />
      </div>
      <div className="gc-meter__scale" aria-hidden>
        {[0, 1, 2, 3, 4, 5].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

const FACT_ICON: Record<FactKey, ReactNode> = {
  // Birrete: lo que hay que tener antes
  Requisito: (
    <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9ZM6.5 11v4.2c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V11" />
  ),
  // Medalla: el grado que se obtiene
  Título: (
    <path d="M12 14.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.7 13.3 7.5 20.5l4.5-2.6 4.5 2.6-1.2-7.2" />
  ),
  Recibes: (
    <path d="M12 14.5a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM8.7 13.3 7.5 20.5l4.5-2.6 4.5 2.6-1.2-7.2" />
  ),
  // Documento con visto: cómo se cierra
  Cierre: <path d="M7 3h7.5L19 7.5V21H7V3ZM14 3v5h5M9.8 14.2l2 2 3.8-4" />,
  // Calendario: cuándo hay clases
  Ritmo: <path d="M4 6.5h16V20H4V6.5ZM4 10.5h16M8.5 4v4M15.5 4v4M14 15h3" />,
};

function FactIcon({ k }: { k: FactKey }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="gc-fact__icon">
      {FACT_ICON[k]}
    </svg>
  );
}

/**
 * Ilustración de cada carta, en trazo blanco. Solo se anima la de la carta del frente (CSS con
 * [data-front]); las del fondo quedan quietas y no gastan nada.
 */
function GuideArt({ art }: { art: Art }) {
  switch (art) {
    // Maestría: escalones que suben y un punto que los va saltando hasta la bandera
    case 'steps':
      return (
        <svg viewBox="0 0 160 120" className="ga ga--steps">
          <path className="ga-base" d="M6 108h148" />
          {[
            [16, 86, 22],
            [48, 68, 40],
            [80, 50, 58],
            [112, 30, 78],
          ].map(([x, y, h], i) => (
            <rect
              key={x}
              className="ga-bar"
              x={x}
              y={y}
              width="26"
              height={h}
              rx="5"
              style={{ '--k': i } as React.CSSProperties}
            />
          ))}
          <path
            className="ga-trail"
            pathLength={1}
            d="M29 80Q45 56 61 62Q77 38 93 44Q109 18 125 24"
          />
          <path className="ga-flag" d="M134 30V8l14 5-14 5" />
          <circle className="ga-dot ga-dot--hop" r="5" />
        </svg>
      );
    // Doctorado: una red de ideas conocidas y un nodo nuevo que se enciende en el borde
    case 'network': {
      const nodes: [number, number][] = [
        [22, 88],
        [50, 60],
        [84, 76],
        [66, 28],
        [106, 48],
        [98, 102],
      ];
      const links: [number, number][] = [
        [0, 1],
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 4],
        [2, 5],
        [0, 5],
      ];
      return (
        <svg viewBox="0 0 160 120" className="ga ga--network">
          {links.map(([a, b], i) => (
            <path
              key={`${a}-${b}`}
              className="ga-link"
              pathLength={1}
              d={`M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}`}
              style={{ '--k': i } as React.CSSProperties}
            />
          ))}
          <path className="ga-link ga-link--new" pathLength={1} d="M106 48L140 22" />
          {nodes.map(([x, y], i) => (
            <circle
              key={i}
              className="ga-node"
              cx={x}
              cy={y}
              r="4"
              style={{ '--k': i } as React.CSSProperties}
            />
          ))}
          <circle className="ga-pulse" cx="140" cy="22" r="7" />
          <circle className="ga-new" cx="140" cy="22" r="7" />
          <path className="ga-spark" d="M140 13v-5M140 36v-5M149 22h5M126 22h5" />
        </svg>
      );
    }
    // Especialización: un visor que enfoca un punto concreto
    case 'focus':
      return (
        <svg viewBox="0 0 160 120" className="ga ga--focus">
          <circle className="ga-ring ga-ring--outer" cx="80" cy="60" r="50" />
          <circle className="ga-ring" cx="80" cy="60" r="33" />
          <circle className="ga-ring ga-ring--lens" cx="80" cy="60" r="17" />
          <path className="ga-cross" d="M80 2v16M80 102v16M18 60h16M126 60h16" />
          <path className="ga-bracket" d="M52 40v-8h8M100 32h8v8M108 80v8h-8M60 88h-8v-8" />
          <circle className="ga-core" cx="80" cy="60" r="4.5" />
        </svg>
      );
    // Diplomado: pocas semanas, y las clases caen en fin de semana
    case 'calendar':
      return (
        <svg viewBox="0 0 160 120" className="ga ga--calendar">
          <rect className="ga-frame" x="8" y="6" width="144" height="108" rx="12" />
          <path className="ga-rule" d="M8 30h144" />
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, c) => (
            <text key={c} className="ga-day" x={24 + c * 18.7} y="22" textAnchor="middle">
              {l}
            </text>
          ))}
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 7 }, (_, c) => {
              const weekend = c >= 5;
              return (
                <rect
                  key={`${r}-${c}`}
                  className={weekend ? 'ga-cell ga-cell--on' : 'ga-cell'}
                  x={17 + c * 18.7}
                  y={40 + r * 18}
                  width="14"
                  height="12"
                  rx="3"
                  style={weekend ? ({ '--k': r * 2 + (c - 5) } as React.CSSProperties) : undefined}
                />
              );
            })
          )}
        </svg>
      );
    // Cómo empezar: una ruta con tres paradas y alguien que la recorre
    case 'route':
      return (
        <svg viewBox="0 0 160 120" className="ga ga--route">
          <path className="ga-road" d="M10 104C40 104 36 70 62 68S92 40 112 38 142 20 152 12" />
          <circle className="ga-start" cx="10" cy="104" r="3.5" />
          <g className="ga-pin">
            <path d="M152 16s-8-6.4-8-12a8 8 0 0 1 16 0c0 5.6-8 12-8 12Z" />
            <circle cx="152" cy="3.6" r="2.8" />
          </g>
          {[
            [30, 98],
            [84, 56],
            [136, 24],
          ].map(([x, y], i) => (
            <g key={i} className="ga-stop" style={{ '--k': i } as React.CSSProperties}>
              <circle cx={x} cy={y} r="10" />
              <text x={x} y={y + 3.6} textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
          <circle className="ga-dot ga-dot--walk" r="4.5" />
        </svg>
      );
  }
}
