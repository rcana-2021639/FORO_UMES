'use client';

import { useState, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

interface Props {
  front: ReactNode;
  back: ReactNode;
  /** Texto accesible del botón (qué hay al otro lado). */
  label: string;
  tiltMax?: number;
  perspective?: number;
  radius?: number;
  className?: string;
  onFlipChange?: (flipped: boolean) => void;
}

/**
 * Tarjeta que se da la vuelta. Adaptada de React Bits `FlipCard`: gira con un spring al hacer
 * click / Enter, se inclina siguiendo el cursor y un brillo suave recorre la cara. Sin arrastre:
 * en una lista de nueve tarjetas el gesto compite con el scroll. Con reduced-motion, gira sin
 * spring y no se inclina.
 */
export function FlipCard({
  front,
  back,
  label,
  tiltMax = 10,
  perspective = 1100,
  radius = 6,
  className,
  onFlipChange,
}: Props) {
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);

  const flipMv = useMotionValue(0);
  const flipSpring = useSpring(flipMv, { stiffness: 170, damping: 20, mass: 0.9 });
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const tiltX = useSpring(tx, { stiffness: 220, damping: 22 });
  const tiltY = useSpring(ty, { stiffness: 220, damping: 22 });
  const rotateY = useTransform([flipSpring, tiltY], ([f, t]) => (f as number) + (t as number));
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(60% 60% at ${gx}% ${gy}%, rgba(255,255,255,0.28), transparent 70%)`;

  const toggle = () => {
    const next = !flipped;
    setFlipped(next);
    if (reduced) flipMv.jump(next ? 180 : 0);
    else flipMv.set(next ? 180 : 0);
    onFlipChange?.(next);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ty.set((px - 0.5) * 2 * tiltMax);
    tx.set(-(py - 0.5) * 2 * tiltMax);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onLeave = () => {
    tx.set(0);
    ty.set(0);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={label}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        'group/flip relative block h-full w-full cursor-pointer text-left outline-none',
        className
      )}
      style={{ perspective }}
    >
      <motion.span
        className="relative block h-full w-full [transform-style:preserve-3d]"
        style={{ rotateY, rotateX: tiltX }}
      >
        <span className="flip-card__face" style={{ borderRadius: radius }}>
          {front}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover/flip:opacity-100"
            style={{ backgroundImage: glare }}
          />
        </span>
        <span className="flip-card__face flip-card__face--back" style={{ borderRadius: radius }}>
          {back}
        </span>
      </motion.span>
      <span className="pointer-events-none absolute inset-0 rounded-[6px] ring-2 ring-clay ring-offset-2 ring-offset-bg opacity-0 group-focus-visible/flip:opacity-100" />
    </div>
  );
}
