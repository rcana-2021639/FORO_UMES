'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

interface Props {
  /** Lo que va dentro del marco: una imagen, un video o cualquier nodo a pantalla completa. */
  media: ReactNode;
  title?: string;
  scrollHint?: string;
  children?: ReactNode;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  /** Alturas de viewport que dura la apertura y la pausa final. */
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  className?: string;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * Marco que se abre con el scroll hasta ocupar toda la pantalla y cede el escenario al medio.
 * Adaptado de React Bits `ScrollExpand` (scroll de ventana, escenario `sticky`): aquí el medio
 * es un nodo (no solo `src`), el título usa Fraunces y con reduced-motion no hay suavizado.
 */
export function ScrollExpand({
  media,
  title,
  scrollHint,
  children,
  startWidth = 44,
  startHeight = 56,
  startRadius = 22,
  endRadius = 0,
  mediaZoom = 1.3,
  scrollDistance = 1,
  holdDistance = 0.25,
  smoothing = 0.1,
  overlayScrim = 0.5,
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  const cfg = useRef({
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
  });
  useEffect(() => {
    cfg.current = {
      startWidth,
      startHeight,
      startRadius,
      endRadius,
      mediaZoom,
      scrollDistance,
      holdDistance,
      smoothing,
      overlayScrim,
    };
  }, [
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
  ]);

  const apply = useCallback((p: number) => {
    const frame = frameRef.current;
    const m = mediaRef.current;
    if (!frame || !m) return;
    const c = cfg.current;
    const e = smoothstep(0, 1, p);
    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;
    m.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;
    if (scrimRef.current) scrimRef.current.style.opacity = `${c.overlayScrim * e}`;
    if (titleRef.current) {
      const out = smoothstep(0.4, 0.88, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }
    if (hintRef.current) {
      const gone = smoothstep(0, 0.12, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }
    if (overlayRef.current) {
      const inn = smoothstep(0.68, 1, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;
    const reduce = prefersReducedMotion();
    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = cfg.current;
      stageH = window.innerHeight;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;
      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.07, 28, 96)}px`);
    };
    const read = () => {
      const span = stageH * Math.max(0.01, cfg.current.scrollDistance);
      const top = track.getBoundingClientRect().top;
      return clamp(-top / span, 0, 1);
    };
    const tick = () => {
      const s = cfg.current.smoothing;
      const k = s <= 0 ? 1 : 1 - Math.exp(-1 / (60 * s));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      apply(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      target = read();
      if (cfg.current.smoothing <= 0 || reduce) {
        current = target;
        apply(current);
        return;
      }
      if (!running) {
        running = true;
        if (!raf) raf = requestAnimationFrame(tick);
      }
    };
    const onResize = () => {
      measure();
      target = read();
      current = target;
      apply(current);
    };
    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [apply]);

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <div ref={trackRef} className="relative w-full">
        <div ref={stageRef} className="scroll-expand__stage">
          <div ref={frameRef} className="scroll-expand__frame">
            <div ref={mediaRef} className="scroll-expand__media">
              {media}
            </div>
            <div ref={scrimRef} className="scroll-expand__scrim" />
            {children && (
              <div ref={overlayRef} className="scroll-expand__overlay">
                {children}
              </div>
            )}
          </div>
          {title && (
            <div ref={titleRef} className="scroll-expand__title">
              {title}
            </div>
          )}
          {scrollHint && (
            <div ref={hintRef} className="scroll-expand__hint ui-label">
              {scrollHint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
