import { cn } from '@/lib/cn';

interface Props {
  className?: string;
  /** Sin la losa de fondo: solo la barra y los puntos, en `currentColor`. */
  bare?: boolean;
  /** Texto accesible; sin él, el emblema es decorativo. */
  title?: string;
}

/** Centros de los cuatro puntos: separados 6.9 unidades, centrados en la losa de 40. */
const DOTS = [9.65, 16.55, 23.45, 30.35];

/**
 * Emblema del Foro: el número 9 en la numeración maya. Una barra vale cinco y cada punto, uno:
 * 5 + 4 = las nueve universidades. Es propio de Guatemala y no se parece al escudo de ninguna de
 * ellas. Colores por variables (`--emblem-bg`, `--emblem-fg`) para usarlo sobre claro u oscuro.
 */
export function Emblem({ className, bare, title }: Props) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {!bare && <rect width="40" height="40" rx="9" fill="var(--emblem-bg, #3a2677)" />}
      <g fill={bare ? 'currentColor' : 'var(--emblem-fg, #fff)'}>
        {DOTS.map((cx) => (
          <circle key={cx} cx={cx} cy="15" r="2.55" />
        ))}
        <rect x="7.1" y="21.6" width="25.8" height="5.2" rx="2.6" />
      </g>
    </svg>
  );
}
