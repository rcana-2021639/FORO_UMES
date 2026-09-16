'use client';

import type { ReactNode } from 'react';
import { useSplitReveal } from '@/hooks/useSplitReveal';
import { SeatMark } from './Section';

interface Props {
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  aside?: ReactNode;
}

/** Cabecera de página interna: kicker itálico con marca de asiento, título con reveal por palabras. */
export function PageHeader({ kicker, title, intro, aside }: Props) {
  const h = useSplitReveal<HTMLHeadingElement>({ type: 'words', immediate: true, delay: 0.1 });
  const p = useSplitReveal<HTMLParagraphElement>({ type: 'lines', immediate: true, delay: 0.5 });
  return (
    <header className="container-x grid gap-5 pt-36 pb-14 md:grid-cols-12 md:gap-8 md:pt-44 md:pb-20">
      <div className="flex items-start gap-3 md:col-span-3">
        <SeatMark />
        <p className="eyebrow max-w-[18ch] text-fg-muted">{kicker}</p>
      </div>
      <div className="md:col-span-6">
        <h1 ref={h} className="text-[clamp(2.6rem,6.5vw,6rem)] text-fg">
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
