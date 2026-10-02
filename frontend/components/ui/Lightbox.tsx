'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CaretLeftIcon, CaretRightIcon, XIcon } from '@phosphor-icons/react/dist/ssr';
import { Arrow } from './Arrow';
import { getLenis } from '@/components/providers/SmoothScroll';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface LightboxItem {
  id: string;
  /** Imagen en tamaño de pantalla (formato large); `thumb` se muestra mientras carga. */
  src?: string | null;
  thumb?: string | null;
  w: number;
  h: number;
  alt: string;
  title?: string | null;
  date?: string | null;
  /** Video: URL del reproductor embebido (YouTube sin cookies o Vimeo). */
  embed?: string | null;
  link?: { href: string; label: string } | null;
}

const SPRING = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 } as const;

/**
 * Visor de fotos y videos (DESIGN_NOTES §28.4, fase 5). La foto pulsada crece desde su miniatura
 * hasta llenar la pantalla (`layoutId` compartido con la miniatura: `${prefix}-${id}`), con pie de
 * foto, contador y enlace a su actividad. Flechas en pantalla y del teclado, deslizar en táctil,
 * Esc o el fondo para cerrar. Los videos se reproducen aquí mismo. Diálogo accesible: el foco entra
 * al abrir y vuelve a la miniatura al cerrar; la página no se desplaza detrás.
 */
export function Lightbox({
  items,
  index,
  onIndex,
  prefix,
}: {
  items: LightboxItem[];
  index: number | null;
  onIndex: (i: number | null) => void;
  prefix: string;
}) {
  const reduced = useReducedMotion();
  const close = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const touch = useRef<number | null>(null);
  const open = index != null && !!items[index];
  const n = items.length;

  const go = useCallback(
    (d: number) => index != null && onIndex((index + d + n) % n),
    [index, n, onIndex]
  );

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    close.current?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = prev;
      lenis?.start();
      (opener.current as HTMLElement | null)?.focus?.({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onIndex(null);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, go, onIndex]);

  const item = open ? items[index] : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={item.title ?? 'Visor de la galería'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, delay: 0.05 } }}
          transition={{ duration: 0.3 }}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current == null) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            touch.current = null;
            if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar"
            className="lightbox__backdrop"
            onClick={() => onIndex(null)}
          />

          <div className="lightbox__stage">
            <motion.div
              key={item.id}
              layoutId={reduced ? undefined : `${prefix}-${item.id}`}
              transition={SPRING}
              className="lightbox__frame"
              style={
                {
                  aspectRatio: item.embed ? '16 / 9' : `${item.w} / ${item.h}`,
                  // Ancho que cabe en la pantalla con esa proporción (el alto manda en fotos verticales)
                  '--ar': item.embed ? 16 / 9 : item.w / item.h,
                  // La miniatura ya cargada se ve al instante mientras llega la foto grande. En videos
                  // no: su miniatura es de YouTube/Vimeo y el sitio no los contacta sin que se pulse play
                  backgroundImage: item.thumb && !item.embed ? `url(${item.thumb})` : undefined,
                } as React.CSSProperties
              }
            >
              {item.embed ? (
                <iframe
                  src={item.embed}
                  title={item.title ?? 'Video de la galería'}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              ) : item.src ? (
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="92vw"
                  className="object-contain"
                  data-no-fade
                  priority
                />
              ) : null}
            </motion.div>

            <motion.div
              key={`cap-${item.id}`}
              className="lightbox__cap"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.18, duration: 0.4 } }}
              exit={{ opacity: 0 }}
            >
              <div className="min-w-0">
                {item.date && <p className="lightbox__date">{item.date}</p>}
                {item.title && <p className="lightbox__title">{item.title}</p>}
                {item.link && (
                  <Link href={item.link.href} className="lightbox__link">
                    {item.link.label} <Arrow />
                  </Link>
                )}
              </div>
              <p className="lightbox__count" aria-live="polite">
                {index! + 1} / {n}
              </p>
            </motion.div>
          </div>

          {n > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                onClick={() => go(-1)}
                aria-label="Anterior"
              >
                <CaretLeftIcon aria-hidden weight="bold" />
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                onClick={() => go(1)}
                aria-label="Siguiente"
              >
                <CaretRightIcon aria-hidden weight="bold" />
              </button>
            </>
          )}
          <button
            ref={close}
            type="button"
            className="lightbox__close"
            onClick={() => onIndex(null)}
            aria-label="Cerrar el visor"
          >
            <XIcon aria-hidden weight="bold" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
