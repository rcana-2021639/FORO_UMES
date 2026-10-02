'use client';

import Link from 'next/link';
import { useRef, useState, type CSSProperties } from 'react';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { LEVEL_LABEL } from '@/lib/format';
import type { ProgramLevel } from '@/lib/types';

export interface OfferRow {
  documentId: string;
  acronym: string;
  programs: { name: string; level: ProgramLevel }[];
}

/**
 * Cabecera de /programas (DESIGN_NOTES §28.4, fase 4): toda la oferta en puntos, uno por programa,
 * una fila por universidad, con el color de su nivel (los "unos" de la numeración maya otra vez).
 * Se ve de un golpe quién ofrece más y de qué. Al pasar el cursor por un punto aparece el nombre
 * del programa; la fila se resalta. Los puntos entran en una ola diagonal (CSS, `--d`).
 * Es una figura: para lectores de pantalla se resume en el pie; la lista completa está debajo.
 */
export function OfferDots({ rows, total }: { rows: OfferRow[]; total: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    name: string;
    level: ProgramLevel;
  } | null>(null);

  const show = (e: React.PointerEvent<HTMLSpanElement>, name: string, level: ProgramLevel) => {
    const host = box.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (!host) return;
    setTip({ x: r.left + r.width / 2 - host.left, y: r.top - host.top, name, level });
  };

  return (
    <figure className="offer-dots" aria-label={`Toda la oferta: ${total} programas`}>
      <div ref={box} className="offer-dots__grid" onPointerLeave={() => setTip(null)}>
        {rows.map((r, row) => (
          <div key={r.documentId} className="offer-dots__row">
            <Link href={`/universidades/${r.documentId}`} className="offer-dots__uni">
              {r.acronym}
            </Link>
            <span className="offer-dots__dots" aria-hidden>
              {r.programs.map((p, i) => (
                <span
                  key={`${p.name}-${i}`}
                  className="offer-dots__dot"
                  data-level={p.level}
                  style={{ '--c': LEVEL_META[p.level].color, '--d': row + i } as CSSProperties}
                  onPointerEnter={(e) => show(e, p.name, p.level)}
                />
              ))}
            </span>
            <span className="offer-dots__n">{r.programs.length}</span>
          </div>
        ))}
        {tip && (
          <span
            className="offer-dots__tip"
            style={{ left: tip.x, top: tip.y, '--c': LEVEL_META[tip.level].color } as CSSProperties}
            aria-hidden
          >
            <b>{LEVEL_LABEL[tip.level]}</b>
            {tip.name}
          </span>
        )}
      </div>
      <figcaption className="offer-dots__legend">
        <span>Un punto, un programa:</span>
        {LEVELS.map((l) => (
          <span key={l} className="offer-dots__key">
            <span
              aria-hidden
              className="offer-dots__dot"
              data-level={l}
              style={{ '--c': LEVEL_META[l].color } as CSSProperties}
            />
            {LEVEL_META[l].plural}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
