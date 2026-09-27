'use client';

import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/lib/motion';
import { DepthText } from '@/components/fx/DepthText';
import { Tilt } from '@/components/fx/Tilt';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { LEVEL_LABEL } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { ProgramLevel } from '@/lib/types';

export type LevelFilter = ProgramLevel | 'all' | 'saved';

interface Props {
  value: LevelFilter;
  onChange: (v: LevelFilter) => void;
  /** Cuántos programas hay por nivel (para mostrar el número en cada pestaña). */
  counts: Record<ProgramLevel, number> & { all: number; saved: number };
  /** Muestra la pestaña "Guardados" aunque esté vacía. */
  showSaved?: boolean;
  className?: string;
  /** Compacto: sin la línea de explicación (para barras de filtro densas). */
  compact?: boolean;
}

/**
 * Selector de nivel en 3D: cada nivel es una losa que se inclina con el puntero (Tilt) y cuyo
 * nombre está apilado en capas con volumen (DepthText, las letras "sobrepuestas"); dentro,
 * cuántos programas hay y una línea que explica qué es. La losa activa se llena con el color
 * del nivel y el fondo se desliza entre pestañas con un spring.
 */
export function LevelTabs({ value, onChange, counts, showSaved, className, compact }: Props) {
  const reduced = useReducedMotion();
  const tabs: {
    key: LevelFilter;
    label: string;
    hint: string;
    span?: string;
    color: string;
    glyph: string;
  }[] = [
    {
      key: 'all',
      label: 'Todos',
      hint: 'Toda la oferta de las nueve universidades.',
      color: 'var(--color-ink-2)',
      glyph: '∗',
    },
    ...LEVELS.map((l) => ({
      key: l as LevelFilter,
      label: LEVEL_META[l].plural,
      hint: LEVEL_META[l].hint,
      span: LEVEL_META[l].span,
      color: LEVEL_META[l].color,
      glyph: LEVEL_META[l].glyph,
    })),
  ];
  if (showSaved || counts.saved > 0)
    tabs.push({
      key: 'saved',
      label: 'Guardados',
      hint: 'Los que marcaste con la estrella para comparar.',
      color: 'var(--color-clay-2)',
      glyph: '★',
    });

  return (
    <div
      role="tablist"
      aria-label="Nivel de posgrado"
      className={cn(
        'grid gap-3 sm:grid-cols-3 [perspective:1200px]',
        tabs.length === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5',
        className
      )}
    >
      {tabs.map((t, i) => {
        const active = value === t.key;
        const n = counts[t.key as keyof typeof counts] ?? 0;
        return (
          <motion.div
            key={t.key}
            initial={reduced ? false : { opacity: 0, y: 46, rotateX: -50, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ duration: 1, ease: EASE.premium, delay: i * 0.08 }}
            style={{ transformOrigin: '50% 100%' }}
          >
            <Tilt
              max={10}
              scale={1.03}
              className="rounded-[10px]"
              style={{ '--z': 30 } as React.CSSProperties}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(t.key)}
                className={cn(
                  'group relative isolate flex h-full w-full flex-col justify-between overflow-hidden rounded-[10px] border p-4 text-left transition-[border-color] duration-500',
                  compact ? 'min-h-[7rem]' : 'min-h-[9.5rem]',
                  active
                    ? 'border-transparent text-paper'
                    : 'border-line bg-surface-1 text-fg hover:border-fg/40'
                )}
                style={{ '--lv': t.color } as React.CSSProperties}
              >
                {active && (
                  <motion.span
                    layoutId="level-tab-bg"
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-[10px]"
                    style={{
                      background:
                        'linear-gradient(140deg, var(--lv), color-mix(in oklab, var(--lv) 60%, var(--color-ink)))',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 32 }}
                  />
                )}
                {/* Luz superior para que la losa tenga volumen */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-[5] bg-[radial-gradient(circle_at_15%_0%,rgb(255_255_255/0.28),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ opacity: active ? 1 : undefined }}
                />
                {/* Inicial enorme como marca de agua, también con profundidad */}
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute -right-3 -bottom-7 select-none transition-opacity duration-500',
                    active ? 'opacity-30' : 'opacity-[0.08] group-hover:opacity-[0.18]'
                  )}
                >
                  <DepthText
                    text={t.glyph}
                    layers={10}
                    depth={1.2}
                    faceColor={active ? 'var(--color-paper)' : 'var(--fg)'}
                    depthColor={active ? 'var(--color-ink)' : 'var(--lv)'}
                    fontSize="6rem"
                    tilt={4}
                    shadow={false}
                    pointerTracking={false}
                    orbitSpeed={0.12}
                    fontVariationSettings="'opsz' 144, 'SOFT' 80"
                  />
                </span>

                <span
                  className="flex items-center justify-between gap-2"
                  data-depth
                  style={{ '--z': 14 } as React.CSSProperties}
                >
                  <span
                    className={cn(
                      'inline-block h-2.5 w-2.5 rounded-full',
                      active ? 'bg-paper' : 'bg-[var(--lv)]'
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      'mono-label rounded-full px-2 py-0.5',
                      active ? 'bg-paper/20 text-paper' : 'bg-surface-3 text-fg-muted'
                    )}
                  >
                    {n}
                  </span>
                </span>

                <span data-depth style={{ '--z': 34 } as React.CSSProperties}>
                  <DepthText
                    text={t.label}
                    layers={active ? 16 : 10}
                    depth={active ? 1.1 : 0.8}
                    faceColor={active ? 'var(--color-paper)' : 'var(--fg)'}
                    depthColor={
                      active ? 'color-mix(in oklab, var(--lv) 40%, var(--color-ink))' : 'var(--lv)'
                    }
                    fontSize="clamp(1.35rem, 1.6vw, 1.7rem)"
                    tilt={6}
                    shadow={active}
                    orbitSpeed={0.18}
                    fontVariationSettings="'opsz' 40, 'SOFT' 30, 'WONK' 1"
                    letterSpacing="-0.02em"
                  />
                  {!compact && (
                    <span
                      className={cn(
                        'ui-label mt-1.5 block max-w-[24ch] leading-snug',
                        active ? 'text-paper/80' : 'text-fg-muted'
                      )}
                    >
                      {t.hint}
                      {t.span ? ` · ${t.span}.` : ''}
                    </span>
                  )}
                </span>
              </button>
            </Tilt>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Cuenta programas por nivel para alimentar las pestañas. */
export function countByLevel<T extends { level: ProgramLevel; documentId: string }>(
  programs: T[],
  saved: string[]
) {
  const c = { all: programs.length, saved: 0 } as Record<ProgramLevel, number> & {
    all: number;
    saved: number;
  };
  LEVELS.forEach((l) => (c[l] = 0));
  programs.forEach((p) => {
    c[p.level] += 1;
    if (saved.includes(p.documentId)) c.saved += 1;
  });
  return c;
}

export { LEVEL_LABEL };
