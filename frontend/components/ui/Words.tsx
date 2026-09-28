import type { ReactNode } from 'react';

/**
 * Parte un texto en palabras que suben desde su renglón (`data-reveal="rise"`, ver
 * lib/quality-script.ts). Se parte en el servidor, no en el navegador: el HTML ya llega con cada
 * palabra envuelta, así que nada cambia al hidratar y la entrada empieza en el primer pintado.
 *
 * Va dentro de un elemento con `data-reveal-group` (normalmente el título): ese es el disparador y
 * las palabras entran en cascada. La máscara (`.rw`) es un clip-path que desborda la caja, así que
 * el renglón mide lo mismo que sin partir.
 */
export function Words({ text, className }: { text: string; className?: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        !part ? null : /^\s+$/.test(part) ? (
          ' '
        ) : (
          <Word key={i} className={className}>
            {part}
          </Word>
        )
      )}
    </>
  );
}

/** Una sola pieza con la misma entrada (para una palabra con estilo propio dentro del título). */
export function Word({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className="rw">
      <span data-reveal="rise" className={className}>
        {children}
      </span>
    </span>
  );
}
