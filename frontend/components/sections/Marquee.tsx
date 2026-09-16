'use client';

import { useRef } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  items: string[];
  /** px/s base. */
  velocity?: number;
  className?: string;
}

/**
 * Marquesina cuya velocidad y sentido siguen la velocidad del scroll. Patrón de React Bits
 * `TextAnimations/ScrollVelocity` (Motion useVelocity + useAnimationFrame), reducido a lo esencial
 * y con 4 copias medidas por ResizeObserver. Con reduced-motion queda estática.
 */
export function Marquee({ items, velocity = 60, className }: Props) {
  const reduced = useReducedMotion();
  const copyRef = useRef<HTMLSpanElement>(null);
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduced) return;
    const w = copyRef.current?.offsetWidth ?? 0;
    if (!w) return;
    let move = dir.current * velocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * move * Math.abs(f);
    let next = baseX.get() + move;
    // envolver en [-w, 0)
    next = ((next % w) - w) % w;
    baseX.set(next);
  });

  const text = items.join('   ·   ');

  return (
    <div
      aria-hidden
      className={`overflow-hidden border-y border-line py-4 whitespace-nowrap ${className ?? ''}`}
    >
      <motion.div className="flex w-max" style={{ x: baseX }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            ref={i === 0 ? copyRef : undefined}
            className="mono-label pr-[3em] text-[0.8rem] text-fg-muted"
          >
            {text}
            <span className="pl-[3em] text-accent">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
