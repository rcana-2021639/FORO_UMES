'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, ViewTransition, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Emblem } from '@/components/ui/Emblem';
import { Note } from '@/components/ui/Note';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { brandOf } from '@/lib/universities';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import type { LevelCounts } from '@/lib/format';

export interface ShelfBook {
  documentId: string;
  acronym: string;
  name: string;
  logo?: string | null;
  programs?: number;
  joined?: number | null;
  levels?: LevelCounts;
}

/** Lomos en la familia violeta (en reposo nadie lleva su color: el Foro es neutral). */
const SPINES = [
  '#3a2677',
  '#4f339e',
  '#261a4f',
  '#4b4aa8',
  '#6443c4',
  '#7a3d8f',
  '#8a3f7a',
  '#5b3fa8',
  '#2f2160',
];
/** Altura de cada libro (fracción del estante): un librero real no es parejo. */
const HEIGHTS = [0.95, 0.86, 1, 0.9, 0.97, 0.83, 0.92, 0.99, 0.88];

/**
 * Cabecera de /universidades (DESIGN_NOTES §29.6): el librero del Foro. Nueve libros en un estante,
 * uno por universidad, con su sello en el lomo; **el grosor de cada lomo es su número de
 * programas**. Al señalar uno, el libro se saca del estante, los vecinos se apartan, el lomo toma
 * el color de su universidad y abajo se lee quién es. Click: su perfil (el sello viaja hasta allá).
 * El sujetalibros es el emblema (el 9 maya). Reemplaza al anillo de sellos.
 */
export function UniversityShelf({ books }: { books: ShelfBook[] }) {
  const [active, setActive] = useState<number | null>(null);
  // La nota entra tarde la primera vez (después de que caen los libros); al volver, de inmediato
  const [touched, setTouched] = useState(false);
  const reduced = useReducedMotion();
  const pick = (i: number) => {
    setActive(i);
    setTouched(true);
  };
  const current = active == null ? null : books[active];

  return (
    <figure className="shelf" data-active={active != null} onPointerLeave={() => setActive(null)}>
      <ul className="shelf__row" aria-label="Las nueve universidades" data-reveal-group="">
        {books.map((b, i) => {
          const brand = brandOf(b.acronym);
          return (
            <li
              key={b.documentId}
              className="shelf__slot"
              data-on={active === i || undefined}
              style={
                {
                  '--w': Math.max(b.programs ?? 0, 6),
                  '--h': HEIGHTS[i % HEIGHTS.length],
                  '--spine': SPINES[i % SPINES.length],
                  '--u': brand.primary,
                  '--u2': brand.accent,
                } as CSSProperties
              }
            >
              <Link
                href={`/universidades/${b.documentId}`}
                transitionTypes={['uni-seal']}
                className="book"
                data-reveal="book"
                data-reveal-at={120 + i * 85}
                onPointerEnter={() => pick(i)}
                onFocus={() => pick(i)}
                onBlur={() => setActive(null)}
                aria-label={`${b.name}${b.programs ? `, ${b.programs} programas` : ''}: abrir perfil`}
              >
                <span aria-hidden className="book__band book__band--top" />
                {b.logo && (
                  <span className="book__seal">
                    <ViewTransition
                      name={`seal-${b.documentId}`}
                      share={{ 'uni-seal': 'seal-morph', default: 'none' }}
                      default="none"
                    >
                      <Image src={b.logo} alt="" width={64} height={64} priority={i < 3} />
                    </ViewTransition>
                  </span>
                )}
                <span aria-hidden className="book__title">
                  {b.acronym}
                </span>
                {b.joined && (
                  <span aria-hidden className="book__year">
                    {b.joined}
                  </span>
                )}
                <span aria-hidden className="book__band book__band--bottom" />
              </Link>
            </li>
          );
        })}
        <li
          aria-hidden
          className="shelf__end"
          data-reveal="pop"
          data-reveal-at={120 + books.length * 85}
        >
          <Emblem className="shelf__emblem" />
        </li>
      </ul>
      <span aria-hidden className="shelf__board" data-reveal="line" />

      <figcaption className="shelf__card" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current ? (
            <motion.span
              key={current.documentId}
              className="shelf__who"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="shelf__acr" style={{ color: brandOf(current.acronym).text }}>
                {current.acronym}
              </span>
              <span className="shelf__name">{current.name}</span>
              <span className="shelf__meta">
                {current.programs ? `${current.programs} programas` : 'Sin programas publicados'}
                {current.joined ? ` · en el Foro desde ${current.joined}` : ''}
              </span>
              {current.levels && current.programs ? (
                <span className="shelf__levels" aria-hidden>
                  {LEVELS.filter((l) => current.levels![l] > 0).map((l) => (
                    <span
                      key={l}
                      style={
                        {
                          '--n': current.levels![l],
                          '--c': LEVEL_META[l].color,
                        } as CSSProperties
                      }
                    >
                      <b>{current.levels![l]}</b> {LEVEL_META[l].glyph}
                    </span>
                  ))}
                </span>
              ) : null}
            </motion.span>
          ) : (
            <motion.span
              key="todas"
              className="shelf__who"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <span className="shelf__name">Nueve libros, un Foro: señala un lomo.</span>
              <Note tilt={-2} className="shelf__note" at={touched ? 0 : 1200}>
                el grosor de cada lomo es su número de programas
              </Note>
            </motion.span>
          )}
        </AnimatePresence>
      </figcaption>
    </figure>
  );
}
