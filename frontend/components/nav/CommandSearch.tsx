'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState, Fragment } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BankIcon,
  CalendarBlankIcon,
  CompassIcon,
  GraduationCapIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Arrow } from '@/components/ui/Arrow';
import { Emblem } from '@/components/ui/Emblem';
import { getLenis } from '@/components/providers/SmoothScroll';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { KIND_LABEL, fold, search, terms, type SearchEntry, type SearchKind } from '@/lib/search';

/** Evento que abre el buscador desde cualquier botón (barra, menú móvil, 404). */
export const OPEN_SEARCH = 'foro:buscar';
export const openSearch = () => window.dispatchEvent(new Event(OPEN_SEARCH));

const ICON: Record<SearchKind, typeof BankIcon> = {
  pagina: CompassIcon,
  universidad: BankIcon,
  programa: GraduationCapIcon,
  actividad: CalendarBlankIcon,
  noticia: NewspaperIcon,
};

/** Lo que se ve antes de escribir: los atajos de siempre. */
const SUGGESTED = ['/programas', '/universidades', '/actividades', '/contacto'];
const EXAMPLES = ['administración', 'salud pública', 'doctorado', 'USAC', 'virtual'];

let cache: SearchEntry[] | null = null;
let loading: Promise<SearchEntry[]> | null = null;
function loadIndex(): Promise<SearchEntry[]> {
  if (cache) return Promise.resolve(cache);
  loading ??= fetch('/indice-de-busqueda')
    .then((r) => (r.ok ? r.json() : []))
    .then((data: SearchEntry[]) => (cache = data))
    .catch(() => {
      loading = null;
      return [];
    });
  return loading;
}

/**
 * Buscador global (DESIGN_NOTES §28.4, fase 6). Se abre con Ctrl/⌘ K, con "/" o desde el botón de
 * la barra, en cualquier página. Encuentra programas, universidades, actividades, noticias y
 * páginas sin tildes ni mayúsculas, resalta lo encontrado y agrupa por tipo; con el teclado se
 * recorre con ↑ ↓ y se abre con Enter. Es un cuadro de diálogo accesible (combobox + listbox).
 */
export function CommandSearch() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<SearchEntry[] | null>(cache);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<Element | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const uid = useId();

  const show = useCallback(() => {
    opener.current = document.activeElement;
    setOpen(true);
    loadIndex().then(setIndex);
  }, []);
  const hide = useCallback(() => setOpen(false), []);

  // Atajos de teclado y el evento de los botones
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.(
        'input, textarea, select, [contenteditable]'
      );
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) hide();
        else show();
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        show();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_SEARCH, show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_SEARCH, show);
    };
  }, [open, show, hide]);

  // Mientras está abierto: la página no se desplaza; al cerrar, el foco vuelve al botón
  useEffect(() => {
    if (!open) return;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const id = window.setTimeout(() => input.current?.focus(), 30);
    return () => {
      window.clearTimeout(id);
      document.documentElement.style.overflow = prev;
      lenis?.start();
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const groups = useMemo(() => (index ? search(index, q) : []), [index, q]);
  const suggested = useMemo(
    () => (index ?? []).filter((e) => e.kind === 'pagina' && SUGGESTED.includes(e.href)),
    [index]
  );
  const flat = useMemo(
    () => (q.trim() ? groups.flatMap((g) => g.hits) : suggested),
    [groups, suggested, q]
  );
  const ts = useMemo(() => terms(q), [q]);
  const programs = groups.find((g) => g.kind === 'programa');
  const sel = Math.min(active, Math.max(flat.length - 1, 0));

  const go = (e: SearchEntry | undefined) => {
    if (!e) return;
    setOpen(false);
    setQ('');
    router.push(e.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      hide();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flat.length) return;
      const next = (sel + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length;
      setActive(next);
      list.current?.querySelector(`[data-i="${next}"]`)?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(flat[sel]);
    }
  };

  // Posición en la lista plana (la que recorren las flechas): los resultados son esos mismos objetos
  const option = (e: SearchEntry) => {
    const i = flat.indexOf(e);
    const Icon = ICON[e.kind];
    const on = i === sel;
    return (
      <div
        key={`${e.kind}-${e.href}`}
        id={`${uid}-o${i}`}
        role="option"
        aria-selected={on}
        data-i={i}
        className="cmdk__item"
        onPointerMove={() => setActive(i)}
        onClick={() => go(e)}
      >
        {on && (
          <motion.span
            layoutId={reduced ? undefined : `${uid}-sel`}
            className="cmdk__sel"
            transition={{ type: 'spring', stiffness: 700, damping: 48 }}
          />
        )}
        <span className="cmdk__icon" data-kind={e.kind}>
          <Icon aria-hidden weight="duotone" />
        </span>
        <span className="cmdk__text">
          <span className="cmdk__title">
            <Marked text={e.title} terms={ts} />
          </span>
          {e.meta && (
            <span className="cmdk__meta">
              <Marked text={e.meta} terms={ts} />
            </span>
          )}
        </span>
        <span aria-hidden className="cmdk__go">
          <Arrow />
        </span>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="cmdk"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18 } }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar el buscador"
            className="cmdk__backdrop"
            onClick={hide}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar en el sitio"
            className="cmdk__panel"
            initial={reduced ? false : { opacity: 0, y: -14, scale: 0.97, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reduced ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 520, damping: 40, mass: 0.8 }}
          >
            <div className="cmdk__field">
              <MagnifyingGlassIcon aria-hidden weight="bold" className="cmdk__lens" />
              <input
                ref={input}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={`${uid}-list`}
                aria-activedescendant={flat.length ? `${uid}-o${sel}` : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder="Programa, universidad, actividad…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                className="cmdk__input"
              />
              <kbd className="cmdk__kbd">Esc</kbd>
            </div>

            <div
              ref={list}
              id={`${uid}-list`}
              role="listbox"
              aria-label="Resultados"
              className="cmdk__list"
            >
              {!index ? (
                <div className="cmdk__loading" role="status">
                  <Emblem motion="loop" className="cmdk__loading-mark" />
                  Preparando el buscador…
                </div>
              ) : !q.trim() ? (
                <>
                  <p className="cmdk__group">Ir a</p>
                  {suggested.map(option)}
                  <p className="cmdk__group">Prueba con</p>
                  <div className="cmdk__examples">
                    {EXAMPLES.map((x) => (
                      <button
                        key={x}
                        type="button"
                        className="cmdk__chip"
                        onClick={() => {
                          setQ(x);
                          setActive(0);
                          input.current?.focus();
                        }}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                </>
              ) : groups.length ? (
                groups.map((g) => (
                  <Fragment key={g.kind}>
                    <p className="cmdk__group">
                      {KIND_LABEL[g.kind]}
                      <span>{g.total}</span>
                    </p>
                    {g.hits.map(option)}
                  </Fragment>
                ))
              ) : (
                <div className="cmdk__empty">
                  <p>
                    Nada coincide con <b>«{q.trim()}»</b>.
                  </p>
                  <p>Prueba con otra palabra o sin abreviaturas.</p>
                </div>
              )}
            </div>

            <div className="cmdk__foot">
              {programs && programs.total > programs.hits.length ? (
                <button
                  type="button"
                  className="cmdk__all"
                  onClick={() =>
                    go({
                      kind: 'pagina',
                      title: '',
                      href: `/programas?q=${encodeURIComponent(q.trim())}`,
                    })
                  }
                >
                  Ver los {programs.total} programas en el catálogo <Arrow />
                </button>
              ) : (
                <span className="cmdk__hint">
                  <kbd>↑</kbd>
                  <kbd>↓</kbd> moverse · <kbd>Enter</kbd> abrir
                </span>
              )}
              <span className="cmdk__hint cmdk__hint--end">
                <kbd>Ctrl</kbd> <kbd>K</kbd> en cualquier página
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** El texto con cada palabra buscada resaltada donde empieza una palabra (sin tildes). */
function Marked({ text, terms: ts }: { text: string; terms: string[] }) {
  if (!ts.length) return <>{text}</>;
  const f = fold(text);
  const marks = new Array<boolean>(text.length).fill(false);
  for (const t of ts) {
    let at = f.indexOf(t);
    while (at >= 0) {
      if (at === 0 || /[^a-z0-9]/.test(f[at - 1]))
        for (let k = 0; k < t.length; k++) marks[at + k] = true;
      at = f.indexOf(t, at + 1);
    }
  }
  const out: React.ReactNode[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marks[i] !== marks[start]) {
      const part = text.slice(start, i);
      out.push(
        marks[start] ? (
          <mark key={start} className="hl">
            {part}
          </mark>
        ) : (
          part
        )
      );
      start = i;
    }
  }
  return <>{out}</>;
}
