import { cn } from '@/lib/cn';

/**
 * Flecha de navegación del sitio: un chevrón de trazo fino, sin círculo, con un rótulo corto
 * debajo para que no haya que adivinar qué hace. El tamaño lo marca `--chev-size`.
 */
export function Chevron({
  dir,
  label,
  className,
}: {
  dir: 'prev' | 'next';
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn('chev', dir === 'prev' ? 'chev--prev' : 'chev--next', className)}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="chev__icon">
        <path d={dir === 'prev' ? 'M15 4 7 12l8 8' : 'm9 4 8 8-8 8'} />
      </svg>
      {label && <span className="chev__label">{label}</span>}
    </span>
  );
}
