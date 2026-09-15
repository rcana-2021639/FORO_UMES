import type { ReactNode } from 'react';
import { folio } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { SectionTheme } from '@/components/providers/SectionThemeObserver';

interface Props {
  id: string;
  number: number;
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  theme?: SectionTheme;
  children: ReactNode;
  className?: string;
  /** Sin padding lateral (para scroll horizontal, marquesinas…). */
  bleed?: boolean;
  aside?: ReactNode;
}

/**
 * Capítulo del "acta": foliado en mono al margen, kicker, título serif y contenido.
 * El fondo lo pone el SectionThemeObserver según `theme`.
 */
export function Section({
  id,
  number,
  kicker,
  title,
  intro,
  theme = 'paper',
  children,
  className,
  bleed,
  aside,
}: Props) {
  return (
    <section
      id={id}
      data-section-theme={theme}
      className={cn('section-y relative text-fg', className)}
      aria-labelledby={`${id}-title`}
    >
      <header className="container-x grid gap-6 md:grid-cols-12 md:gap-8">
        <div className="mono-label flex items-baseline gap-3 text-fg-muted md:col-span-2 md:flex-col md:gap-1">
          <span
            className="font-display text-[2rem] leading-none text-amber"
            style={{ fontVariationSettings: "'opsz' 40" }}
          >
            {folio(number)}
          </span>
          <span>{kicker}</span>
        </div>
        <div className="md:col-span-7">
          <h2 id={`${id}-title`}>{title}</h2>
          {intro && (
            <div className="mt-6 max-w-[52ch] text-[1.05rem] leading-relaxed text-fg-muted">
              {intro}
            </div>
          )}
        </div>
        {aside && <div className="md:col-span-3 md:justify-self-end">{aside}</div>}
      </header>
      <div className={cn('mt-14 md:mt-20', !bleed && 'container-x')}>{children}</div>
    </section>
  );
}
