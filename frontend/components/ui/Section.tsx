import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { SectionTheme } from '@/components/providers/SectionThemeObserver';

interface Props {
  id: string;
  /** Frase corta en itálica sobre el título (no una etiqueta en mayúsculas). */
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  theme?: SectionTheme;
  children: ReactNode;
  className?: string;
  /** Sin padding lateral (para scroll horizontal, marquesinas…). */
  bleed?: boolean;
  aside?: ReactNode;
  /** Ritmo: 'tight' para capítulos cortos, 'wide' para los que necesitan aire. */
  rhythm?: 'tight' | 'normal' | 'wide';
}

/**
 * Capítulo de la portada. La marca de asiento (un arco) sustituye a la numeración:
 * los capítulos no son una secuencia, son sillas alrededor de la misma mesa.
 */
export function Section({
  id,
  kicker,
  title,
  intro,
  theme = 'paper',
  children,
  className,
  bleed,
  aside,
  rhythm = 'normal',
}: Props) {
  const pad =
    rhythm === 'tight'
      ? 'py-[var(--section-y-tight)]'
      : rhythm === 'wide'
        ? 'py-[calc(var(--section-y)*1.25)]'
        : 'section-y';
  return (
    <section
      id={id}
      data-section-theme={theme}
      className={cn('relative text-fg', pad, className)}
      aria-labelledby={`${id}-title`}
    >
      <header className="container-x grid gap-5 md:grid-cols-12 md:gap-8">
        <div className="flex items-start gap-3 md:col-span-3">
          <SeatMark />
          <p className="eyebrow max-w-[18ch] text-fg-muted">{kicker}</p>
        </div>
        <div className="md:col-span-6">
          <h2 id={`${id}-title`}>{title}</h2>
          {intro && (
            <div className="mt-6 max-w-[50ch] text-[1.05rem] leading-relaxed text-fg-muted">
              {intro}
            </div>
          )}
        </div>
        {aside && <div className="md:col-span-3 md:justify-self-end">{aside}</div>}
      </header>
      <div
        className={cn(
          rhythm === 'tight' ? 'mt-10 md:mt-14' : 'mt-14 md:mt-20',
          !bleed && 'container-x'
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** Arco de "asiento": un cuarto de la mesa, con el punto del que habla. */
export function SeatMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn('mt-1 h-5 w-5 shrink-0 text-accent', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <path d="M3 12a9 9 0 0 1 9-9" strokeLinecap="round" />
      <path d="M21 12a9 9 0 0 1-9 9" strokeLinecap="round" opacity="0.45" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
