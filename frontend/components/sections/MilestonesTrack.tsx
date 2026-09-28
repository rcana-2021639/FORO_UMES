'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { getQuality, useQuality } from '@/lib/quality';
import { hasFinePointer, useReducedMotion } from '@/hooks/useReducedMotion';
import { formatDate, yearOf } from '@/lib/format';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/cn';
import { brandOf } from '@/lib/universities';
import type { Milestone } from '@/lib/milestones';

/** Color de cada tipo de hito, siempre dentro de la familia violeta. */
const TONE: Record<string, string> = {
  Ingreso: 'var(--color-violet-800)',
  Encuentro: 'var(--color-violet-600)',
  Conferencia: 'var(--color-indigo)',
  Seminario: 'var(--color-orchid)',
  Reunión: 'var(--color-plum)',
  Proyecto: 'var(--color-mulberry)',
};

const DAY = new Intl.DateTimeFormat('es-GT', { day: '2-digit' });
const MONTH = new Intl.DateTimeFormat('es-GT', { month: 'short' });
const asDate = (iso: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);

/**
 * Hitos del Foro como una línea de tiempo horizontal. En modo completo la sección se fija y el
 * scroll vertical desplaza la pista de lado: las tarjetas se alternan arriba y abajo de una
 * línea que se va encendiendo; la más cercana al centro se adelanta en 3D y las demás se
 * curvan hacia atrás; al fondo, el año del hito activo, enorme. Una marca "Hoy" separa lo que
 * ya pasó de lo que viene. En modo liviano o con menos movimiento es una tira con scroll-snap.
 *
 * Cada tarjeta entra atada a la línea (script de arranque, data-reveal): el punto aparece con un
 * rebote, el tallo crece desde la línea y la tarjeta se despliega sobre él como la página de un
 * libro desplegable. Al pasar el cursor se inclina hacia él con un brillo, una chispa baja por el
 * tallo hasta la línea y el icono de su tipo hace lo suyo; en los ingresos, la tarjeta se tiñe
 * del color de la universidad y su sello cae como un timbre.
 */
export function MilestonesTrack({ milestones }: { milestones: Milestone[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const quality = useQuality();
  const reduced = useReducedMotion();
  const pinned = quality === 'full' && !reduced;
  const [active, setActive] = useState(0);

  // Posición de "Hoy": después del último hito que ya ocurrió
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const pastCount = milestones.filter((m) => m.date.slice(0, 10) <= today).length;

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!pinned || !el || !tr || milestones.length < 2) return;
    // En pantallas angostas la pista se recorre con el dedo, sin fijar la sección
    if (window.innerWidth < 900) return;

    const cards = gsap.utils.toArray<HTMLElement>('[data-ms-card]', tr);
    // Centro de cada tarjeta dentro de la pista: se mide solo al refrescar, no en cada fotograma
    let centers: number[] = [];
    const measure = () => {
      centers = cards.map((card) => {
        const wrap = card.querySelector<HTMLElement>('.ms-card-wrap');
        return card.offsetLeft + (wrap ? wrap.offsetLeft + wrap.offsetWidth / 2 : 0);
      });
    };
    let last = -1;

    // Cuánto dista cada tarjeta del centro de la pantalla → curva 3D, parallax y tarjeta activa.
    // Solo corre mientras la pista se mueve (onUpdate del tween), sin lecturas de layout.
    const tick = () => {
      const c = window.innerWidth / 2;
      const x = Number(gsap.getProperty(tr, 'x')) || 0;
      let best = 0;
      let bestD = Infinity;
      cards.forEach((card, i) => {
        const d = (centers[i] + x - c) / c; // -1 … 1 aprox.
        const ad = Math.abs(d);
        if (ad < bestD) {
          bestD = ad;
          best = i;
        }
        const k = Math.max(-1.4, Math.min(1.4, d));
        card.style.setProperty('--d', k.toFixed(3));
        card.style.setProperty('--ad', Math.min(1, Math.abs(k)).toFixed(3));
      });
      if (best !== last) {
        last = best;
        setActive(best);
      }
    };

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth);
      gsap.to(tr, {
        x: () => -distance(),
        ease: 'none',
        onUpdate: tick,
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onRefresh: () => {
            measure();
            tick();
          },
          onUpdate: (self) => {
            if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
    }, el);
    measure();
    tick();
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [pinned, milestones.length]);

  // La tarjeta bajo el cursor se inclina hacia él y lleva un brillo donde está el puntero. Un
  // solo listener para toda la pista y como mucho una escritura de estilo por fotograma.
  useEffect(() => {
    const tr = track.current;
    if (!tr || !hasFinePointer() || getQuality() === 'still') return;
    const tilt = getQuality() === 'full';
    let frame = 0;
    let target: HTMLElement | null = null;
    let point = { x: 0, y: 0 };
    const reset = (w: HTMLElement) => {
      w.style.setProperty('--rx', '0deg');
      w.style.setProperty('--ry', '0deg');
    };
    const apply = () => {
      frame = 0;
      if (!target) return;
      const card = target.querySelector<HTMLElement>('.ms-card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (point.x - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (point.y - r.top) / r.height));
      target.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      target.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      if (tilt) {
        target.style.setProperty('--rx', `${((0.5 - py) * 12).toFixed(2)}deg`);
        target.style.setProperty('--ry', `${((px - 0.5) * 16).toFixed(2)}deg`);
      }
    };
    const move = (e: PointerEvent) => {
      const wrap = (e.target as HTMLElement).closest<HTMLElement>('.ms-card-wrap');
      if (wrap !== target) {
        if (target) reset(target);
        target = wrap;
      }
      point = { x: e.clientX, y: e.clientY };
      if (target && !frame) frame = requestAnimationFrame(apply);
    };
    const leave = () => {
      if (target) reset(target);
      target = null;
    };
    tr.addEventListener('pointermove', move);
    tr.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(frame);
      tr.removeEventListener('pointermove', move);
      tr.removeEventListener('pointerleave', leave);
    };
  }, []);

  if (!milestones.length) {
    return (
      <p className="container-x text-fg-muted">
        La línea de tiempo empieza con la primera actividad publicada. Todavía no hay ninguna.
      </p>
    );
  }

  const current = milestones[active] ?? milestones[0];
  const year = yearOf(current.date);

  return (
    <div ref={root} className={cn('ms', pinned ? 'ms--pinned' : 'ms--strip')}>
      {/* Año del hito activo, enorme y en contorno, detrás de todo */}
      <div aria-hidden className="ms-year" data-reveal="fade">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={year}
            initial={{ y: '40%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            exit={{ y: '-40%', opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE.premium }}
          >
            {year}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="ms-viewport">
        <ol ref={track} className="ms-track" aria-label="Hitos del Foro, en orden cronológico">
          <span aria-hidden className="ms-line">
            <span ref={fill} className="ms-line__fill" />
          </span>
          {milestones.map((m, i) => (
            <Card
              key={m.key}
              m={m}
              i={i}
              side={i % 2 === 0 ? 'top' : 'bottom'}
              active={pinned && i === active}
              passed={pinned && i <= active}
              upcoming={i >= pastCount}
              todayBefore={i === pastCount && pastCount > 0}
            />
          ))}
          {pastCount === milestones.length && (
            <li aria-hidden className="ms-today ms-today--end">
              <span data-reveal="pop">Hoy</span>
            </li>
          )}
        </ol>
      </div>

      {/* Contador y leyenda: dónde va el recorrido */}
      <div className="ms-hud container-x" aria-hidden={!pinned} data-reveal="up">
        <span className="ms-hud__count">
          <span className="ms-hud__now">{String(active + 1).padStart(2, '0')}</span>
          <span className="opacity-50"> / {String(milestones.length).padStart(2, '0')}</span>
        </span>
        <span className="ms-hud__label">
          <span className="ms-hud__dot" style={{ background: TONE[current.label] }} />
          {current.label} · {formatDate(current.date)}
        </span>
        <span className="ms-hud__hint">
          {pinned ? 'Sigue bajando para recorrer la línea' : 'Desliza para recorrer la línea'}
        </span>
      </div>
    </div>
  );
}

function Card({
  m,
  i,
  side,
  active,
  passed,
  upcoming,
  todayBefore,
}: {
  m: Milestone;
  i: number;
  side: 'top' | 'bottom';
  active: boolean;
  passed: boolean;
  upcoming: boolean;
  todayBefore: boolean;
}) {
  const d = asDate(m.date);
  const tone = TONE[m.label] ?? 'var(--color-violet-600)';
  const uni = m.kind === 'university';
  // Los ingresos llevan el color de su universidad (solo al pasar el cursor, como las losas)
  const brand = uni ? brandOf(m.unis[0]) : null;
  const body = (
    <>
      <span className="ms-card__media">
        {m.image && !uni ? (
          <>
            <Image src={m.image} alt="" fill sizes="360px" className="ms-card__img object-cover" />
            <span className="ms-card__shade" aria-hidden />
            <span className="ms-card__peek" aria-hidden>
              Ver actividad <span>→</span>
            </span>
          </>
        ) : (
          <span className="ms-card__art" aria-hidden>
            {uni && <span className="ms-card__flood" />}
            <span className="ms-card__big">{uni ? m.unis[0] : m.label}</span>
            {uni && m.image && (
              <span className="ms-card__seal">
                <Image src={m.image} alt="" fill sizes="96px" className="object-contain" />
              </span>
            )}
          </span>
        )}
        <span className="ms-card__chip">
          <TypeGlyph label={m.label} />
          {upcoming ? 'Próximo · ' : ''}
          {m.label}
        </span>
      </span>
      <span className="ms-card__body">
        <span className="ms-card__title">{m.title}</span>
        {m.summary && <span className="ms-card__summary">{m.summary}</span>}
        {m.unis.length > 0 && !uni && (
          <span className="ms-card__unis">
            {m.unis.slice(0, 4).map((u) => (
              <span key={u}>{u}</span>
            ))}
            {m.unis.length > 4 && <span>+{m.unis.length - 4}</span>}
          </span>
        )}
      </span>
      <span className="ms-card__glare" aria-hidden />
    </>
  );

  return (
    <li
      data-ms-card
      data-side={side}
      data-kind={m.kind}
      data-reveal-group
      className={cn(
        'ms-item',
        active && 'is-active',
        passed && 'is-passed',
        upcoming && 'is-upcoming'
      )}
      style={
        {
          '--tone': tone,
          '--i': i,
          ...(brand ? { '--brand': brand.surface, '--brand-accent': brand.accent } : {}),
        } as React.CSSProperties
      }
    >
      {todayBefore && (
        <span aria-hidden className="ms-today">
          <span data-reveal="pop">Hoy</span>
        </span>
      )}
      {/* Nodo sobre la línea con la fecha */}
      <span aria-hidden className="ms-node">
        <span className="ms-node__dot" data-reveal="ms-dot" />
        <span className="ms-node__date" data-reveal="ms-date">
          <b>{DAY.format(d)}</b> {MONTH.format(d).replace('.', '')}
        </span>
      </span>
      <span aria-hidden className="ms-stem" data-reveal="ms-stem" />
      <div className="ms-card-wrap" data-reveal="ms-card">
        {m.href ? (
          <Link href={m.href} className="ms-card group">
            {body}
          </Link>
        ) : (
          <div className="ms-card">{body}</div>
        )}
      </div>
    </li>
  );
}

/**
 * Icono de cada tipo de hito, con su propio gesto al pasar el cursor (o cuando la tarjeta es la
 * activa): el sello se estampa, las dos personas se encuentran, el micrófono emite ondas, el
 * libro pasa una página, los puestos rodean la mesa y el proyecto despega.
 */
function TypeGlyph({ label }: { label: string }) {
  const common = {
    viewBox: '0 0 16 16',
    'aria-hidden': true,
    className: `ms-glyph ms-glyph--${GLYPH_KEY[label] ?? 'dot'}`,
  } as const;
  switch (GLYPH_KEY[label]) {
    case 'seal':
      return (
        <svg {...common}>
          <circle className="g-ring" cx="8" cy="8" r="5.6" />
          <path className="g-check" pathLength={1} d="M5.6 8.2l1.7 1.7 3.2-3.5" />
        </svg>
      );
    case 'meet':
      return (
        <svg {...common}>
          <circle className="g-a" cx="5.4" cy="8" r="3.3" />
          <circle className="g-b" cx="10.6" cy="8" r="3.3" />
        </svg>
      );
    case 'talk':
      return (
        <svg {...common}>
          <rect x="6" y="2.4" width="4" height="7" rx="2" />
          <path d="M4 8a4 4 0 0 0 8 0M8 12v1.8" />
          <path className="g-w g-w1" d="M13.4 5.4a4 4 0 0 1 0 5.2" />
          <path className="g-w g-w2" d="M2.6 5.4a4 4 0 0 0 0 5.2" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M8 4.6C6.5 3.6 4 3.4 2.4 3.9v8.3c1.6-.5 4.1-.3 5.6.7M8 4.6v8.3" />
          <path className="g-page" d="M8 4.6c1.5-1 4-1.2 5.6-.7v8.3c-1.6-.5-4.1-.3-5.6.7" />
        </svg>
      );
    case 'table':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.4" />
          <g className="g-seats">
            <circle cx="8" cy="2.6" r="1.1" />
            <circle cx="13.4" cy="8" r="1.1" />
            <circle cx="8" cy="13.4" r="1.1" />
            <circle cx="2.6" cy="8" r="1.1" />
          </g>
        </svg>
      );
    case 'launch':
      return (
        <svg {...common}>
          <g className="g-arrow">
            <path d="M4.2 11.8 11.4 4.6M6.6 4.4h5v5" />
          </g>
          <path className="g-trail" d="M2.4 13.6l1.2-1.2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3" />
        </svg>
      );
  }
}

const GLYPH_KEY: Record<string, string> = {
  Ingreso: 'seal',
  Encuentro: 'meet',
  Conferencia: 'talk',
  Seminario: 'book',
  Reunión: 'table',
  Proyecto: 'launch',
};
