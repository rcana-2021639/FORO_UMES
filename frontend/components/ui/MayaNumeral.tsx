import { cn } from '@/lib/cn';

interface Props {
  /** 1 a 19. */
  n: number;
  className?: string;
}

/**
 * Un número en la numeración maya, como marca de capítulo: puntos (unidades) sobre barras (cincos).
 * Es la misma lógica del emblema del Foro (el 9: una barra y cuatro puntos). Decorativo: el número
 * que importa ya lo dice el texto de al lado.
 */
export function MayaNumeral({ n, className }: Props) {
  const value = Math.min(19, Math.max(1, Math.round(n)));
  const bars = Math.floor(value / 5);
  const dots = value % 5;
  const W = 24;
  const dotR = 2.1;
  const gap = 6;
  const barH = 3.6;
  const rowGap = 2.6;
  const dotRow = dots ? dotR * 2 : 0;
  const height =
    dotRow + (dots && bars ? rowGap : 0) + bars * barH + Math.max(0, bars - 1) * rowGap;
  const start = W / 2 - ((dots - 1) * gap) / 2;
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${height}`}
      className={cn('maya-numeral shrink-0', className)}
      style={{ aspectRatio: `${W} / ${height}` }}
      fill="currentColor"
    >
      {Array.from({ length: dots }, (_, i) => (
        <circle key={`d${i}`} cx={start + i * gap} cy={dotR} r={dotR} />
      ))}
      {Array.from({ length: bars }, (_, i) => (
        <rect
          key={`b${i}`}
          x={1}
          y={dotRow + (dots ? rowGap : 0) + i * (barH + rowGap)}
          width={W - 2}
          height={barH}
          rx={barH / 2}
        />
      ))}
    </svg>
  );
}
