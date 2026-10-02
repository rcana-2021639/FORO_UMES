'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { CaretDownIcon, CaretUpIcon, CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr';
import { Arrow } from '@/components/ui/Arrow';
import { ModalityIcon } from '@/components/ui/ModalityIcon';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { MODALITY_LABEL, yearOf, type LevelCounts, type ModalityCounts } from '@/lib/format';
import { mediaUrl } from '@/lib/api';
import type { ProgramLevel, ProgramModality, University } from '@/lib/types';

type Key = 'order' | 'name' | 'joined' | 'total' | ProgramLevel;

interface Row {
  u: University;
  joined: number | null;
  total: number;
  levels: LevelCounts;
  modalities: ModalityCounts;
}

const MODALITIES: ProgramModality[] = ['Presencial', 'Hibrida', 'Virtual'];
const EMPTY_LEVELS: LevelCounts = { Maestria: 0, Doctorado: 0, Especializacion: 0, Diplomado: 0 };
const EMPTY_MOD: ModalityCounts = { Presencial: 0, Virtual: 0, Hibrida: 0 };

/**
 * Vista "Comparar" de /universidades (DESIGN_NOTES §28.4, fase 3): las nueve en una tabla con lo
 * que alguien compara al elegir dónde estudiar (cuántos programas de cada nivel, modalidades y
 * desde cuándo está en el Foro). Cada encabezado ordena; las filas se reacomodan deslizándose a su
 * nuevo lugar en vez de saltar. Cada cifra lleva una barra proporcional para leer de un vistazo.
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
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: 'order', desc: false });

  const rows: Row[] = useMemo(
    () =>
      universities.map((u) => {
        const lv = levels[u.documentId] ?? EMPTY_LEVELS;
        return {
          u,
          joined: yearOf(u.joinedForumAt),
          total: LEVELS.reduce((n, l) => n + lv[l], 0),
          levels: lv,
          modalities: modalities[u.documentId] ?? EMPTY_MOD,
        };
      }),
    [universities, levels, modalities]
  );

  const max = useMemo(() => {
    const m: Record<string, number> = { total: 1 };
    for (const l of LEVELS) m[l] = Math.max(1, ...rows.map((r) => r.levels[l]));
    m.total = Math.max(1, ...rows.map((r) => r.total));
    return m;
  }, [rows]);

  const sorted = useMemo(() => {
    const val = (r: Row): number | string => {
      switch (sort.key) {
        case 'order':
          return r.u.displayOrder;
        case 'name':
          return r.u.acronym ?? r.u.name;
        case 'joined':
          return r.joined ?? 9999;
        case 'total':
          return r.total;
        default:
          return r.levels[sort.key];
      }
    };
    // En un empate manda siempre el orden oficial del Foro, en cualquier sentido
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      const c = typeof x === 'string' ? x.localeCompare(String(y), 'es') : x - (y as number);
      return (sort.desc ? -c : c) || a.u.displayOrder - b.u.displayOrder;
    });
  }, [rows, sort]);

  // Las cifras empiezan de mayor a menor (lo que se busca al comparar); el nombre y el año, al revés
  const toggle = (key: Key) =>
    setSort((s) =>
      s.key === key
        ? { key, desc: !s.desc }
        : { key, desc: key !== 'name' && key !== 'joined' && key !== 'order' }
    );

  const head = (key: Key, label: string, className?: string) => {
    const on = sort.key === key;
    const Icon = !on ? CaretUpDownIcon : sort.desc ? CaretDownIcon : CaretUpIcon;
    return (
      <th
        scope="col"
        className={className}
        aria-sort={on ? (sort.desc ? 'descending' : 'ascending') : 'none'}
      >
        <button type="button" className="cmp__sort" data-on={on} onClick={() => toggle(key)}>
          {label}
          <Icon aria-hidden weight="bold" />
        </button>
      </th>
    );
  };

  return (
    <div className="cmp" data-reveal="up">
      <div
        className="cmp__scroll"
        tabIndex={0}
        aria-label="Tabla comparativa, se desplaza a los lados"
      >
        <table className="cmp__table">
          <caption className="sr-only">
            Comparación de las nueve universidades del Foro: programas por nivel, modalidades y año
            de ingreso. Los encabezados ordenan la tabla.
          </caption>
          <thead>
            <tr>
              {head('name', 'Universidad', 'cmp__first')}
              {head('joined', 'En el Foro')}
              {head('total', 'Programas')}
              {LEVELS.map((l) => (
                <th
                  key={l}
                  scope="col"
                  className="cmp__lvl-h"
                  style={{ '--c': LEVEL_META[l].color } as CSSProperties}
                >
                  <button
                    type="button"
                    className="cmp__sort"
                    data-on={sort.key === l}
                    onClick={() => toggle(l)}
                    title={LEVEL_META[l].plural}
                  >
                    <span className="cmp__glyph">{LEVEL_META[l].glyph}</span>
                    <span className="cmp__lvl-name">{LEVEL_META[l].plural}</span>
                    {sort.key === l ? (
                      sort.desc ? (
                        <CaretDownIcon aria-hidden weight="bold" />
                      ) : (
                        <CaretUpIcon aria-hidden weight="bold" />
                      )
                    ) : (
                      <CaretUpDownIcon aria-hidden weight="bold" />
                    )}
                  </button>
                </th>
              ))}
              <th scope="col">Modalidades</th>
              <th scope="col">
                <span className="sr-only">Perfil</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const logo = mediaUrl(r.u.logo?.formats?.thumbnail?.url ?? r.u.logo?.url);
              return (
                <motion.tr
                  key={r.u.documentId}
                  layout={reduced ? false : 'position'}
                  transition={{ type: 'spring', stiffness: 380, damping: 36, mass: 0.8 }}
                  className="cmp__row"
                  style={{ '--i': i } as CSSProperties}
                >
                  <th scope="row" className="cmp__first">
                    <Link href={`/universidades/${r.u.documentId}`} className="cmp__uni">
                      {logo ? (
                        <Image src={logo} alt="" width={64} height={64} className="cmp__seal" />
                      ) : (
                        <span aria-hidden className="cmp__seal cmp__seal--text">
                          {(r.u.acronym ?? r.u.name).slice(0, 3)}
                        </span>
                      )}
                      <span>
                        <span className="cmp__acr">{r.u.acronym ?? r.u.name}</span>
                        <span className="cmp__name">{r.u.name}</span>
                      </span>
                    </Link>
                  </th>
                  <td className="cmp__num">{r.joined ?? '—'}</td>
                  <td>
                    <Cell n={r.total} max={max.total} color="var(--color-violet-700)" strong />
                  </td>
                  {LEVELS.map((l) => (
                    <td key={l}>
                      <Cell n={r.levels[l]} max={max[l]} color={LEVEL_META[l].color} />
                    </td>
                  ))}
                  <td>
                    <span className="cmp__mods">
                      {MODALITIES.filter((m) => r.modalities[m] > 0).map((m) => (
                        <span key={m} className="cmp__mod" data-m={m}>
                          <ModalityIcon modality={m} /> {MODALITY_LABEL[m]} <b>{r.modalities[m]}</b>
                        </span>
                      ))}
                      {MODALITIES.every((m) => !r.modalities[m]) && '—'}
                    </span>
                  </td>
                  <td className="cmp__go">
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
      <p className="cmp__note">
        Pulsa un encabezado para ordenar. Las barras comparan cada cifra con la más alta de su
        columna.
      </p>
    </div>
  );
}

function Cell({
  n,
  max,
  color,
  strong,
}: {
  n: number;
  max: number;
  color: string;
  strong?: boolean;
}) {
  return (
    <span className="cmp__cell" data-zero={n === 0} data-strong={strong}>
      <span className="cmp__n">{n}</span>
      <span aria-hidden className="cmp__bar">
        <span style={{ '--w': n / max, background: color } as CSSProperties} />
      </span>
    </span>
  );
}
