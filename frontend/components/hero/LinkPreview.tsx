'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useFinePointer, useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  href: string;
  className?: string;
  children: ReactNode;
  /** Nombre del adelanto para lectores de pantalla ("Las nueve universidades del Foro"). */
  label: string;
  /** Contenido del adelanto. Sus hijos con `variants={PREVIEW_ITEM}` entran en cascada. */
  preview: ReactNode;
}

const PANEL: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  shown: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 420,
      damping: 34,
      mass: 0.7,
      staggerChildren: 0.035,
      delayChildren: 0.06,
    },
  },
  gone: { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.16, ease: [0.32, 0.72, 0, 1] } },
};

/** Para cada pieza del adelanto: sube y aparece, en cascada con sus hermanas. */
export const PREVIEW_ITEM: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.85 },
  shown: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 520, damping: 30 },
  },
};

/**
 * Enlace de la frase de la portada con adelanto (DESIGN_NOTES §28.4, fase 2): al detener el cursor
 * sobre "nueve universidades" o "124 programas" se abre, bajo la palabra, una ficha con lo que hay
 * del otro lado (los nueve sellos; la oferta por nivel). El enlace sigue siendo un enlace normal:
 * en pantallas táctiles no hay adelanto y con el teclado se abre al enfocarlo (Esc lo cierra).
 */
export function LinkPreview({ href, className, children, label, preview }: Props) {
  const fine = useFinePointer();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const timer = useRef(0);
  const id = useId();

  const place = useCallback(() => {
    const a = link.current;
    const host = a?.offsetParent as HTMLElement | null;
    if (!a || !host) return;
    // El enlace puede partirse en dos líneas: el adelanto cuelga de la última
    const rects = a.getClientRects();
    const r = rects[rects.length - 1] ?? a.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    const width = 320;
    const left = Math.max(0, Math.min(r.left - h.left, h.width - width));
    setPos({ left, top: r.bottom - h.top + 10 });
  }, []);

  const show = (delay = 90) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      place();
      setOpen(true);
    }, delay);
  };
  const hide = (delay = 160) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), delay);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      link.current?.focus();
    };
    const onScroll = () => setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, [open]);

  const enabled = fine;

  return (
    <>
      <Link
        ref={link}
        href={href}
        className={className}
        aria-describedby={enabled && open ? id : undefined}
        onPointerEnter={enabled ? () => show() : undefined}
        onPointerLeave={enabled ? () => hide() : undefined}
        onFocus={enabled ? () => show(0) : undefined}
        onBlur={
          enabled
            ? (e) => {
                // Si el foco pasa al adelanto, sigue abierto
                if (
                  !e.relatedTarget ||
                  !(e.relatedTarget as Element).closest?.(`[data-preview="${id}"]`)
                )
                  hide(120);
              }
            : undefined
        }
      >
        {children}
      </Link>
      {enabled && (
        <AnimatePresence>
          {open && pos && (
            <motion.span
              id={id}
              role="group"
              aria-label={label}
              data-preview={id}
              className="link-preview"
              style={{ left: pos.left, top: pos.top }}
              variants={reduced ? undefined : PANEL}
              initial={reduced ? false : 'hidden'}
              animate="shown"
              exit={reduced ? undefined : 'gone'}
              onPointerEnter={() => show(0)}
              onPointerLeave={() => hide()}
              onFocus={() => show(0)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) hide(120);
              }}
            >
              {preview}
            </motion.span>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
