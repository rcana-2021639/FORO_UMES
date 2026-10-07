'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LEVELS, LEVEL_META } from '@/lib/levels';
import { LEVEL_LABEL } from '@/lib/format';
import { getQuality } from '@/lib/quality';
import { MayaNumber } from '@/components/ui/MayaNumber';
import type { ProgramLevel } from '@/lib/types';

export interface OfferRow {
  documentId: string;
  acronym: string;
  programs: { name: string; level: ProgramLevel }[];
}

/** De cinco en cinco, como se cuenta en la numeración maya. */
const chunk = <T,>(xs: T[], n: number) =>
  Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

/**
 * Cabecera de /programas (DESIGN_NOTES §29.7): **la cuenta maya**. Cada universidad es una varilla
 * de ábaco con una cuenta por programa, del color de su nivel. Al entrar, las cuentas se deslizan a
 * su sitio y, cada cinco, se funden en una barra —así se escriben los números mayas: puntos que
 * valen uno y barras que valen cinco—; al final de cada varilla, su total en cifra maya. Al señalar
 * una varilla, sus barras se abren otra vez en cuentas y cada una dice qué programa es.
 * Es una figura: para lectores de pantalla se resume en el pie; la lista completa está debajo.
 */
export function OfferAbacus({ rows, total }: { rows: OfferRow[]; total: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  // Las cuentas se funden en barras después de llegar (una sola vez, al verse la figura)
  const [fused, setFused] = useState(false);
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    name: string;
    level: ProgramLevel;
  } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (getQuality() === 'still') {
      const id = window.setTimeout(() => setFused(true), 0);
      return () => window.clearTimeout(id);
    }
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        // Lo que tardan en llegar las cuentas de la última varilla
        timer = window.setTimeout(() => setFused(true), 1100 + rows.length * 70);
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [rows.length]);

  const show = (e: React.PointerEvent<HTMLSpanElement>, name: string, level: ProgramLevel) => {
    const host = box.current?.getBoundingClientRect();
    const r = e.currentTarget.getBoundingClientRect();
    if (!host) return;
    setTip({ x: r.left + r.width / 2 - host.left, y: r.top - host.top, name, level });
  };

  return (
    <figure className="abacus" aria-label={`Toda la oferta: ${total} programas`}>
      <div
        ref={box}
        className="abacus__frame"
        data-fused={fused || undefined}
        data-reveal-group=""
        onPointerLeave={() => {
          setTip(null);
          setOpen(null);
        }}
      >
        {rows.map((r, row) => (
          <div
            key={r.documentId}
            className="abacus__row"
            data-open={open === row || undefined}
            onPointerEnter={() => setOpen(row)}
          >
            <Link
              href={`/universidades/${r.documentId}`}
              className="abacus__uni"
              onFocus={() => setOpen(row)}
            >
              {r.acronym}
            </Link>
            <span className="abacus__rod" aria-hidden>
              {chunk(r.programs, 5).map((g, gi) => (
                <span key={gi} className="abacus__group" data-five={g.length === 5 || undefined}>
                  {g.map((p, i) => (
                    <span
                      key={`${p.name}-${i}`}
                      className="abacus__bead"
                      data-level={p.level}
                      data-reveal="bead"
                      data-reveal-at={row * 70 + (gi * 5 + i) * 28}
                      style={{ '--c': LEVEL_META[p.level].color } as CSSProperties}
                      onPointerEnter={(e) => show(e, p.name, p.level)}
                    />
                  ))}
                </span>
              ))}
            </span>
            <span className="abacus__count">
              <MayaNumber value={r.programs.length} className="abacus__maya" />
              <b>{r.programs.length}</b>
            </span>
          </div>
        ))}
        {tip && (
          <span
            className="abacus__tip"
            style={{ left: tip.x, top: tip.y, '--c': LEVEL_META[tip.level].color } as CSSProperties}
            aria-hidden
          >
            <b>{LEVEL_LABEL[tip.level]}</b>
            {tip.name}
          </span>
        )}
      </div>
      <figcaption className="abacus__legend">
        <span>
          Una cuenta, un programa; cada cinco se funden en una barra, como en la numeración maya.
        </span>
        <span className="abacus__keys">
          {LEVELS.map((l) => (
            <span key={l} className="abacus__key">
              <span
                aria-hidden
                className="abacus__bead"
                data-level={l}
                style={{ '--c': LEVEL_META[l].color } as CSSProperties}
              />
              {LEVEL_META[l].plural}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
