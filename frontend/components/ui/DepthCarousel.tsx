'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { Chevron } from './Chevron';

export interface DepthItem {
  key: string;
  content: ReactNode;
  /** Se ejecuta al hacer click (sin arrastre) sobre la tarjeta ya enfocada. */
  onOpen?: () => void;
  label?: string;
  /** Clase extra para el marco de esta tarjeta (p. ej. la posición de la pestaña de una ficha). */
  className?: string;
}

/** Control desde fuera: llevar el carrusel a una tarjeta (con la misma animación de las flechas). */
export interface DepthCarouselApi {
  goTo: (index: number) => void;
}

interface Props {
  items: DepthItem[];
  cardWidth?: number;
  cardHeight?: number;
  radius?: number;
  depth?: number;
  spread?: number;
  tilt?: number;
  tiltDirection?: 'left' | 'right';
  perspective?: number;
  visibleCards?: number;
  falloff?: number;
  /** Sin efecto: el desenfoque por tarjeta se retiró por rendimiento (se recalculaba por fotograma). */
  blur?: number;
  duration?: number;
  ease?: string;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  onChange?: (index: number) => void;
  className?: string;
  ariaLabel?: string;
  apiRef?: React.RefObject<DepthCarouselApi | null>;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * Carrusel de profundidad. Adaptado de React Bits `DepthCarousel` con estos cambios:
 * - las diapositivas son tarjetas de contenido (no imágenes) y la enfocada es clicable
 * - las tarjetas del fondo se funden hacia el color de fondo vivo (`--bg`) en vez de
 *   oscurecerse con `brightness()`, para que funcione sobre piedra y sobre noche
 * - arrastre, rueda, flechas y puntos; `prefers-reduced-motion` salta las transiciones
 */
export function DepthCarousel({
  items,
  cardWidth = 300,
  cardHeight = 380,
  radius = 6,
  depth = 220,
  spread = 96,
  tilt = 22,
  tiltDirection = 'right',
  perspective = 1400,
  visibleCards = 4,
  falloff = 0.22,
  blur = 5,
  duration = 720,
  ease = 'power3.out',
  loop = true,
  showControls = true,
  showIndicators = true,
  onChange,
  className,
  ariaLabel = 'Carrusel',
  apiRef,
}: Props) {
  const count = items.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const veilRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Qué tarjetas estaban a la vista en el último fotograma: las ocultas no se vuelven a escribir
  const shownRef = useRef<boolean[]>([]);

  const posRef = useRef(0);
  const focusRef = useRef(0);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const scaleRef = useRef(1);
  const dragRef = useRef<{
    x: number;
    startPos: number;
    lastX: number;
    lastT: number;
    v: number;
    moved: boolean;
    id: number;
  } | null>(null);
  const wheelTimer = useRef<number | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const cfg = useMemo(
    () => ({
      count,
      depth,
      spread,
      tilt,
      tiltDirection,
      visibleCards,
      falloff,
      blur,
      duration,
      ease,
      loop,
      cardWidth,
      cardHeight,
    }),
    [
      count,
      depth,
      spread,
      tilt,
      tiltDirection,
      visibleCards,
      falloff,
      blur,
      duration,
      ease,
      loop,
      cardWidth,
      cardHeight,
    ]
  );
  const cfgRef = useRef(cfg);
  useEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);

  const [active, setActive] = useState(0);

  const layout = useCallback((pos: number) => {
    const c = cfgRef.current;
    const n = c.count;
    if (!n) return;
    const dir = c.tiltDirection === 'left' ? -1 : 1;
    const sc = scaleRef.current;
    for (let i = 0; i < n; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      let d = i - pos;
      if (c.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const back = Math.max(0, d);
      const az = Math.abs(d);
      // Las que ya salieron por la izquierda (d ≤ -1) son invisibles: tampoco se dibujan
      const shown = az <= c.visibleCards + 0.5 && d > -1.02;
      // Con decenas de tarjetas, solo se tocan las visibles (y una vez la que se acaba de ocultar)
      const was = shownRef.current[i];
      shownRef.current[i] = shown;
      if (!shown && was === false) continue;
      if (!shown) {
        // Fuera del abanico: fuera del documento (sin capa, sin pintura, sin pruebas de puntero)
        el.style.display = 'none';
        el.setAttribute('aria-hidden', 'true');
        continue;
      }
      if (was !== true) el.style.display = 'block';
      const tz = -c.depth * d;
      const tx = dir * c.spread * d;
      const ry = dir * c.tilt * clamp(d, 0, 1);
      const opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      // La profundidad la dan el velo, la escala y el giro. El desenfoque por tarjeta se quitó: se
      // recalculaba en cada fotograma del arrastre y obligaba a la GPU a re-filtrar cada tarjeta.
      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.zIndex = String(Math.round(2000 - d * 20));
      el.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';
      const hidden = String(Math.round(pos) !== i);
      if (el.getAttribute('aria-hidden') !== hidden) el.setAttribute('aria-hidden', hidden);
      const veil = veilRefs.current[i];
      if (veil) veil.style.opacity = clamp(back * c.falloff * 1.35, 0, 0.88).toFixed(3);
    }
  }, []);

  const tweenTo = useCallback(
    (target: number, animate: boolean) => {
      tweenRef.current?.kill();
      const c = cfgRef.current;
      const proxy = { p: posRef.current };
      const dur = animate && !prefersReducedMotion() ? c.duration / 1000 : 0;
      tweenRef.current = gsap.to(proxy, {
        p: target,
        duration: dur,
        ease: c.ease,
        onUpdate: () => {
          posRef.current = proxy.p;
          layout(proxy.p);
        },
        onComplete: () => {
          const n = c.count;
          if (n > 0) posRef.current = ((posRef.current % n) + n) % n;
          layout(posRef.current);
        },
      });
    },
    [layout]
  );

  const setFocus = useCallback(
    (raw: number, animate = true) => {
      const c = cfgRef.current;
      const n = c.count;
      if (!n) return;
      const idx = c.loop ? ((raw % n) + n) % n : clamp(raw, 0, n - 1);
      let delta = idx - posRef.current;
      if (c.loop && n > 1) {
        delta = ((delta % n) + n) % n;
        if (delta > n / 2) delta -= n;
      }
      tweenTo(posRef.current + delta, animate);
      if (idx !== focusRef.current) {
        focusRef.current = idx;
        setActive(idx);
        onChangeRef.current?.(idx);
      }
    },
    [tweenTo]
  );

  const navigateBy = useCallback((step: number) => setFocus(focusRef.current + step), [setFocus]);

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = { goTo: (i) => setFocus(i) };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, setFocus]);

  // Escala para que el carrusel quepa en anchos pequeños
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const c = cfgRef.current;
      // En el teléfono manda la tarjeta del frente (las laterales asoman por los bordes); en
      // pantallas anchas cabe el abanico completo
      const needed = w < 640 ? c.cardWidth + 72 : c.cardWidth + Math.abs(c.spread) * 2 + 120;
      scaleRef.current = clamp(w / needed, 0.5, 1);
      // El alto acompaña a la escala: sin esto, la tarjeta encogida quedaba en un hueco enorme
      root.style.height = `${Math.round(c.cardHeight * scaleRef.current + 96)}px`;
      layout(posRef.current);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [layout]);

  // Rueda horizontal / trackpad
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const c = cfgRef.current;
      if (c.count < 2) return;
      // Solo secuestramos el gesto si es claramente horizontal (no romper el scroll vertical)
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      tweenRef.current?.kill();
      const delta = e.deltaMode === 1 ? e.deltaX * 24 : e.deltaX;
      posRef.current += clamp(delta / (c.cardWidth * 0.9), -0.6, 0.6);
      layout(posRef.current);
      if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
      wheelTimer.current = window.setTimeout(() => setFocus(Math.round(posRef.current)), 130);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (wheelTimer.current) window.clearTimeout(wheelTimer.current);
    };
  }, [layout, setFocus]);

  // Si cambia la lista (filtro), volver al principio sin animar. Quien lo usa debe cambiar la
  // `key` del carrusel al cambiar de lista para que el índice activo también arranque en 0.
  useEffect(() => {
    posRef.current = 0;
    focusRef.current = 0;
    shownRef.current = [];
    layout(0);
  }, [count, layout]);

  useEffect(() => {
    layout(posRef.current);
  }, [layout, cfg]);

  useEffect(
    () => () => {
      tweenRef.current?.kill();
    },
    []
  );

  const stepPx = () => Math.max(cfgRef.current.cardWidth * 0.55 * scaleRef.current, 40);

  const onPointerDown = (e: React.PointerEvent) => {
    if (cfgRef.current.count < 2) return;
    tweenRef.current?.kill();
    dragRef.current = {
      x: e.clientX,
      startPos: posRef.current,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      rootRef.current?.setPointerCapture(drag.id);
    }
    if (!drag.moved) return;
    const now = performance.now();
    drag.v = (e.clientX - drag.lastX) / Math.max(now - drag.lastT, 1);
    drag.lastX = e.clientX;
    drag.lastT = now;
    posRef.current = drag.startPos - dx / stepPx();
    layout(posRef.current);
  };
  const onPointerEnd = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    const projected = posRef.current - (drag.v * 180) / stepPx();
    setFocus(Math.round(projected));
    // Evita que el click posterior al arrastre abra la tarjeta
    window.setTimeout(() => {
      justDragged.current = false;
    }, 0);
    justDragged.current = true;
  };
  const justDragged = useRef(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateBy(1);
    } else if (e.key === 'Enter' && items[focusRef.current]?.onOpen) {
      e.preventDefault();
      items[focusRef.current].onOpen?.();
    }
  };

  const onCardClick = (i: number) => {
    if (justDragged.current) return;
    if (i === focusRef.current) items[i].onOpen?.();
    else setFocus(i);
  };

  if (!count) return null;

  return (
    <div
      ref={rootRef}
      className={cn('depth-carousel', className)}
      style={
        { '--dc-perspective': `${perspective}px`, height: cardHeight + 96 } as React.CSSProperties
      }
      role="group"
      aria-roledescription="carrusel"
      aria-label={ariaLabel}
      tabIndex={0}

      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onKeyDown={onKeyDown}
    >
      <div className="depth-carousel__stage">
        {items.map((it, i) => (
          <div
            key={it.key}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={cn('depth-carousel__card', it.className)}
            style={{ width: cardWidth, height: cardHeight, borderRadius: radius }}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={it.label ?? `${i + 1} de ${count}`}
            data-active={active === i}
            onClick={() => onCardClick(i)}
          >
            {it.content}
            <span
              aria-hidden
              className="depth-carousel__veil"
              ref={(el) => {
                veilRefs.current[i] = el;
              }}
            />
          </div>
        ))}
      </div>

      {/* Zonas laterales: toda la franja es clicable, solo se ve la flecha */}
      {showControls && count > 1 && (
        <>
          <button
            type="button"
            className="depth-carousel__zone depth-carousel__zone--left"
            aria-label="Programa anterior"
            onClick={() => {
              if (!justDragged.current) navigateBy(-1);
            }}
          >
            <Chevron dir="prev" label="Anterior" className="depth-carousel__glyph" />
          </button>
          <button
            type="button"
            className="depth-carousel__zone depth-carousel__zone--right"
            aria-label="Programa siguiente"
            onClick={() => {
              if (!justDragged.current) navigateBy(1);
            }}
          >
            <Chevron dir="next" label="Siguiente" className="depth-carousel__glyph" />
          </button>
        </>
      )}

      {/* Con muchas tarjetas los puntos no caben en móvil: un contador en mono los sustituye */}
      {showIndicators && count > 24 && (
        <p
          className="mono-label absolute bottom-4 left-1/2 z-[3000] -translate-x-1/2 text-fg-muted"
          aria-live="polite"
        >
          {active + 1} / {count}
        </p>
      )}
      {showIndicators && count > 1 && count <= 24 && (
        <div
          className="absolute bottom-3 left-1/2 z-[3000] flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2"
          role="tablist"
          aria-label="Ir a un programa"
        >
          {items.map((it, i) => (
            <button
              key={it.key}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Ir a ${it.label ?? `la tarjeta ${i + 1}`}`}
              className={cn('depth-carousel__dot', active === i && 'is-active')}
              onClick={() => setFocus(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
