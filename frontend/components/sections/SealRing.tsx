'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, ViewTransition, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Emblem } from '@/components/ui/Emblem';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { brandOf } from '@/lib/universities';

export interface RingSeat {
  documentId: string;
  acronym: string;
  name: string;
  logo?: string | null;
  programs?: number;
}

/**
 * Cabecera de /universidades (DESIGN_NOTES §28.4, fase 3): los nueve sellos en círculo alrededor
 * del emblema, como alrededor de una mesa redonda. Al llegar, salen del centro a su asiento uno a
 * uno; después el anillo gira muy despacio (los sellos siempre derechos). Al señalar un sello, el
 * anillo se detiene, ese sello crece con el color de su universidad y el centro dice quién es.
 * Toda la mecánica es CSS (styles/v6.css, `.seal-ring`): React solo cambia qué sello está señalado.
 */
export function SealRing({ seats }: { seats: RingSeat[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const current = active == null ? null : seats[active];
  const n = Math.max(seats.length, 1);

  return (
    <div className="seal-ring" data-active={active != null} onPointerLeave={() => setActive(null)}>
      <span aria-hidden className="seal-ring__track" />
      <span aria-hidden className="seal-ring__track seal-ring__track--inner" />

      <div className="seal-ring__center" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {current ? (
            <motion.span
              key={current.documentId}
              className="seal-ring__who"
              initial={reduced ? false : { opacity: 0, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={reduced ? undefined : { opacity: 0, y: -6, filter: 'blur(4px)' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="seal-ring__acr"
                style={{ color: brandOf(current.acronym).text } as CSSProperties}
              >
                {current.acronym}
              </span>
              <span className="seal-ring__name">{current.name}</span>
              {current.programs ? (
                <span className="seal-ring__meta">{current.programs} programas</span>
              ) : null}
            </motion.span>
          ) : (
            <motion.span
              key="emblem"
              className="seal-ring__who"
              initial={reduced ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Emblem motion="assemble" className="seal-ring__emblem" />
              <span className="seal-ring__meta">Nueve en uno</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <ul className="seal-ring__orbit" aria-label="Las nueve universidades">
        {seats.map((s, i) => {
          const b = brandOf(s.acronym);
          return (
            <li
              key={s.documentId}
              className="seal-ring__slot"
              style={{ '--a': `${-90 + (360 / n) * i}deg`, '--i': i } as CSSProperties}
            >
              <span className="seal-ring__upright">
                <Link
                  href={`/universidades/${s.documentId}`}
                  transitionTypes={['uni-seal']}
                  className="seal-ring__seal"
                  data-on={active === i}
                  style={{ '--u': b.primary, '--u2': b.accent } as CSSProperties}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  aria-label={`${s.name}: abrir perfil`}
                >
                  {s.logo ? (
                    <ViewTransition
                      name={`seal-${s.documentId}`}
                      share={{ 'uni-seal': 'seal-morph', default: 'none' }}
                      default="none"
                    >
                      <Image src={s.logo} alt="" width={120} height={120} priority={i < 3} />
                    </ViewTransition>
                  ) : (
                    <span aria-hidden>{s.acronym.slice(0, 3)}</span>
                  )}
                </Link>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
