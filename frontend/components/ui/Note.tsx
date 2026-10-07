import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Scribble, type ScribbleKind } from './Scribble';

/**
 * Nota escrita a mano sobre el anuario (v7, DESIGN_NOTES §29.3): letra Shantell Sans, un poco
 * inclinada, en el violeta de la pluma, con una flecha opcional que apunta a lo que comenta. Entra
 * con un pequeño salto y la flecha se dibuja después (script de arranque, sin esperar a React).
 *
 * Es un comentario, no contenido nuevo: lo que dice debe estar también en el texto de alrededor o
 * ser una ayuda que se puede ignorar. Va `aria-hidden` salvo que se pida lo contrario.
 */
export function Note({
  children,
  arrow,
  tilt = -3,
  className,
  style,
  announce = false,
  at = 0,
}: {
  children: ReactNode;
  arrow?: Extract<ScribbleKind, 'arrow-left' | 'arrow-down' | 'arrow-right'>;
  /** Inclinación en grados. */
  tilt?: number;
  className?: string;
  style?: CSSProperties;
  /** Si la nota dice algo que no está en otro lado, que los lectores de pantalla la lean. */
  announce?: boolean;
  /** Momento (ms) dentro de su grupo de entrada. */
  at?: number;
}) {
  return (
    <span
      aria-hidden={announce ? undefined : true}
      className={cn('note', arrow && `note--${arrow}`, className)}
      style={{ ...style, '--note-tilt': `${tilt}deg` } as CSSProperties}
      data-reveal-group=""
    >
      <span className="note__text" data-reveal="note" data-reveal-at={at}>
        {children}
      </span>
      {arrow && <Scribble kind={arrow} className="note__arrow" at={at + 380} weight={3.2} />}
    </span>
  );
}
