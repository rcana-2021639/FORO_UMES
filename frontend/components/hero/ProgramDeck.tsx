'use client';

import Link from 'next/link';
import { CardSwap, Card } from './CardSwap';
import { LEVEL_LABEL, MODALITY_LABEL } from '@/lib/format';
import { LEVEL_META } from '@/lib/levels';
import type { ProgramLevel, ProgramModality } from '@/lib/types';

export interface DeckProgram {
  id: string;
  name: string;
  level: ProgramLevel;
  modality: ProgramModality;
  university: string;
  href: string;
}

/**
 * Vitrina de la portada: programas reales en un mazo `CardSwap` que se baraja solo (cae la del
 * frente, avanzan las demás). Se detiene al pasar el cursor para poder leer y pulsar la carta.
 */
export function ProgramDeck({ programs, total }: { programs: DeckProgram[]; total: number }) {
  const cards = programs.slice(0, 5);
  if (!cards.length) return null;

  return (
    <div className="deck relative mx-auto h-[25rem] w-full max-w-[31rem] sm:h-[27rem]">
      <span
        className="deck-chip float-y top-[2%] left-0"
        style={{ '--float-dur': '6s' } as React.CSSProperties}
      >
        <span className="deck-chip__dot" aria-hidden /> {total} programas
      </span>
      <span
        className="deck-chip float-y right-0 bottom-[3%]"
        style={{ '--float-dur': '7.5s', '--float-amp': '12px' } as React.CSSProperties}
      >
        Presencial · Virtual · Híbrida
      </span>

      <div className="deck-stage absolute bottom-[14%] left-[4%]">
        <CardSwap
          width={320}
          height={228}
          cardDistance={44}
          verticalDistance={48}
          delay={4600}
          pauseOnHover
          skewAmount={5}
          easing="elastic"
        >
          {cards.map((p) => {
            const meta = LEVEL_META[p.level];
            return (
              <Card
                key={p.id}
                customClass="deck-card"
                style={{ '--lv': meta.color } as React.CSSProperties}
              >
                <Link href={p.href} className="deck-card__inner">
                  <span className="flex items-center justify-between gap-3">
                    <span className="deck-card__level">{LEVEL_LABEL[p.level]}</span>
                    <span className="mono-label opacity-80">{p.university}</span>
                  </span>
                  <span className="deck-card__glyph" aria-hidden>
                    {meta.glyph}
                  </span>
                  <span className="block">
                    <span className="line-clamp-2 block font-display text-[1.35rem] leading-[1.12] [font-variation-settings:'opsz'_48,'SOFT'_40]">
                      {p.name}
                    </span>
                    <span className="ui-label mt-2 flex items-center justify-between opacity-85">
                      <span>{MODALITY_LABEL[p.modality]}</span>
                      <span aria-hidden>Ver universidad →</span>
                    </span>
                  </span>
                </Link>
              </Card>
            );
          })}
        </CardSwap>
      </div>
    </div>
  );
}
