'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'motion/react';
import TearTicket from '@/components/fx/TearTicket';
import { DepthText } from '@/components/fx/DepthText';
import { mediaUrl } from '@/lib/api';
import { ACTIVITY_LABEL, acronymOf, formatDate } from '@/lib/format';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE, stagger } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { Activity, ActivityType } from '@/lib/types';
import { DEEP, PALETTE } from '@/lib/palette';

const TYPES: ActivityType[] = ['Encuentro', 'Conferencia', 'Seminario', 'Reunion', 'Proyecto'];

/** Tinta de cada tipo de actividad: el boleto y su talón se imprimen con ella. */
const INK: Record<ActivityType, { bg: string; stub: string; accent: string }> = {
  Encuentro: { bg: DEEP.sage, stub: PALETTE.sage, accent: PALETTE.sage2 },
  Conferencia: { bg: DEEP.lilac, stub: PALETTE.lilac, accent: PALETTE.lilac2 },
  Seminario: { bg: DEEP.clay, stub: PALETTE.clay2, accent: PALETTE.clay },
  Reunion: { bg: DEEP.sky, stub: '#4b4aa8', accent: PALETTE.sky },
  Proyecto: { bg: DEEP.coral, stub: '#8e4fb8', accent: PALETTE.coral },
};

const DAY = new Intl.DateTimeFormat('es-GT', { day: '2-digit' });
const MON = new Intl.DateTimeFormat('es-GT', { month: 'short' });
const YEAR = new Intl.DateTimeFormat('es-GT', { year: 'numeric' });

/**
 * Actividades del Foro como boletos (React Bits `TearTicket`): cada actividad es una entrada con
 * su talón —fecha grande, tipo— que se puede arrancar arrastrándolo; al arrancarlo se abre la
 * actividad. El boleto se inclina con el puntero y la foto tiene parallax. Arriba, filtros por
 * tipo y el conteo de próximas/anteriores.
 */
export function ActivitiesBoard({ activities }: { activities: Activity[] }) {
  const [type, setType] = useState<ActivityType | 'all'>('all');
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(
    () => (type === 'all' ? activities : activities.filter((a) => a.type === type)),
    [activities, type]
  );
  const upcoming = filtered.filter((a) => a.date >= today).reverse();
  const past = filtered.filter((a) => a.date < today);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: activities.length };
    TYPES.forEach((t) => (c[t] = activities.filter((a) => a.type === t).length));
    return c;
  }, [activities]);

  return (
    <div className="space-y-16">
      {/* Filtros por tipo, como taquilla */}
      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Tipo de actividad"
      >
        <Pill active={type === 'all'} onClick={() => setType('all')} color="var(--fg)">
          Todas <span className="mono-label opacity-70">{counts.all}</span>
        </Pill>
        {TYPES.map((t) => (
          <Pill key={t} active={type === t} onClick={() => setType(t)} color={INK[t].accent}>
            {ACTIVITY_LABEL[t]} <span className="mono-label opacity-70">{counts[t]}</span>
          </Pill>
        ))}
        <span className="ui-label ml-auto text-fg-muted">
          Pulsa un boleto para abrirlo (o arranca su talón)
        </span>
      </div>

      <Group id="proximas" heading="Próximas" items={upcoming} empty="Nada programado por ahora." />
      <Group
        id="anteriores"
        heading="Anteriores"
        items={past}
        empty="Ninguna actividad anterior con este filtro."
      />
    </div>
  );
}

function Group({
  id,
  heading,
  items,
  empty,
}: {
  id: string;
  heading: string;
  items: Activity[];
  empty: string;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
        <h2
          id={id}
          className="flex items-baseline gap-3 text-[clamp(1.6rem,3vw,2.4rem)] leading-none"
        >
          {heading}
          <DepthText
            text={String(items.length)}
            layers={10}
            depth={1}
            fontSize="1.6rem"
            tilt={7}
            depthColor="var(--accent-lilac)"
            orbitSpeed={0.2}
            fontVariationSettings="'opsz' 32, 'WONK' 1"
          />
        </h2>
      </div>
      {items.length ? (
        <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2 [perspective:1600px]">
          <AnimatePresence initial={false}>
            {items.map((a, i) => (
              <Ticket key={a.documentId} a={a} i={i} />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="py-8 text-fg-muted">{empty}</p>
      )}
    </section>
  );
}

function Ticket({ a, i }: { a: Activity; i: number }) {
  const router = useRouter();
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  const reduced = useReducedMotion();
  const ink = INK[a.type];
  const cover = mediaUrl(a.coverImage?.formats?.medium?.url ?? a.coverImage?.url);
  const d = new Date(`${a.date}T12:00:00`);
  const unis = (a.participatingUniversities ?? []).map(acronymOf);
  const href = `/actividades/${a.documentId}`;

  return (
    <motion.li
      ref={ref}
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, rotateX: -28, y: 40 }}
      animate={inView ? { opacity: 1, rotateX: 0, y: 0 } : undefined}
      exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.9, ease: EASE.premium, delay: stagger(i % 8, 0.05) }}
      className="[transform-style:preserve-3d]"
    >
      <TearTicket
        width={640}
        height={280}
        stubSize={150}
        radius={12}
        holes={11}
        holeSize={6}
        notch={4}
        roughness={0.6}
        tilt
        tiltMax={8}
        tiltReach={220}
        parallax={8}
        rotate={0}
        background={ink.bg}
        stubBackground={ink.stub}
        color="#fdfcff"
        image={cover ?? ''}
        imageAlt=""
        scrim
        imageRadius={10}
        border
        onTear={() => router.push(href)}
        ariaLabel={`Arrancar el talón y abrir ${a.title}`}
        stub={
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-paper">
            <span className="mono-label uppercase opacity-70">
              {MON.format(d).replace('.', '')}
            </span>
            <span
              className="font-display text-[3.2rem] leading-none"
              style={{ fontVariationSettings: "'opsz' 96, 'WONK' 1" }}
            >
              {DAY.format(d)}
            </span>
            <span className="mono-label opacity-70">{YEAR.format(d)}</span>
            <span
              className="mt-3 rounded-[4px] border border-paper/40 px-2 py-0.5 text-[0.66rem] font-semibold tracking-[0.08em] uppercase"
              style={{ color: ink.accent }}
            >
              Tira ⤴
            </span>
          </div>
        }
      >
        <Link href={href} className="group flex h-full flex-col justify-end p-5 text-paper md:p-6">
          <span className="flex items-center gap-2">
            <span
              className="rounded-[4px] px-2 py-0.5 text-[0.68rem] font-semibold tracking-[0.07em] text-ink uppercase"
              style={{ background: ink.accent }}
            >
              {ACTIVITY_LABEL[a.type]}
            </span>
            <span className="mono-label text-paper/70">{formatDate(a.date)}</span>
          </span>
          <span
            className="mt-3 block max-w-[22ch] font-display text-[clamp(1.35rem,2.2vw,1.8rem)] leading-[1.06] text-paper underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-500 group-hover:decoration-current"
            style={{ fontVariationSettings: "'opsz' 48, 'SOFT' 30, 'WONK' 1" }}
          >
            {a.title}
          </span>
          {unis.length > 0 && (
            <span className="mono-label mt-3 block truncate text-paper/70">{unis.join(' · ')}</span>
          )}
          <span className="ui-label mt-4 inline-flex w-fit items-center gap-2 border-b border-paper/40 pb-0.5 text-paper transition-[border-color] duration-300 group-hover:border-paper">
            Ver actividad{' '}
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </Link>
      </TearTicket>
    </motion.li>
  );
}

function Pill({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'ui-label inline-flex items-center gap-2 rounded-[6px] border px-3.5 py-2 transition-[background-color,border-color,color,transform] duration-300 ease-(--ease-snap) hover:-translate-y-0.5',
        active ? 'border-fg bg-fg text-bg' : 'border-fg/20 bg-white text-fg hover:border-fg/40'
      )}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-[2px]"
        style={{ background: active ? 'var(--color-paper)' : color }}
      />
      {children}
    </button>
  );
}
