import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  className?: string;
  /** Sin la losa de fondo: solo la barra y los puntos, en `currentColor`. */
  bare?: boolean;
  /** Texto accesible; sin él, el emblema es decorativo. */
  title?: string;
  /**
   * Movimiento (DESIGN_NOTES §28.3): `assemble` arma el 9 una vez al aparecer (nueve puntos en
   * círculo que se juntan: cinco se funden en la barra, cuatro quedan como puntos); `loop` lo arma
   * y lo desarma sin parar (estado de carga); `scroll` lo arma a medida que entra en pantalla con
   * el scroll (pie de página). Sin él, el emblema es estático.
   */
  motion?: 'assemble' | 'loop' | 'scroll';
}

/** Centros de los cuatro puntos: separados 6.9 unidades, centrados en la losa de 40. */
const DOTS = [9.65, 16.55, 23.45, 30.35];

/** La barra: 25.8 × 5.2 con centro en y = 24.2. Cinco puntos de su mismo grosor la cubren. */
const BAR = { x: 7.1, y: 21.6, w: 25.8, h: 5.2 };
const BAR_DOTS = [9.7, 14.85, 20, 25.15, 30.3];

/**
 * De dónde sale cada punto: nueve asientos en un círculo de radio 13 (la mesa redonda de las
 * primeras versiones), girado 20° para que los cuatro de arriba vayan a los puntos y los cinco de
 * abajo a la barra sin cruzarse. Desplazamiento = asiento − posición final.
 */
const FROM_TOP = [
  [-0.91, -1.5],
  [-1, -7.22],
  [1, -7.22],
  [0.91, -1.5],
];
const FROM_BAR = [
  [-2.5, -1.94],
  [-3.21, 5.76],
  [0, 8.8],
  [3.21, 5.76],
  [2.5, -1.94],
];
/** Orden en que se encienden los asientos al girar por el círculo (sentido horario desde arriba). */
const SEAT_TOP = [7, 8, 0, 1];
const SEAT_BAR = [6, 5, 4, 3, 2];

/**
 * Emblema del Foro: el número 9 en la numeración maya. Una barra vale cinco y cada punto, uno:
 * 5 + 4 = las nueve universidades. Es propio de Guatemala y no se parece al escudo de ninguna de
 * ellas. Colores por variables (`--emblem-bg`, `--emblem-fg`) para usarlo sobre claro u oscuro.
 *
 * Con `motion`, la animación es CSS pura (styles/v6.css): corre desde el primer pintado, no
 * depende de que React hidrate y, con menos movimiento, el emblema aparece ya armado.
 */
export function Emblem({ className, bare, title, motion }: Props) {
  const fill = bare ? 'currentColor' : 'var(--emblem-fg, #fff)';
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('shrink-0', motion && `emblem-fx emblem-fx--${motion}`, className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {!bare && <rect width="40" height="40" rx="9" fill="var(--emblem-bg, #3a2677)" />}
      <g fill={fill}>
        {DOTS.map((cx, i) =>
          motion ? (
            // El <g> exterior hace el saltito al pasar el cursor; el círculo, el viaje desde su asiento
            <g key={cx} className="emblem-fx__hop" style={{ '--i': i } as CSSProperties}>
              <circle
                className="emblem-fx__dot"
                cx={cx}
                cy="15"
                r="2.55"
                style={seat(FROM_TOP[i], SEAT_TOP[i])}
              />
            </g>
          ) : (
            <circle key={cx} cx={cx} cy="15" r="2.55" />
          )
        )}
        <rect
          className={motion ? 'emblem-fx__bar' : undefined}
          x={BAR.x}
          y={BAR.y}
          width={BAR.w}
          height={BAR.h}
          rx={BAR.h / 2}
        />
        {motion &&
          BAR_DOTS.map((cx, i) => (
            <circle
              key={cx}
              className="emblem-fx__fuse"
              cx={cx}
              cy={BAR.y + BAR.h / 2}
              r={BAR.h / 2}
              style={seat(FROM_BAR[i], SEAT_BAR[i])}
            />
          ))}
      </g>
    </svg>
  );
}

function seat([x, y]: number[], order: number): CSSProperties {
  return { '--x': `${x}px`, '--y': `${y}px`, '--s': order } as CSSProperties;
}
