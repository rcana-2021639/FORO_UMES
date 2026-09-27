'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PulseStar } from '@/components/ui/PulseStar';
import { LevelTabs, countByLevel, type LevelFilter } from '@/components/ui/LevelTabs';
import { useSavedPrograms } from '@/hooks/useSavedPrograms';
import { LEVEL_LABEL, MODALITY_LABEL, acronymOf } from '@/lib/format';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { AcademicProgram, ProgramModality } from '@/lib/types';

const MODALITIES: ProgramModality[] = ['Presencial', 'Virtual', 'Hibrida'];

/** Posición de salida al repartir: desde abajo, inclinada hacia atrás y girada según su columna. */
const dealFrom = (i: number) => ({
  opacity: 0,
  y: 70,
  rotateX: -38,
  rotateZ: [-3, 0, 3][i % 3],
  scale: 0.94,
});
/** Retardo por columna y fila, con tope para que las listas largas no esperen de más. */
const dealDelay = (i: number) => Math.min((i % 3) * 0.08 + Math.floor(i / 3) * 0.06, 0.7);

/**
 * Catálogo completo. Arriba, el selector de nivel a lo grande (el mismo de la portada); debajo,
 * búsqueda y filtros por modalidad y universidad como píldoras. Los resultados van agrupados
 * por nivel, cada grupo con su cabecera de color, y cada programa es una tarjeta con la
 * estrella para compararlo. La lista de guardados vive en localStorage.
 */
export function ProgramsCatalog({ programs }: { programs: AcademicProgram[] }) {
  const [level, setLevel] = useState<LevelFilter>('all');
  const [modality, setModality] = useState<ProgramModality | ''>('');
  const [uni, setUni] = useState('');
  const [q, setQ] = useState('');
  const { saved, has, toggle } = useSavedPrograms();
  const reduced = useReducedMotion();

  const universities = useMemo(() => {
    const m = new Map<string, string>();
    programs.forEach(
      (p) => p.university && m.set(p.university.documentId, acronymOf(p.university))
    );
    return Array.from(m, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [programs]);

  // Las pestañas cuentan sobre lo que ya filtran búsqueda, modalidad y universidad
  const base = useMemo(
    () =>
      programs.filter(
        (p) =>
          (!modality || p.modality === modality) &&
          (!uni || p.university?.documentId === uni) &&
          (!q || p.name.toLowerCase().includes(q.toLowerCase()))
      ),
    [programs, modality, uni, q]
  );
  const counts = useMemo(() => countByLevel(base, saved), [base, saved]);

  // Cada combinación de filtros reparte las tarjetas de nuevo
  const dealKey = `${level}|${modality}|${uni}|${q.trim().toLowerCase()}`;

  const visible = useMemo(() => {
    if (level === 'all') return base;
    if (level === 'saved') return base.filter((p) => saved.includes(p.documentId));
    return base.filter((p) => p.level === level);
  }, [base, level, saved]);

  const groups = useMemo(
    () =>
      LEVELS.map((l) => ({ level: l, items: visible.filter((p) => p.level === l) })).filter(
        (g) => g.items.length
      ),
    [visible]
  );

  const clear = () => {
    setLevel('all');
    setModality('');
    setUni('');
    setQ('');
  };
  const filtering = level !== 'all' || modality || uni || q;

  return (
    <div>
      <LevelTabs value={level} onChange={setLevel} counts={counts} showSaved />

      <div className="mt-6 grid gap-4 rounded-[10px] border border-line bg-surface-1 p-4 md:grid-cols-12 md:items-center md:p-5">
        <label className="relative block md:col-span-4">
          <span className="sr-only">Buscar programa</span>
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted"
          >
            <SearchGlyph />
          </span>
          <input
            type="search"
            placeholder="Buscar por nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-full border border-line bg-bg py-2.5 pr-4 pl-10 text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-fg-muted focus:border-accent-sage focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-sage)_18%,transparent)]"
          />
        </label>

        <div
          className="flex flex-wrap items-center gap-2 md:col-span-4"
          role="group"
          aria-label="Modalidad"
        >
          <span className="ui-label mr-1 text-fg-muted">Modalidad</span>
          <Pill active={modality === ''} onClick={() => setModality('')}>
            Todas
          </Pill>
          {MODALITIES.map((m) => (
            <Pill key={m} active={modality === m} onClick={() => setModality(m)}>
              {MODALITY_LABEL[m]}
            </Pill>
          ))}
        </div>

        <div className="flex items-center gap-2 md:col-span-4 md:justify-end">
          <label className="ui-label flex items-center gap-2 text-fg-muted">
            Universidad
            <select
              value={uni}
              onChange={(e) => setUni(e.target.value)}
              className="rounded-full border border-line bg-bg px-3 py-2 text-[0.9rem] text-fg outline-none transition-colors duration-300 focus:border-accent-sage"
            >
              <option value="">Todas</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="ui-label text-fg-muted" aria-live="polite">
          Mostrando <strong className="font-medium text-fg">{visible.length}</strong> de{' '}
          {programs.length} programas
          {saved.length > 0 && (
            <>
              {' '}
              · <span aria-hidden>★</span> {saved.length} guardado{saved.length === 1 ? '' : 's'}
            </>
          )}
        </p>
        {filtering && (
          <button
            type="button"
            onClick={clear}
            className="ui-label text-accent-sage underline decoration-transparent underline-offset-4 transition-[text-decoration-color] duration-300 hover:decoration-current"
          >
            Quitar filtros
          </button>
        )}
      </div>

      <div className="mt-8 space-y-14">
        {groups.map((g) => {
          const meta = LEVEL_META[g.level];
          return (
            <section key={g.level} aria-labelledby={`grp-${g.level}`}>
              <header className="relative mb-5 flex flex-wrap items-end justify-between gap-3 pb-4">
                <motion.span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-px origin-left bg-line"
                  initial={reduced ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: '-5% 0px' }}
                  transition={{ duration: 1.2, ease: EASE.premium }}
                />
                <div className="flex items-center gap-4">
                  <motion.span
                    aria-hidden
                    className="grid h-12 w-12 place-items-center rounded-[12px] font-display text-[1.5rem] text-paper shadow-[0_12px_24px_-12px_var(--lv)]"
                    style={
                      {
                        background: meta.color,
                        '--lv': meta.color,
                        fontVariationSettings: "'opsz' 48, 'WONK' 1",
                      } as React.CSSProperties
                    }
                    initial={reduced ? false : { rotate: -90, scale: 0.4, opacity: 0 }}
                    whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-5% 0px' }}
                    transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                  >
                    {meta.glyph}
                  </motion.span>
                  <div>
                    <h2
                      id={`grp-${g.level}`}
                      className="text-[clamp(1.5rem,2.6vw,2rem)] leading-none text-fg"
                    >
                      {meta.plural}{' '}
                      <span className="mono-label align-middle text-fg-muted">
                        {g.items.length}
                      </span>
                    </h2>
                    <p className="ui-label mt-1 text-fg-muted">
                      {meta.hint} Duración típica: {meta.span}.
                    </p>
                  </div>
                </div>
              </header>
              {/* La clave cambia con cada filtro: la retícula se vuelve a repartir */}
              <ul
                key={dealKey}
                className="grid gap-3 [perspective:1400px] sm:grid-cols-2 xl:grid-cols-3"
              >
                <AnimatePresence>
                  {g.items.map((p, i) => (
                    <motion.li
                      key={p.documentId}
                      layout={!reduced}
                      initial={reduced ? false : dealFrom(i)}
                      whileInView={{ opacity: 1, y: 0, rotateX: 0, rotateZ: 0, scale: 1 }}
                      viewport={{ once: true, margin: '-6% 0px' }}
                      exit={
                        reduced
                          ? undefined
                          : { opacity: 0, scale: 0.9, y: -16, transition: { duration: 0.25 } }
                      }
                      transition={{
                        duration: 0.9,
                        ease: EASE.premium,
                        delay: dealDelay(i),
                      }}
                      style={{ transformOrigin: '50% 100%' }}
                    >
                      <Card
                        program={p}
                        saved={has(p.documentId)}
                        onToggle={() => toggle(p.documentId)}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          );
        })}
        {visible.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-line p-10 text-center text-fg-muted">
            {level === 'saved'
              ? 'Todavía no has guardado programas. Marca la estrella de alguno para verlo aquí.'
              : 'Ningún programa coincide con esos filtros. Quita alguno y vuelve a intentar.'}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  program: p,
  saved,
  onToggle,
}: {
  program: AcademicProgram;
  saved: boolean;
  onToggle: () => void;
}) {
  const meta = LEVEL_META[p.level];
  return (
    <article
      className="lift hover:lift-on group relative flex h-full flex-col overflow-hidden rounded-[10px] border border-line bg-surface-1 p-5"
      style={{ '--lv': meta.color } as React.CSSProperties}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-[var(--lv)] transition-[width] duration-500 ease-(--ease-out-premium) group-hover:w-1.5"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="ui-label rounded-full px-2.5 py-0.5 text-paper"
            style={{ background: 'var(--lv)' }}
          >
            {LEVEL_LABEL[p.level]}
          </span>
          <span className="ui-label rounded-full border border-line px-2.5 py-0.5 text-fg-muted">
            {MODALITY_LABEL[p.modality]}
          </span>
        </div>
        <PulseStar
          active={saved}
          onToggle={onToggle}
          label={saved ? 'Quitar de guardados' : 'Guardar programa'}
          size={30}
        />
      </div>
      <h3
        className="mt-4 text-[1.25rem] leading-[1.15] text-fg"
        style={{ fontVariationSettings: "'opsz' 32, 'SOFT' 30" }}
      >
        {p.name}
      </h3>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div className="ui-label text-fg-muted">
          {p.university && (
            <Link
              href={`/universidades/${p.university.documentId}`}
              className="text-fg underline decoration-transparent underline-offset-4 transition-[text-decoration-color,color] duration-300 hover:text-accent-sage hover:decoration-current"
            >
              {acronymOf(p.university)}
            </Link>
          )}
          {p.duration && <span className="block">{p.duration}</span>}
        </div>
        {p.infoUrl ? (
          <a
            href={p.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ui-label inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-fg transition-[background-color,border-color,color] duration-300 hover:border-[var(--lv)] hover:bg-[var(--lv)] hover:text-paper"
          >
            Ficha oficial <span aria-hidden>↗</span>
          </a>
        ) : p.university ? (
          <Link
            href={`/universidades/${p.university.documentId}`}
            className="ui-label inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-fg transition-[background-color,border-color,color] duration-300 hover:border-[var(--lv)] hover:bg-[var(--lv)] hover:text-paper"
          >
            Universidad <span aria-hidden>→</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'ui-label rounded-full border px-3 py-1.5 transition-[background-color,border-color,color] duration-300 ease-(--ease-snap)',
        active ? 'border-fg bg-fg text-bg' : 'border-line bg-bg text-fg hover:border-fg/50'
      )}
    >
      {children}
    </button>
  );
}

function SearchGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
