'use client';

import { useEffect, useRef, useState } from 'react';
import { sileo } from 'sileo';
import { cn } from '@/lib/cn';

/**
 * Correo institucional con un botón pequeño para copiarlo. El enlace sigue abriendo el cliente
 * de correo; el botón copia sin salir de la página, cambia su icono a una palomita que se
 * dibuja y avisa con un toast.
 */
export function CopyEmail({
  email,
  className,
  linkClassName,
}: {
  email: string;
  className?: string;
  linkClassName?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      sileo.success({ title: 'Correo copiado', description: email, duration: 2400 });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      sileo.warning({ title: 'No se pudo copiar', description: 'Selecciona el correo y cópialo.' });
    }
  };

  return (
    <span className={cn('copy-email', className)}>
      <a
        href={`mailto:${email}`}
        onClick={(e) => e.stopPropagation()}
        className={cn('min-w-0 truncate', linkClassName)}
      >
        {email}
      </a>
      <button
        type="button"
        onClick={copy}
        className="copy-email__btn"
        data-copied={copied}
        aria-label={copied ? 'Correo copiado' : `Copiar ${email}`}
      >
        <svg viewBox="0 0 16 16" aria-hidden className="copy-email__icon copy-email__icon--copy">
          <rect x="5" y="5" width="8.5" height="8.5" rx="2" />
          <path d="M3.5 10.5h-.25A1.25 1.25 0 0 1 2 9.25v-6A1.25 1.25 0 0 1 3.25 2h6A1.25 1.25 0 0 1 10.5 3.25v.25" />
        </svg>
        <svg viewBox="0 0 16 16" aria-hidden className="copy-email__icon copy-email__icon--ok">
          <path d="M3 8.5l3.2 3L13 4.5" pathLength={1} />
        </svg>
      </button>
    </span>
  );
}
