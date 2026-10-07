'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { Emblem } from './Emblem';
import { brandOf } from '@/lib/universities';

export interface StampOption {
  id: string;
  acronym: string;
  name: string;
  logo?: string | null;
  /** Cuántos programas quedan con los demás filtros puestos. */
  count: number;
}

/**
 * Filtro por universidad del catálogo (DESIGN_NOTES §29.7): en vez de un desplegable, sus nueve
 * sellos en una tira, cada uno con cuántos programas suyos coinciden con lo demás que se filtró. El
 * elegido "se estampa" (cae como un sello de goma y queda con un aro de tinta en el color de su
 * universidad: su color solo aparece en lo suyo). "Todas" es el emblema del Foro. Los que no tienen
 * nada con esos filtros se ven tenues, pero se pueden elegir.
 */
export function UniversityStamps({
  options,
  value,
  total,
  onChange,
}: {
  options: StampOption[];
  value: string;
  /** Total con los demás filtros (para "Todas"). */
  total: number;
  onChange: (id: string) => void;
}) {
  return (
    <div className="stamps" role="group" aria-label="Universidad">
      <span className="stamps__label">Universidad</span>
      <div className="stamps__strip">
        <button
          type="button"
          className="stamps__opt"
          aria-pressed={value === ''}
          onClick={() => onChange('')}
          title="Todas las universidades"
        >
          <span className="stamps__seal stamps__seal--all">
            <Emblem />
          </span>
          <span className="stamps__acr">Todas</span>
          <span className="stamps__n">{total}</span>
        </button>
        {options.map((o) => {
          const b = brandOf(o.acronym);
          return (
            <button
              key={o.id}
              type="button"
              className="stamps__opt"
              aria-pressed={value === o.id}
              data-empty={o.count === 0 || undefined}
              onClick={() => onChange(value === o.id ? '' : o.id)}
              title={o.name}
              aria-label={`${o.name}: ${o.count} programa${o.count === 1 ? '' : 's'}`}
              style={{ '--u': b.primary, '--u-text': b.text } as CSSProperties}
            >
              <span className="stamps__seal">
                {o.logo ? (
                  <Image src={o.logo} alt="" width={64} height={64} />
                ) : (
                  <span aria-hidden>{o.acronym.slice(0, 3)}</span>
                )}
              </span>
              <span className="stamps__acr">{o.acronym}</span>
              <span className="stamps__n">{o.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
