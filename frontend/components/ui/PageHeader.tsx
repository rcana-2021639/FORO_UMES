'use client';

import type { ReactNode } from 'react';
import { useSplitReveal } from '@/hooks/useSplitReveal';
import { folio } from '@/lib/format';

interface Props {
  number?: number;
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
}

/** Cabecera de página interna: mismo foliado que los capítulos de la portada, con reveal. */
export function PageHeader({ number, kicker, title, intro, aside }: Props) {
  const h = useSplitReveal<HTMLHeadingElement>({ type: 'words', immediate: true, delay: 0.1 });
  const p = useSplitReveal<HTMLParagraphElement>({ type: 'lines', immediate: true, delay: 0.5 });
  return (
    <header className="container-x grid gap-6 pt-36 pb-14 md:grid-cols-12 md:gap-8 md:pt-44 md:pb-20">
      <div className="mono-label flex items-baseline gap-3 text-fg-muted md:col-span-2 md:flex-col md:gap-1">
        {number !== undefined && (
          <span
            className="font-display text-[2rem] leading-none text-accent"
            style={{ fontVariationSettings: "'opsz' 40" }}
          >
            {folio(number)}
          </span>
        )}
        <span>{kicker}</span>
      </div>
      <div className="md:col-span-7">
        <h1 ref={h} className="text-[clamp(2.5rem,6.5vw,6rem)] text-fg">
          {title}
        </h1>
        {intro && (
          <p ref={p} className="mt-6 max-w-[54ch] text-[1.05rem] leading-relaxed text-fg-muted">
            {intro}
          </p>
        )}
      </div>
      {aside && <div className="md:col-span-3 md:justify-self-end md:self-end">{aside}</div>}
    </header>
  );
}
