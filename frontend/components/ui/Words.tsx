import type { ReactNode } from 'react';
import { Scribble, type ScribbleKind } from './Scribble';

/** Compara palabras sin tildes, mayúsculas ni signos de puntuación. */
const bare = (w: string) =>
  w
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();

/**
 * Parte un texto en palabras que suben desde su renglón (`data-reveal="rise"`, ver
 * lib/quality-script.ts). Se parte en el servidor, no en el navegador: el HTML ya llega con cada
 * palabra envuelta, así que nada cambia al hidratar y la entrada empieza en el primer pintado.
 *
 * Va dentro de un elemento con `data-reveal-group` (normalmente el título): ese es el disparador y
 * las palabras entran en cascada. La máscara (`.rw`) es un clip-path que desborda la caja, así que
 * el renglón mide lo mismo que sin partir.
 */
export function Words({
  text,
  className,
  mark,
}: {
  text: string;
  className?: string;
  /** Una palabra marcada a mano (v7): el trazo se dibuja cuando la palabra ya subió. */
  mark?: { word: string; kind: ScribbleKind };
}) {
  // Cada pieza con su número de palabra y si es la marcada (la primera que coincide)
  const target = mark ? bare(mark.word) : null;
  const pieces: { part: string; word: number; marked: boolean }[] = [];
  let count = 0;
  let found = false;
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    const isWord = !/^\s+$/.test(part);
    const hit = isWord && !found && target !== null && bare(part) === target;
    if (hit) found = true;
    pieces.push({ part, word: isWord ? count++ : -1, marked: hit });
  }
  return (
    <>
      {pieces.map(({ part, word, marked }, i) => {
        if (word < 0) return ' ';
        const piece = (
          <Word key={i} className={className}>
            {part}
          </Word>
        );
        if (!marked || !mark) return piece;
        return (
          <span key={`m${i}`} className={`marked marked--${mark.kind}`}>
            {piece}
            <Scribble kind={mark.kind} at={word * 42 + 820} />
          </span>
        );
      })}
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
