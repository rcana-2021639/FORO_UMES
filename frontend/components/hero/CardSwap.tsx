'use client';

import {
  Children,
  cloneElement,
  createRef,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

/**
 * Mazo de cartas que se barajan solas (React Bits `CardSwap`, GSAP). La carta del frente cae,
 * las demás avanzan un lugar y la que cayó vuelve al fondo. Adaptaciones: el timeline se mata al
 * desmontar, el mazo se detiene fuera de pantalla o con la pestaña oculta, y con menos movimiento
 * queda quieto en su posición de reposo.
 */
export interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  className?: string;
  children: ReactNode;
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ customClass, className, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={cn(
        'absolute top-1/2 left-1/2 [transform-style:preserve-3d] [backface-visibility:hidden] [will-change:transform]',
        customClass,
        className
      )}
    />
  )
);
Card.displayName = 'Card';

interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  });

export function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  className,
  children,
}: CardSwapProps) {
  const childArr = useMemo(
    () => Children.toArray(children) as ReactElement<CardProps>[],
    [children]
  );
  const count = childArr.length;
  const refs = useMemo<RefObject<HTMLDivElement | null>[]>(
    () => Array.from({ length: count }, () => createRef<HTMLDivElement>()),
    [count]
  );
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = refs.map((r) => r.current).filter((el): el is HTMLDivElement => !!el);
    const total = els.length;
    if (!total) return;
    const config =
      easing === 'elastic'
        ? {
            ease: 'elastic.out(0.6,0.9)',
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05,
          }
        : {
            ease: 'power1.inOut',
            durDrop: 0.8,
            durMove: 0.8,
            durReturn: 0.8,
            promoteOverlap: 0.45,
            returnDelay: 0.2,
          };

    let order = Array.from({ length: total }, (_, i) => i);
    els.forEach((el, i) =>
      placeNow(el, makeSlot(i, cardDistance, verticalDistance, total), skewAmount)
    );
    if (prefersReducedMotion() || total < 2) return;

    let tl: gsap.core.Timeline | null = null;
    let interval = 0;
    let hovering = false;
    let visible = true;

    const swap = () => {
      const [front, ...rest] = order;
      const elFront = els[front];
      tl = gsap.timeline();
      tl.to(elFront, { y: '+=500', duration: config.durDrop, ease: config.ease });
      tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
      rest.forEach((idx, i) => {
        const slot = makeSlot(i, cardDistance, verticalDistance, total);
        tl!.set(els[idx], { zIndex: slot.zIndex }, 'promote');
        tl!.to(
          els[idx],
          { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease },
          `promote+=${i * 0.15}`
        );
      });
      const backSlot = makeSlot(total - 1, cardDistance, verticalDistance, total);
      tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
      tl.call(() => void gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, 'return');
      tl.to(
        elFront,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        'return'
      );
      tl.call(() => {
        order = [...rest, front];
      });
    };

    // Solo baraja si se ve, la pestaña está activa y (si se pide) el cursor no está encima
    const running = () => visible && !document.hidden && !(pauseOnHover && hovering);
    const start = () => {
      if (interval || !running()) return;
      tl?.play();
      interval = window.setInterval(swap, delay);
    };
    const stop = () => {
      tl?.pause();
      window.clearInterval(interval);
      interval = 0;
    };
    const sync = () => (running() ? start() : stop());

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    const node = container.current!;
    io.observe(node);
    const enter = () => {
      hovering = true;
      sync();
    };
    const leave = () => {
      hovering = false;
      sync();
    };
    node.addEventListener('mouseenter', enter);
    node.addEventListener('mouseleave', leave);
    document.addEventListener('visibilitychange', sync);
    const first = window.setTimeout(() => {
      if (running()) swap();
      sync();
    }, 1400);

    return () => {
      window.clearTimeout(first);
      stop();
      tl?.kill();
      io.disconnect();
      node.removeEventListener('mouseenter', enter);
      node.removeEventListener('mouseleave', leave);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [refs, cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) =>
    isValidElement<CardProps>(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (e: React.MouseEvent<HTMLDivElement>) => {
            child.props.onClick?.(e);
            onCardClick?.(i);
          },
        } as CardProps & React.RefAttributes<HTMLDivElement>)
      : child
  );

  return (
    <div
      ref={container}
      className={cn('card-swap relative overflow-visible [perspective:900px]', className)}
      style={{ width, height }}
    >
      {rendered}
    </div>
  );
}
