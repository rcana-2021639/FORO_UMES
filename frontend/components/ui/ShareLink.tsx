'use client';

import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import { CheckIcon, ShareNetworkIcon } from '@phosphor-icons/react/dist/ssr';

/**
 * Compartir la página: en el teléfono abre el menú de compartir del sistema (WhatsApp, correo…);
 * en la computadora copia el enlace y avisa. El icono cambia a una palomita un momento.
 */
export function ShareLink({ title, className }: { title: string; className?: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const flash = () => {
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1800);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title, url });
        flash();
      } catch {
        /* la persona cerró el menú: nada que hacer */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      flash();
      sileo.success({ title: 'Enlace copiado', description: 'Pégalo donde quieras compartirlo.' });
    } catch {
      sileo.warning({ title: 'No se pudo copiar', description: 'Copia la dirección de arriba.' });
    }
  };

  return (
    <button type="button" onClick={share} className={className} data-done={done}>
      {done ? (
        <CheckIcon aria-hidden weight="bold" />
      ) : (
        <ShareNetworkIcon aria-hidden weight="bold" />
      )}
      {done ? 'Listo' : 'Compartir'}
    </button>
  );
}
