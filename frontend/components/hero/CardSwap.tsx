'use client';

import {
  Children,
  cloneElement,
  createRef,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
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
 *
 * El tamaño y la separación entre cartas los define el CSS del contenedor (`--dx`, `--dy`, en
 * px): el HTML del servidor ya llega con cada carta en su sitio (`--slot`), así que no hay salto
 * al hidratar. GSAP toma el relevo con los mismos valores y los vuelve a leer si cambian.
 *
 * Se puede manejar desde fuera (`ref.goTo`, `ref.next`, `ref.prev`, `ref.setHeld`): un click en
 * una carta del fondo la trae al frente.
 */
export interface CardSwapProps {
  delay?: number;
  pauseOnHover?: boolean;
  skewAmount?: number;
  easing?: 'linear' | 'elastic';
  /** Índice (en el orden original de los hijos) de la carta que queda al frente. */
  onFrontChange?: (idx: number) => void;
  className?: string;
  children: ReactNode;
}

export interface CardSwapHandle {
  goTo: (idx: number) => void;
  next: () => void;
  prev: () => void;
  /** Pausa manual (foco, botón): se suma a las pausas automáticas. */
  setHeld: (held: boolean) => void;
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
        'card-swap__card absolute top-1/2 left-1/2 [transform-style:preserve-3d] [backface-visibility:hidden] [will-change:transform]',
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

/** Separación entre cartas definida en CSS (px). */
function readGaps(el: HTMLElement) {
  const cs = getComputedStyle(el);
  return {
    dx: parseFloat(cs.getPropertyValue('--dx')) || 24,
    dy: parseFloat(cs.getPropertyValue('--dy')) || 20,
  };
}

export const CardSwap = forwardRef<CardSwapHandle, CardSwapProps>(function CardSwap(
  {
    delay = 5000,
    pauseOnHover = false,
    skewAmount = 6,
    easing = 'elastic',
    onFrontChange,
    className,
    children,
  },
  ref
) {
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
  // Orden actual (índices originales, el primero es el del frente) y acciones del efecto
  const order = useRef<number[]>([]);
  const api = useRef<CardSwapHandle | null>(null);
  const cb = useRef({ onFrontChange });
  cb.current = { onFrontChange };

  useImperativeHandle(ref, () => ({
    goTo: (i) => api.current?.goTo(i),
    next: () => api.current?.next(),
    prev: () => api.current?.prev(),
    setHeld: (h) => api.current?.setHeld(h),
  }));

  useEffect(() => {
    const els = refs.map((r) => r.current).filter((el): el is HTMLDivElement => !!el);
    const node = container.current;
    const total = els.length;
    if (!total || !node) return;
    const reduced = prefersReducedMotion();
    const auto =
      easing === 'elastic'
        ? { ease: 'elastic.out(0.6,0.9)', drop: 2, move: 2, back: 2, overlap: 0.9, lag: 0.05 }
        : { ease: 'power1.inOut', drop: 0.8, move: 0.8, back: 0.8, overlap: 0.45, lag: 0.2 };
    // Lo que pide el usuario responde al instante: sin el rebote largo del modo automático
    const manual = { ease: 'expo.out', drop: 0.75, move: 0.9, back: 0.9, overlap: 0.8, lag: 0.1 };

    let { dx, dy } = readGaps(node);
    order.current = Array.from({ length: total }, (_, i) => i);
    const placeAll = () =>
      order.current.forEach((idx, i) => placeNow(els[idx], makeSlot(i, dx, dy, total), skewAmount));
    placeAll();

    /** Solo la carta del frente es navegable; las demás se leen como decorado. */
    const markFront = () => {
      const front = order.current[0];
      els.forEach((el, i) => {
        const isFront = i === front;
        el.dataset.front = String(isFront);
        el.setAttribute('aria-hidden', String(!isFront));
        el.querySelectorAll<HTMLElement>('a, button').forEach((a) => {
          a.tabIndex = isFront ? 0 : -1;
        });
      });
      cb.current.onFrontChange?.(front);
    };
    markFront();

    let tl: gsap.core.Timeline | null = null;

    /** Lleva la carta `target` al frente: las que estaban delante caen y vuelven al fondo. */
    const bringToFront = (target: number, cfg: typeof auto) => {
      tl?.progress(1).kill();
      const k = order.current.indexOf(target);
      if (k <= 0) return;
      const dropped = order.current.slice(0, k);
      const next = [...order.current.slice(k), ...dropped];
      order.current = next;
      markFront();

      if (reduced) {
        placeAll();
        return;
      }

      // Las que caen se desvanecen en la caída y reaparecen ya en su sitio del fondo: así no
      // tapan lo que hay debajo del mazo mientras viajan
      tl = gsap.timeline();
      dropped.forEach((idx, i) => {
        tl!.to(els[idx], { y: '+=220', duration: cfg.drop, ease: cfg.ease }, i * 0.07);
        tl!.to(els[idx], { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, i * 0.07 + 0.05);
      });
      tl.addLabel('promote', `-=${cfg.drop * cfg.overlap}`);
      next.slice(0, total - dropped.length).forEach((idx, i) => {
        const slot = makeSlot(i, dx, dy, total);
        tl!.set(els[idx], { zIndex: slot.zIndex }, 'promote');
        tl!.to(
          els[idx],
          { x: slot.x, y: slot.y, z: slot.z, duration: cfg.move, ease: cfg.ease },
          `promote+=${i * 0.12}`
        );
      });
      // Reaparecen en el fondo solo cuando ya se desvanecieron del todo
      const faded = (dropped.length - 1) * 0.07 + 0.5;
      tl.addLabel('return', Math.max(tl.labels.promote + cfg.move * cfg.lag, faded));
      dropped.forEach((idx, j) => {
        const slot = makeSlot(total - dropped.length + j, dx, dy, total);
        tl!.set(
          els[idx],
          { zIndex: slot.zIndex, x: slot.x + 36, y: slot.y - 28, z: slot.z - 60 },
          `return+=${j * 0.06}`
        );
        tl!.to(
          els[idx],
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            autoAlpha: 1,
            duration: cfg.back,
            ease: 'expo.out',
          },
          `return+=${j * 0.06}`
        );
      });
    };

    // Temporizador: un tween vacío que se pausa y reanuda con el mazo
    let hovering = false;
    let visible = true;
    let held = false;
    const timer =
      reduced || total < 2
        ? null
        : gsap.delayedCall(delay / 1000, () => {
            bringToFront(order.current[1], auto);
            restartTimer();
          });
    timer?.pause();
    const restartTimer = () => {
      if (!timer) return;
      timer.restart(true);
      if (!running()) timer.pause();
    };

    // Solo baraja si se ve, la pestaña está activa y nadie la está usando
    const running = () => visible && !document.hidden && !(pauseOnHover && hovering) && !held;
    const sync = () => {
      if (!timer) return;
      if (running()) timer.resume();
      else timer.pause();
    };

    api.current = {
      goTo: (i) => {
        bringToFront(i, manual);
        restartTimer();
      },
      next: () => {
        bringToFront(order.current[1], manual);
        restartTimer();
      },
      prev: () => {
        bringToFront(order.current[total - 1], manual);
        restartTimer();
      },
      setHeld: (h) => {
        held = h;
        sync();
      },
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(node);
    // Si el contenedor cambia de tamaño y con él la separación (móvil ↔ escritorio), se recoloca
    const ro = new ResizeObserver(() => {
      const g = readGaps(node);
      if (g.dx === dx && g.dy === dy) return;
      ({ dx, dy } = g);
      tl?.progress(1).kill();
      placeAll();
    });
    ro.observe(node);
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
    // El primer ciclo espera a que termine la entrada de la portada
    const first = window.setTimeout(sync, 1400);

    return () => {
      window.clearTimeout(first);
      timer?.kill();
      tl?.kill();
      api.current = null;
      io.disconnect();
      ro.disconnect();
      node.removeEventListener('mouseenter', enter);
      node.removeEventListener('mouseleave', leave);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [refs, delay, pauseOnHover, skewAmount, easing]);

  const rendered = childArr.map((child, i) =>
    isValidElement<CardProps>(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          // Posición de reposo desde el servidor: el CSS coloca cada carta con `--slot`
          'data-front': i === 0 ? 'true' : 'false',
          style: { '--slot': i, ...(child.props.style ?? {}) } as React.CSSProperties,
          // Click en una carta del fondo: viene al frente en vez de seguir su enlace
          onClickCapture: (e: React.MouseEvent<HTMLDivElement>) => {
            if (order.current[0] !== i) {
              e.preventDefault();
              e.stopPropagation();
              api.current?.goTo(i);
            }
            child.props.onClickCapture?.(e);
          },
        } as CardProps & React.RefAttributes<HTMLDivElement>)
      : child
  );

  return (
    <div
      ref={container}
      className={cn('card-swap relative h-full w-full overflow-visible', className)}
      style={{ '--n': count } as React.CSSProperties}
    >
      {rendered}
    </div>
  );
});
