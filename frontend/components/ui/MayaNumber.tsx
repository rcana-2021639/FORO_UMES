import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  value: number;
  className?: string;
  /**
   * Si se da (ms), cada pieza cae en su sitio con el script de arranque (`data-reveal="maya"`) a
   * partir de ese instante, en cascada, desde que su grupo (`data-reveal-group`) entra en pantalla.
   */
  revealAt?: number;
}

/** Medidas en unidades del SVG: el ancho de una barra y el paso entre puntos. */
const W = 24;
const DOT_R = 2.1;
const DOT_GAP = 6;
const BAR_H = 3.6;
const ROW_GAP = 2.4;
/** Separación entre niveles (veintenas y unidades): mayor que entre filas, para leer la posición. */
const LEVEL_GAP = 9;
const SHELL_H = 8;

/** Cifras en base 20, de la más alta a la más baja (así se escriben: la mayor arriba). */
export function vigesimal(n: number): number[] {
  let v = Math.max(0, Math.floor(n));
  if (v === 0) return [0];
  const out: number[] = [];
  while (v > 0) {
    out.unshift(v % 20);
    v = Math.floor(v / 20);
  }
  return out;
}

/** "124 en numeración maya: 6 veintenas y 4 unidades." Para el título accesible. */
export function mayaReading(n: number): string {
  const digits = vigesimal(n);
  // Valor de cada posición, de la más baja a la más alta
  const places: [string, string][] = [
    ['unidad', 'unidades'],
    ['veintena', 'veintenas'],
    ['vez 400', 'veces 400'],
    ['vez 8 000', 'veces 8 000'],
  ];
  const parts = digits
    .map((d, i) => ({ d, place: places[digits.length - 1 - i] }))
    .filter((p) => p.d > 0 && p.place)
    .map((p) => `${p.d} ${p.d === 1 ? p.place[0] : p.place[1]}`);
  const body = parts.length ? parts.join(' y ') : 'la concha, que vale cero';
  return `${n} en numeración maya: ${body}.`;
}

/**
 * Un número en la numeración maya posicional (base 20): cada nivel es una cifra de 0 a 19, con
 * puntos (unos) sobre barras (cincos), y el cero es una concha. Los niveles se apilan con la cifra
 * mayor arriba. Es el mismo sistema del emblema (el 9) y del numeral de cada capítulo; aquí sirve
 * para escribir las cifras del Foro "a la maya" junto a la cifra arábiga, que es la que se lee.
 *
 * Cada pieza lleva `--k` (su orden) para que el CSS la haga caer en su sitio en cascada, o, con
 * `revealAt`, su momento exacto para el script de arranque.
 */
export function MayaNumber({ value, className, revealAt }: Props) {
  const fall = (k: number) =>
    revealAt == null ? {} : { 'data-reveal': 'maya', 'data-reveal-at': revealAt + k * 75 };
  const digits = vigesimal(value);
  let y = 0;
  let k = 0;
  const pieces: React.ReactNode[] = [];

  digits.forEach((d, level) => {
    if (level > 0) {
      // Filete tenue entre pisos: deja leer que son dos cifras (veintenas arriba, unidades abajo)
      pieces.push(
        <line
          key={`f${level}`}
          className="maya-num__floor"
          {...(revealAt == null ? {} : { 'data-reveal': 'fade', 'data-reveal-at': revealAt + 200 })}
          x1={3}
          x2={W - 3}
          y1={y + LEVEL_GAP / 2}
          y2={y + LEVEL_GAP / 2}
          stroke="currentColor"
          strokeWidth={0.8}
          strokeDasharray="1.6 1.6"
        />
      );
      y += LEVEL_GAP;
    }
    if (d === 0) {
      pieces.push(<Shell key={`s${level}`} y={y} k={k} reveal={fall(k)} />);
      k++;
      y += SHELL_H;
      return;
    }
    const dots = d % 5;
    const bars = Math.floor(d / 5);
    if (dots) {
      const start = W / 2 - ((dots - 1) * DOT_GAP) / 2;
      for (let i = 0; i < dots; i++) {
        pieces.push(
          <circle
            key={`d${level}-${i}`}
            {...fall(k)}
            className="maya-num__el"
            cx={start + i * DOT_GAP}
            cy={y + DOT_R}
            r={DOT_R}
            style={{ '--k': k++ } as CSSProperties}
          />
        );
      }
      y += DOT_R * 2 + (bars ? ROW_GAP : 0);
    }
    for (let i = 0; i < bars; i++) {
      pieces.push(
        <rect
          key={`b${level}-${i}`}
          {...fall(k)}
          className="maya-num__el maya-num__bar"
          x={1}
          y={y}
          width={W - 2}
          height={BAR_H}
          rx={BAR_H / 2}
          style={{ '--k': k++ } as CSSProperties}
        />
      );
      y += BAR_H + (i < bars - 1 ? ROW_GAP : 0);
    }
  });

  return (
    <svg
      aria-hidden
      viewBox={`-1 -1 ${W + 2} ${y + 2}`}
      className={cn('maya-num', className)}
      style={{ aspectRatio: `${W + 2} / ${y + 2}` }}
      fill="currentColor"
    >
      {pieces}
    </svg>
  );
}

/** El cero maya: una concha (contorno de lente con dos pliegues). */
function Shell({ y, k, reveal }: { y: number; k: number; reveal?: object }) {
  const cy = y + SHELL_H / 2;
  return (
    <g {...reveal} className="maya-num__el" style={{ '--k': k } as CSSProperties}>
      <path
        d={`M2 ${cy} Q${W / 2} ${y - 2.6} ${W - 2} ${cy} Q${W / 2} ${y + SHELL_H + 2.6} 2 ${cy} Z`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d={`M7 ${cy - 1.6} Q${W / 2} ${cy + 0.6} ${W - 7} ${cy - 1.6} M8.5 ${cy + 1.6} Q${W / 2} ${cy + 3.4} ${W - 8.5} ${cy + 1.6}`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </g>
  );
}
