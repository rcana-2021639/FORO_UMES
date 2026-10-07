import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { SectionTheme } from '@/components/providers/SectionThemeObserver';
import { FoldText } from '@/components/fx/FoldText';
import { MayaNumeral } from './MayaNumeral';
import type { ScribbleKind } from './Scribble';

interface Props {
  id: string;
  /** Etiqueta corta del capítulo (va en versalitas, seguida de un filete). */
  kicker: string;
  /** Número del capítulo en la portada: se marca con su numeral maya junto a la etiqueta. */
  index?: number;
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
  /** Capa de fondo a pantalla de sección (canvas, estela…); va detrás del contenido. */
  backdrop?: ReactNode;
  /** Palabra del título marcada a mano (v7 "Anuario anotado"). */
  mark?: { word: string; kind: ScribbleKind };
}

/**
 * Capítulo de la portada (v5, DESIGN_NOTES §27). Arriba, la etiqueta en versalitas con el numeral
 * maya del capítulo y un filete que cruza la retícula; debajo, el título a la izquierda y la
 * explicación con su botón a la derecha, alineados por abajo. Al entrar en pantalla se arma en
 * cascada: la etiqueta llega de la izquierda, el filete se dibuja, el título se despliega palabra a
 * palabra (FoldText), la explicación se enfoca y el botón sube.
 */
export function Section({
  id,
  kicker,
  index,
  title,
  intro,
  theme = 'paper',
  children,
  className,
  bleed,
  aside,
  rhythm = 'normal',
  backdrop,
  mark,
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
      data-fx-root
      className={cn(
        'relative isolate text-fg',
        (theme === 'dusk' || theme === 'night') && 'section-dark',
        theme === 'dusk' && 'section-dark--dusk',
        pad,
        className
      )}
      aria-labelledby={`${id}-title`}
    >
      {backdrop && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {backdrop}
        </div>
      )}
      <header className="sec-head container-x relative z-10">
        <div className="sec-head__top">
          <p data-reveal="left" className="sec-head__label eyebrow">
            {index != null && <MayaNumeral n={index} className="sec-head__maya" />}
            <span>{kicker}</span>
          </p>
          <span aria-hidden data-reveal="line" className="sec-head__rule" />
        </div>
        <div className="sec-head__body grid gap-6 md:grid-cols-12 md:gap-x-10">
          <h2 id={`${id}-title`} className="md:col-span-7">
            {typeof title === 'string' ? (
              <FoldText text={title} splitBy="word" hinge="bottom" stagger={0.07} mark={mark} />
            ) : (
              title
            )}
          </h2>
          {(intro || aside) && (
            <div className="flex flex-col items-start gap-6 md:col-span-5 md:self-end">
              {intro && (
                <div data-reveal="blur" className="sec-head__intro">
                  {intro}
                </div>
              )}
              {aside && <div data-reveal="up">{aside}</div>}
            </div>
          )}
        </div>
      </header>
      <div
        className={cn(
          'relative z-10',
          rhythm === 'tight' ? 'mt-8 md:mt-10' : 'mt-10 md:mt-14',
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
