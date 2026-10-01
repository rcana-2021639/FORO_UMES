'use client';

import Link from 'next/link';
import { useCallback, useRef, type ReactNode } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react';
import { useMagnetic } from '@/hooks/useMagnetic';
import { cn } from '@/lib/cn';

/**
 * Sistema de botones "sello líquido" (DESIGN_NOTES §9):
 * - magnético (useMagnetic), radio 60 px
 * - relleno líquido: una capa de luz nácar con el texto en tinta entra desde la X del cursor
 *   mediante `clip-path: circle()` + spring; el texto cambia de color en el mismo píxel
 * - chispas al click: ahora las pone la capa global ClickSparkLayer (color por capítulo)
 * - loading: la capa se queda dentro y oscila como marea; el texto pasa a "Enviando…" en mono
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'icon';

export interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  href?: string;
  external?: boolean;
  type?: 'button' | 'submit';
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  'aria-label'?: string;
}

const BASE =
  'group relative isolate inline-flex select-none items-center justify-center overflow-visible ' +
  'rounded-[6px] border font-sans text-[0.93rem] font-semibold tracking-[-0.003em] ' +
  'transition-[border-color,opacity] duration-300 disabled:cursor-not-allowed disabled:opacity-50';

const VARIANT: Record<Variant, string> = {
  primary: 'h-12 gap-3 border-fg bg-bg px-6 text-fg',
  secondary: 'h-12 gap-3 border-fg/30 bg-transparent px-6 text-fg hover:border-fg',
  ghost: 'h-10 gap-2 border-transparent px-1 text-fg',
  icon: 'h-11 w-11 border-fg/30 bg-transparent text-fg hover:border-fg',
};

const LAYER: Record<Variant, string> = {
  primary: 'btn-pearl',
  secondary: 'bg-fg text-bg',
  ghost: '',
  icon: 'bg-fg text-bg',
};

export function Button({
  children,
  variant = 'primary',
  href,
  external,
  type = 'button',
  loading = false,
  loadingLabel = 'Enviando',
  disabled,
  className,
  onClick,
  ...rest
}: ButtonProps) {
  const { ref: magnetRef } = useMagnetic<HTMLAnchorElement & HTMLButtonElement>({
    radius: variant === 'ghost' ? 24 : 60,
    strength: variant === 'ghost' ? 0.2 : 0.35,
    innerStrength: 0,
  });
  const hovering = useRef(false);

  // Capa líquida: centro X (0–100 %) y radio (0–160 %) como valores de movimiento con spring
  const bx = useMotionValue(50);
  const br = useMotionValue(0);
  const sx = useSpring(bx, { stiffness: 260, damping: 26, mass: 0.5 });
  const sr = useSpring(br, { stiffness: 200, damping: 24, mass: 0.6 });
  const clip = useMotionTemplate`circle(${sr}% at ${sx}% 50%)`;

  const pctX = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };

  const onEnter = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      hovering.current = true;
      if (loading) return;
      bx.jump(pctX(e));
      br.set(160);
    },
    [bx, br, loading]
  );
  const onMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!hovering.current || loading) return;
      bx.set(pctX(e));
    },
    [bx, loading]
  );
  const onLeave = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      hovering.current = false;
      if (loading) return;
      bx.set(pctX(e));
      br.set(0);
    },
    [bx, br, loading]
  );

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  const isLiquid = variant !== 'ghost';
  const classes = cn(BASE, VARIANT[variant], className);

  const label = loading ? (
    <span className="inline-flex items-baseline">
      {loadingLabel}
      <span className="ml-0.5 inline-flex w-[1.1em]">
        <span className="animate-dot">.</span>
        <span className="animate-dot [animation-delay:160ms]">.</span>
        <span className="animate-dot [animation-delay:320ms]">.</span>
      </span>
    </span>
  ) : (
    children
  );

  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-3">{label}</span>
      {isLiquid && (
        <motion.span
          aria-hidden
          className={cn(
            'absolute inset-0 z-20 inline-flex items-center justify-center gap-3 rounded-[5px] will-change-[clip-path]',
            LAYER[variant],
            loading && 'animate-tide'
          )}
          style={loading ? undefined : { clipPath: clip }}
        >
          {label}
        </motion.span>
      )}
      {variant === 'ghost' && (
        <span
          aria-hidden
          className="absolute right-1 bottom-1 left-1 h-px origin-left scale-x-0 bg-current transition-transform duration-500 ease-(--ease-out-expo) group-hover:scale-x-100"
        />
      )}
    </>
  );

  const shared = {
    className: classes,
    onPointerEnter: onEnter,
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    onClick: handleClick,
    'aria-busy': loading || undefined,
    ...rest,
  };

  if (href) {
    const isExternal = external ?? /^https?:/.test(href);
    if (isExternal) {
      return (
        <a ref={magnetRef} href={href} target="_blank" rel="noopener noreferrer" {...shared}>
          {inner}
        </a>
      );
    }
    return (
      <Link ref={magnetRef} href={href} {...shared}>
        {inner}
      </Link>
    );
  }

  return (
    <button ref={magnetRef} type={type} disabled={disabled || loading} {...shared}>
      {inner}
    </button>
  );
}
