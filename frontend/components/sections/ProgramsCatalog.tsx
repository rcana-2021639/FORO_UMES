'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PulseStar } from '@/components/ui/PulseStar';
import { LevelTabs, countByLevel, type LevelFilter } from '@/components/ui/LevelTabs';
import { useSavedPrograms } from '@/hooks/useSavedPrograms';
import { useClientValue } from '@/hooks/useClientValue';
import { LEVEL_LABEL, MODALITY_LABEL, acronymOf } from '@/lib/format';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EASE } from '@/lib/motion';
import { cn } from '@/lib/cn';
import type { AcademicProgram, ProgramModality } from '@/lib/types';
import { Arrow } from '@/components/ui/Arrow';
import { ModalityIcon } from '@/components/ui/ModalityIcon';
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/ssr';
import { SavedCompare } from './SavedCompare';

const MODALITIES: ProgramModality[] = ['Presencial', 'Virtual', 'Hibrida'];

/** Posición de salida al repartir: desde abajo, inclinada hacia atrás y girada según su columna. */
const dealFrom = (i: number) => ({
  opacity: 0,
  y: 70,
  rotateX: -38,
  rotateZ: [-3, 0, 3][i % 3],
  scale: 0.94,
});
/** Cuántos programas se muestran de entrada y cuántos más con cada "Mostrar más". */
const PAGE = 18;

/** Retardo por columna y fila, con tope para que las listas largas no esperen de más. */
const dealDelay = (i: number) => Math.min((i % 3) * 0.08 + Math.floor(i / 3) * 0.06, 0.7);

const readUrlLevel = (): LevelFilter | null => {
  const n = new URLSearchParams(window.location.search).get('nivel');
  return n && (LEVELS as string[]).includes(n) ? (n as LevelFilter) : null;
};

/** `?q=` llega del buscador de la portada; se recorta para no aceptar textos enormes. */
const readUrlQuery = (): string =>
  (new URLSearchParams(window.location.search).get('q') ?? '').slice(0, 80);

/**
 * Catálogo completo. Arriba, el selector de nivel a lo grande (el mismo de la portada); debajo,
 * búsqueda y filtros por modalidad y universidad como píldoras. Los resultados van agrupados
 * por nivel, cada grupo con su cabecera de color, y cada programa es una tarjeta con la
 * estrella para compararlo. La lista de guardados vive en localStorage.
 */
export function ProgramsCatalog({ programs }: { programs: AcademicProgram[] }) {
  // `/programas?nivel=Maestria` (enlaces de la guía de la portada) abre ya filtrado; en cuanto
  // la persona elige otra pestaña, manda su elección
  const [picked, setLevel] = useState<LevelFilter | null>(null);
  const urlLevel = useClientValue(readUrlLevel, null);
  const level: LevelFilter = picked ?? urlLevel ?? 'all';
  const [modality, setModality] = useState<ProgramModality | ''>('');
  const [uni, setUni] = useState('');
  // `/programas?q=…` (buscador de la portada) abre con la búsqueda hecha; escribir la reemplaza
  const [typed, setQ] = useState<string | null>(null);
  const urlQuery = useClientValue(readUrlQuery, '');
  const q = typed ?? urlQuery;
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
          (!q || fold(p.name).includes(fold(q.trim())))
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

  // Se muestran por tandas (la lista completa medía 27 000 px en el teléfono). Cada combinación de
  // filtros vuelve a empezar por la primera tanda.
  const [shown, setShown] = useState({ key: '', n: PAGE });
  const limit = shown.key === dealKey ? shown.n : PAGE;
  const showMore = () => setShown({ key: dealKey, n: limit + PAGE });
  const remaining = Math.max(0, visible.length - limit);

  const groups = useMemo(() => {
    // Orden de lectura: por nivel, y dentro de cada nivel tal como vienen
    const ordered = LEVELS.flatMap((l) => visible.filter((p) => p.level === l));
    const page = new Set(ordered.slice(0, limit).map((p) => p.documentId));
    return LEVELS.map((l) => {
      const all = ordered.filter((p) => p.level === l);
      return { level: l, total: all.length, items: all.filter((p) => page.has(p.documentId)) };
    }).filter((g) => g.items.length);
  }, [visible, limit]);

  const clear = () => {
    setLevel('all');
    setModality('');
    setUni('');
    setQ('');
  };
  const filtering = level !== 'all' || modality || uni || q;
  const savedPrograms = useMemo(
    () => saved.map((id) => programs.find((p) => p.documentId === id)).filter((p) => !!p),
    [saved, programs]
  );
  const showSaved = () => {
    setLevel('saved');
    document.getElementById('buscar')?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };

  return (
    <div>
      <LevelTabs value={level} onChange={setLevel} counts={counts} showSaved />

      <div
        id="buscar"
        className="mt-6 grid scroll-mt-28 gap-4 rounded-[10px] border border-[var(--rule)] bg-white p-4 md:grid-cols-12 md:items-center md:p-5"
      >
        <label className="relative block md:col-span-12 lg:col-span-4">
          <span className="sr-only">Buscar programa</span>
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-fg-muted"
          >
            <MagnifyingGlassIcon weight="bold" className="h-4 w-4" />
          </span>
          <input
            type="search"
            placeholder="Buscar por nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-[8px] border border-fg/20 bg-bg py-2.5 pr-4 pl-10 text-[0.95rem] text-fg outline-none transition-[border-color,box-shadow] duration-300 placeholder:text-fg-muted focus:border-accent-sage focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent-sage)_18%,transparent)]"
          />
        </label>

        <div
          className="flex flex-wrap items-center gap-2 md:col-span-7 lg:col-span-5"
          role="group"
          aria-label="Modalidad"
        >
          <span className="ui-label mr-1 text-fg-muted">Modalidad</span>
          <Pill active={modality === ''} onClick={() => setModality('')}>
            Todas
          </Pill>
          {MODALITIES.map((m) => (
            <Pill key={m} active={modality === m} onClick={() => setModality(m)}>
              <ModalityIcon
                modality={m}
                className="mr-1 inline-block h-[1.05em] w-[1.05em] align-[-0.15em]"
              />
              {MODALITY_LABEL[m]}
            </Pill>
          ))}
        </div>

        <div className="flex items-center gap-2 md:col-span-5 md:justify-end lg:col-span-3">
          <label className="ui-label flex items-center gap-2 text-fg-muted">
            Universidad
            <select
              value={uni}
              onChange={(e) => setUni(e.target.value)}
              className="rounded-[8px] border border-fg/20 bg-bg px-3 py-2 text-[0.9rem] text-fg outline-none transition-colors duration-300 focus:border-accent-sage"
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
          {visible.length === programs.length ? (
            <>
              <strong className="font-semibold text-fg">{programs.length}</strong> programas
            </>
          ) : (
            <>
              <strong className="font-semibold text-fg">{visible.length}</strong> de{' '}
              {programs.length} programas coinciden
            </>
          )}
          {remaining > 0 && <> · ves los primeros {limit}</>}
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
                    className="grid h-12 w-12 place-items-center rounded-[8px] font-display text-[1.5rem] text-paper"
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
                      <span className="mono-label align-middle text-fg-muted">{g.total}</span>
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
                        query={q}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </section>
          );
        })}
        {remaining > 0 && (
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={showMore} className="cta-ghost">
              Mostrar {Math.min(PAGE, remaining)} programas más
            </button>
            <span className="ui-label text-fg-muted">
              Quedan {remaining}. También puedes buscar por nombre o filtrar arriba.
            </span>
          </div>
        )}
        {visible.length === 0 && (
          <div className="rounded-[10px] border border-dashed border-line p-10 text-center text-fg-muted">
            {level === 'saved'
              ? 'Todavía no has guardado programas. Marca la estrella de alguno para verlo aquí.'
              : 'Ningún programa coincide con esos filtros. Quita alguno y vuelve a intentar.'}
          </div>
        )}
      </div>
      <SavedCompare programs={savedPrograms} onRemove={toggle} onShowList={showSaved} />
    </div>
  );
}

/**
 * El nombre con lo buscado resaltado (sin distinguir mayúsculas ni tildes: "gestion" encuentra
 * "Gestión"). Se resalta sobre el texto original, así que nunca cambia cómo se escribe.
 */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = fold(query.trim());
  if (!q) return <>{text}</>;
  const at = fold(text).indexOf(q);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="hl">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

/** Minúsculas y sin tildes, conservando la longitud (para que las posiciones coincidan). */
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Card({
  program: p,
  saved,
  onToggle,
  query,
}: {
  program: AcademicProgram;
  saved: boolean;
  onToggle: () => void;
  /** Lo que se busca: se resalta dentro del nombre. */
  query: string;
}) {
  const meta = LEVEL_META[p.level];
  return (
    <article
      className="catalog-card lift hover:lift-on group"
      style={{ '--lv': meta.color } as React.CSSProperties}
    >
      <span aria-hidden className="catalog-card__bar" />
      <div className="flex items-start justify-between gap-3">
        <p className="catalog-card__kicker">
          <span style={{ color: 'var(--lv)' }}>{LEVEL_LABEL[p.level]}</span>
          <span aria-hidden>·</span>
          <span>{MODALITY_LABEL[p.modality]}</span>
        </p>
        <PulseStar
          active={saved}
          onToggle={onToggle}
          label={saved ? 'Quitar de guardados' : 'Guardar programa'}
          size={30}
        />
      </div>
      <h3 className="catalog-card__title">
        <Highlight text={p.name} query={query} />
      </h3>
      <div className="catalog-card__foot">
        <p className="ui-label text-fg-muted">
          {p.university && (
            <Link href={`/universidades/${p.university.documentId}`} className="catalog-card__uni">
              {acronymOf(p.university)}
            </Link>
          )}
          {p.university && p.duration && <span aria-hidden> · </span>}
          {p.duration && <span>{p.duration}</span>}
        </p>
        {p.infoUrl ? (
          <a
            href={p.infoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="catalog-card__go"
            aria-label={`Ficha oficial de ${p.name} (se abre en otra pestaña)`}
          >
            Ficha oficial <Arrow dir="up-right" />
          </a>
        ) : p.university ? (
          <Link href={`/universidades/${p.university.documentId}`} className="catalog-card__go">
            Universidad <Arrow />
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
        'ui-label rounded-[6px] border px-3 py-1.5 transition-[background-color,border-color,color] duration-300 ease-(--ease-snap)',
        active ? 'border-fg bg-fg text-bg' : 'border-fg/20 bg-bg text-fg hover:border-fg/50'
      )}
    >
      {children}
    </button>
  );
}
