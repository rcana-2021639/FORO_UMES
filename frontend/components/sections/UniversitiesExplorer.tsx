'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SquaresFourIcon, TableIcon } from '@phosphor-icons/react/dist/ssr';
import { UniversitiesBento } from './UniversitiesBento';
import { UniversitiesCompare } from './UniversitiesCompare';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useClientValue } from '@/hooks/useClientValue';
import type { LevelCounts, ModalityCounts } from '@/lib/format';
import type { University } from '@/lib/types';

type View = 'fichas' | 'comparar';

const VIEWS: { id: View; label: string; Icon: typeof TableIcon }[] = [
  { id: 'fichas', label: 'Fichas', Icon: SquaresFourIcon },
  { id: 'comparar', label: 'Comparar', Icon: TableIcon },
];

/**
 * /universidades con dos maneras de verlas (DESIGN_NOTES §28.4, fase 3): las fichas de siempre
 * (con su volteo al color de cada una) o la tabla para comparar. `?vista=comparar` abre la tabla
 * directamente (el perfil enlaza así su botón "Comparar con las otras ocho").
 */
export function UniversitiesExplorer({
  universities,
  programCounts,
  levels,
  modalities,
}: {
  universities: University[];
  programCounts: Record<string, number>;
  levels: Record<string, LevelCounts>;
  modalities: Record<string, ModalityCounts>;
}) {
  const reduced = useReducedMotion();
  // La vista pedida en la URL se lee en el navegador (la página es estática: no depende de la
  // consulta); lo que la persona elija después manda
  const fromUrl = useClientValue<View>(
    () =>
      new URLSearchParams(location.search).get('vista') === 'comparar' ? 'comparar' : 'fichas',
    'fichas'
  );
  const [chosen, setChosen] = useState<View | null>(null);
  const view = chosen ?? fromUrl;

  const choose = (v: View) => {
    setChosen(v);
    const url = new URL(location.href);
    if (v === 'comparar') url.searchParams.set('vista', 'comparar');
    else url.searchParams.delete('vista');
    history.replaceState(history.state, '', url);
  };

  return (
    <>
      <div className="views" data-reveal="up">
        <div role="group" aria-label="Cómo ver las universidades" className="views__switch">
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              className="views__btn"
              onClick={() => choose(id)}
            >
              {view === id && (
                <motion.span
                  layoutId="views-pill"
                  className="views__pill"
                  transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                />
              )}
              <Icon aria-hidden weight={view === id ? 'fill' : 'regular'} />
              {label}
            </button>
          ))}
        </div>
        <p className="views__hint">
          {view === 'fichas'
            ? 'Pasa el cursor por una ficha para verla con sus colores.'
            : 'Ordena por nivel para saber quién ofrece más de lo que buscas.'}
        </p>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -10 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          {view === 'fichas' ? (
            <UniversitiesBento
              universities={universities}
              programCounts={programCounts}
              levels={levels}
            />
          ) : (
            <UniversitiesCompare
              universities={universities}
              levels={levels}
              modalities={modalities}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
