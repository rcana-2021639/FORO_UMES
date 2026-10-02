'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { StarIcon, XIcon, ColumnsIcon } from '@phosphor-icons/react/dist/ssr';
import { Arrow } from '@/components/ui/Arrow';
import { ModalityIcon } from '@/components/ui/ModalityIcon';
import { getLenis } from '@/components/providers/SmoothScroll';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { LEVEL_LABEL, MODALITY_LABEL, acronymOf } from '@/lib/format';
import { LEVEL_META } from '@/lib/levels';
import type { AcademicProgram } from '@/lib/types';

const SPRING = { type: 'spring', stiffness: 380, damping: 36, mass: 0.8 } as const;

/**
 * Comparador de guardados (DESIGN_NOTES §28.4, fase 4). Con al menos un programa marcado con la
 * estrella aparece abajo una barra flotante; "Comparar" abre un panel con los guardados lado a lado
 * (nivel, universidad, modalidad, duración y ficha oficial), donde también se pueden quitar.
 * Es un diálogo: Esc o el fondo lo cierran, el foco entra al abrir y vuelve al botón al cerrar, y el
 * scroll de la página queda quieto mientras está abierto.
 */
export function SavedCompare({
  programs,
  onRemove,
  onShowList,
}: {
  programs: AcademicProgram[];
  onRemove: (id: string) => void;
  /** Muestra en el catálogo solo los guardados (pestaña "Guardados"). */
  onShowList: () => void;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const n = programs.length;

  // Al quitar el último, el panel se cierra solo
  const visible = open && n > 0;

  useEffect(() => {
    if (!visible) return;
    const lenis = getLenis();
    lenis?.stop();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    close.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const back = trigger.current;
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
      lenis?.start();
      back?.focus();
    };
  }, [visible]);

  return (
    <>
      <AnimatePresence>
        {/* Sigue montada bajo el panel: al cerrarlo, el foco vuelve a su botón */}
        {n > 0 && (
          <motion.div
            className="saved-bar"
            initial={reduced ? false : { y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? undefined : { y: 90, opacity: 0 }}
            transition={SPRING}
          >
            <span className="saved-bar__count" aria-live="polite">
              <StarIcon aria-hidden weight="fill" />
              <motion.b key={n} initial={reduced ? false : { scale: 1.6 }} animate={{ scale: 1 }}>
                {n}
              </motion.b>{' '}
              guardado{n === 1 ? '' : 's'}
            </span>
            <button type="button" className="saved-bar__link" onClick={onShowList}>
              Ver en la lista
            </button>
            <button
              ref={trigger}
              type="button"
              className="saved-bar__go"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
            >
              <ColumnsIcon aria-hidden weight="bold" />
              Comparar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.div
            className="saved-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="saved-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              type="button"
              aria-label="Cerrar"
              tabIndex={-1}
              className="saved-sheet__backdrop"
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="saved-sheet__panel"
              initial={reduced ? false : { x: '8%', y: 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={reduced ? undefined : { x: '6%', opacity: 0 }}
              transition={SPRING}
            >
              <header className="saved-sheet__head">
                <div>
                  <p className="eyebrow text-[var(--color-violet-700)]">Tus programas guardados</p>
                  <h2 id="saved-title" className="saved-sheet__title">
                    {n === 1 ? 'Un programa' : `${n} programas, lado a lado`}
                  </h2>
                </div>
                <button
                  ref={close}
                  type="button"
                  className="saved-sheet__close"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar el comparador"
                >
                  <XIcon aria-hidden weight="bold" />
                </button>
              </header>
              {n === 1 && (
                <p className="saved-sheet__hint">
                  Guarda al menos otro con la estrella para compararlos lado a lado.
                </p>
              )}
              <div className="saved-sheet__cols" data-lenis-prevent>
                <AnimatePresence initial={false} mode="popLayout">
                  {programs.map((p, i) => {
                    const meta = LEVEL_META[p.level];
                    return (
                      <motion.article
                        key={p.documentId}
                        layout={!reduced}
                        className="saved-col"
                        style={{ '--lv': meta.color } as CSSProperties}
                        initial={reduced ? false : { opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0, transition: { ...SPRING, delay: i * 0.05 } }}
                        exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
                      >
                        <span className="saved-col__level">{LEVEL_LABEL[p.level]}</span>
                        <h3 className="saved-col__name">{p.name}</h3>
                        <dl className="saved-col__facts">
                          <div>
                            <dt>Universidad</dt>
                            <dd>
                              {p.university ? (
                                <Link href={`/universidades/${p.university.documentId}`}>
                                  {acronymOf(p.university)}
                                </Link>
                              ) : (
                                '—'
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>Modalidad</dt>
                            <dd>
                              <ModalityIcon modality={p.modality} /> {MODALITY_LABEL[p.modality]}
                            </dd>
                          </div>
                          <div>
                            <dt>Duración</dt>
                            <dd>{p.duration ?? 'Por confirmar'}</dd>
                          </div>
                          <div>
                            <dt>Nivel</dt>
                            <dd>{meta.hint}</dd>
                          </div>
                        </dl>
                        <div className="saved-col__actions">
                          {p.infoUrl && (
                            <a
                              href={p.infoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="saved-col__go"
                            >
                              Ficha oficial <Arrow dir="up-right" />
                            </a>
                          )}
                          <button
                            type="button"
                            className="saved-col__remove"
                            onClick={() => onRemove(p.documentId)}
                          >
                            Quitar
                          </button>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
