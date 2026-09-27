'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  active: boolean;
  onToggle: () => void;
  /** Texto accesible; el visual es solo la estrella. */
  label: string;
  size?: number;
  className?: string;
}

/**
 * Estrella de "guardar". Adaptada de React Bits `PulseHeart`: al activarse, el icono late con
 * sobreimpulso y un anillo de puntos sale disparado y se apaga. Sin librería de iconos: la
 * estrella es un path propio. Con reduced-motion solo cambia de estado.
 */
export function PulseStar({ active, onToggle, label, size = 32, className }: Props) {
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState(0);
  const [beating, setBeating] = useState(false);

  useEffect(() => {
    if (!beating) return;
    const id = window.setTimeout(() => setBeating(false), 600);
    return () => window.clearTimeout(id);
  }, [beating]);

  const dots = 10;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!active && !reduced) {
          setBurst((b) => b + 1);
          setBeating(true);
        }
        onToggle();
      }}
      className={cn(
        'group/star relative isolate grid shrink-0 place-items-center rounded-full border transition-[border-color,background-color,color] duration-300 ease-(--ease-snap)',
        active
          ? 'border-accent-lilac bg-accent-lilac text-bg'
          : 'border-line text-fg-muted hover:border-accent-lilac hover:text-accent-lilac',
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.5}
        height={size * 0.5}
        aria-hidden
        className={cn('pulse-star__icon relative z-10', beating && 'is-beating')}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M12 3.2l2.6 5.6 6.1.7-4.5 4.2 1.2 6.1L12 16.8l-5.4 3 1.2-6.1L3.3 9.5l6.1-.7z" />
      </svg>
      {burst > 0 && !reduced && (
        <span key={burst} aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: dots }, (_, i) => (
            <span
              key={i}
              className="pulse-star__dot"
              style={
                {
                  '--a': `${(360 / dots) * i}deg`,
                  '--d': `${size * 0.85}px`,
                  '--c': i % 3 === 0 ? 'var(--color-clay)' : 'var(--accent-lilac)',
                  animationDelay: `${(i % 2) * 40}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
    </button>
  );
}
