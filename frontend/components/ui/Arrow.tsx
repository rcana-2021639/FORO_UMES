import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/lib/cn';

type Dir = 'right' | 'left' | 'up-right' | 'down';

const ICON = {
  right: ArrowRightIcon,
  left: ArrowLeftIcon,
  'up-right': ArrowUpRightIcon,
  down: ArrowDownIcon,
} as const;

/**
 * Flecha de los enlaces y botones (Phosphor, DESIGN_NOTES §28.3). Al pasar el cursor por el enlace
 * que la contiene, la flecha sale por su lado y otra igual entra por el opuesto: "vas hacia allá".
 * Son dos copias en una ventana de 1 em; solo se mueven con transform (styles/v6.css, `.arrow-fx`).
 * `right` para seguir dentro del sitio, `up-right` para sitios externos, `left` para volver y
 * `down` para bajar en la misma página.
 */
export function Arrow({ dir = 'right', className }: { dir?: Dir; className?: string }) {
  const Icon = ICON[dir];
  return (
    <span aria-hidden className={cn('arrow-fx', `arrow-fx--${dir}`, className)}>
      <Icon className="arrow-fx__a" weight="regular" />
      <Icon className="arrow-fx__b" weight="regular" />
    </span>
  );
}
