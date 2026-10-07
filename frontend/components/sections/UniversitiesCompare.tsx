'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Arrow } from '@/components/ui/Arrow';
import { ModalityIcon } from '@/components/ui/ModalityIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { MODALITY_LABEL, yearOf, type LevelCounts, type ModalityCounts } from '@/lib/format';
import {
  COMPARE_QUESTIONS,
  compareAnswer,
  compareSort,
  compareValue,
  type CompareKey,
  type CompareRow,
} from '@/lib/compare';
import { mediaUrl } from '@/lib/api';
import type { ProgramLevel, ProgramModality, University } from '@/lib/types';

const MODALITIES: ProgramModality[] = ['Presencial', 'Hibrida', 'Virtual'];
const EMPTY_LEVELS: LevelCounts = { Maestria: 0, Doctorado: 0, Especializacion: 0, Diplomado: 0 };
const EMPTY_MOD: ModalityCounts = { Presencial: 0, Virtual: 0, Hibrida: 0 };

/** Qué se lee en la columna de la cifra para cada pregunta. */
const METRIC_LABEL: Record<CompareKey, string> = {
  total: 'Programas',
  Maestria: 'Maestrías',
  Doctorado: 'Doctorados',
  Especializacion: 'Especializ.',
  Diplomado: 'Diplomados',
  online: 'A distancia',
  joined: 'Desde',
};

const isLevel = (k: CompareKey): k is ProgramLevel => (LEVELS as string[]).includes(k);

interface Row extends CompareRow {
  u: University;
}

/**
 * "Comparar" de /universidades (DESIGN_NOTES §29.6). Antes: una tabla de nueve columnas con
 * flechas para ordenar, difícil de leer. Ahora se elige una pregunta ("¿qué quieres comparar?") y
 * una frase la contesta con los datos; la tabla se ordena por esa pregunta y resalta lo que importa:
 * - una sola barra por universidad con su oferta por nivel (el largo es su total, cada tramo un
 *   nivel en su color); al preguntar por un nivel, solo ese tramo queda encendido;
 * - la cifra que responde, grande; las modalidades, con icono y cantidad.
 * Entrada: las filas llegan en cascada y las barras se llenan tramo por tramo; al cambiar de
 * pregunta las filas se deslizan a su nuevo lugar.
 */
export function UniversitiesCompare({
  universities,
  levels,
  modalities,
}: {
  universities: University[];
  levels: Record<string, LevelCounts>;
  modalities: Record<string, ModalityCounts>;
}) {
  const reduced = useReducedMotion();
  const [key, setKey] = useState<CompareKey>('total');

  const rows: Row[] = useMemo(
    () =>
      universities.map((u) => {
        const lv = levels[u.documentId] ?? EMPTY_LEVELS;
        return {
          u,
          acronym: u.acronym ?? u.name,
          order: u.displayOrder,
          joined: yearOf(u.joinedForumAt),
          total: LEVELS.reduce((n, l) => n + lv[l], 0),
          levels: lv,
          modalities: modalities[u.documentId] ?? EMPTY_MOD,
        };
      }),
    [universities, levels, modalities]
  );
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  const sorted = useMemo(() => compareSort(key, rows) as Row[], [key, rows]);
  const answer = useMemo(() => compareAnswer(key, rows), [key, rows]);
  const focusLevel = isLevel(key) ? key : null;

  return (
    <div className="cmp2">
      <div className="cmp2__ask" data-reveal="up">
        <p className="cmp2__q" id="cmp2-q">
          ¿Qué quieres comparar?
        </p>
        <div className="cmp2__chips" role="radiogroup" aria-labelledby="cmp2-q">
          {COMPARE_QUESTIONS.map((q) => {
            const lv = isLevel(q.key) ? LEVEL_META[q.key] : null;
            return (
              <button
                key={q.key}
                type="button"
                role="radio"
                aria-checked={key === q.key}
                className="cmp2__chip"
                style={lv ? ({ '--c': lv.color } as CSSProperties) : undefined}
                title={lv?.hint}
                onClick={() => setKey(q.key)}
              >
                {key === q.key && (
                  <motion.span
                    layoutId="cmp2-chip"
                    className="cmp2__chip-bg"
                    transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                  />
                )}
                {lv && <span className="cmp2__chip-glyph">{lv.glyph}</span>}
                {q.label}
              </button>
            );
          })}
        </div>
        {/* La respuesta, en una frase */}
        <div className="cmp2__answer" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={key}
              initial={reduced ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduced ? undefined : { opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {answer}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Qué es cada color */}
      <ul className="cmp2__legend" aria-label="Niveles de posgrado" data-reveal="fade">
        {LEVELS.map((l) => (
          <li
            key={l}
            style={{ '--c': LEVEL_META[l].color } as CSSProperties}
            data-dim={focusLevel !== null && focusLevel !== l ? true : undefined}
          >
            <span aria-hidden className="cmp2__swatch" />
            <b>{LEVEL_META[l].plural}</b>
            <span className="cmp2__hint">{LEVEL_META[l].hint}</span>
          </li>
        ))}
      </ul>

      <div className="cmp2__scroll" tabIndex={0} aria-label="Comparación, se desplaza a los lados">
        <table className="cmp2__table" data-key={key}>
          <caption className="sr-only">
            Comparación de las nueve universidades del Foro ordenada por: {METRIC_LABEL[key]}.{' '}
            {answer}
          </caption>
          <thead>
            <tr>
              <th scope="col">Universidad</th>
              <th scope="col" className="cmp2__metric-h">
                {METRIC_LABEL[key]}
              </th>
              <th scope="col">Su oferta por nivel</th>
              <th scope="col" className="cmp2__mods-h">
                Modalidades
              </th>
              <th scope="col">
                <span className="sr-only">Perfil</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const logo = mediaUrl(r.u.logo?.formats?.thumbnail?.url ?? r.u.logo?.url);
              const value = compareValue(key, r);
              return (
                <motion.tr
                  key={r.u.documentId}
                  layout={reduced ? false : 'position'}
                  transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
                  className="cmp2__row"
                  style={{ '--i': i } as CSSProperties}
                >
                  <th scope="row">
                    <Link href={`/universidades/${r.u.documentId}`} className="cmp2__uni">
                      {logo ? (
                        <Image src={logo} alt="" width={64} height={64} className="cmp2__seal" />
                      ) : (
                        <span aria-hidden className="cmp2__seal cmp2__seal--text">
                          {r.acronym.slice(0, 3)}
                        </span>
                      )}
                      <span>
                        <span className="cmp2__acr">{r.acronym}</span>
                        <span className="cmp2__name">{r.u.name}</span>
                      </span>
                    </Link>
                  </th>
                  <td className="cmp2__metric" data-zero={!value || undefined}>
                    {(value ?? 0) > 0 && (
                      <span className="cmp2__pos" aria-hidden>
                        {i + 1}.
                      </span>
                    )}
                    {value ?? '—'}
                  </td>
                  <td>
                    <Bar row={r} max={maxTotal} focus={focusLevel} />
                  </td>
                  <td className="cmp2__mods" data-on={key === 'online' || undefined}>
                    {MODALITIES.map((m) => (
                      <span
                        key={m}
                        className="cmp2__mod"
                        data-zero={!r.modalities[m] || undefined}
                        title={`${MODALITY_LABEL[m]}: ${r.modalities[m]}`}
                      >
                        <ModalityIcon modality={m} />
                        <span className="sr-only">{MODALITY_LABEL[m]}</span>
                        <b>{r.modalities[m]}</b>
                      </span>
                    ))}
                  </td>
                  <td className="cmp2__go">
                    <Link
                      href={`/universidades/${r.u.documentId}`}
                      aria-label={`Abrir el perfil de ${r.u.name}`}
                    >
                      <Arrow />
                    </Link>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="cmp2__note">
        El largo de cada barra es su número de programas; cada tramo, un nivel. Iconos:{' '}
        <ModalityIcon modality="Presencial" className="cmp2__note-icon" /> presencial,{' '}
        <ModalityIcon modality="Hibrida" className="cmp2__note-icon" /> híbrida,{' '}
        <ModalityIcon modality="Virtual" className="cmp2__note-icon" /> virtual.
      </p>
    </div>
  );
}

/** Su oferta en una barra: largo = total; tramos = niveles (el de la pregunta, encendido). */
function Bar({ row, max, focus }: { row: Row; max: number; focus: string | null }) {
  const parts = LEVELS.filter((l) => row.levels[l] > 0);
  return (
    <span
      className="cmp2__bar"
      style={{ '--len': row.total / max } as CSSProperties}
      aria-label={
        parts.length
          ? parts.map((l) => `${row.levels[l]} ${LEVEL_META[l].plural.toLowerCase()}`).join(', ')
          : 'Sin programas publicados'
      }
      role="img"
    >
      {parts.map((l, s) => (
        <span
          key={l}
          className="cmp2__seg"
          data-dim={focus !== null && focus !== l ? true : undefined}
          style={{ '--n': row.levels[l], '--c': LEVEL_META[l].color, '--s': s } as CSSProperties}
        >
          {row.levels[l]}
        </span>
      ))}
    </span>
  );
}
