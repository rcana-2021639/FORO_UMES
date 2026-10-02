'use client';

import { useEffect } from 'react';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/Button';
import { Words } from '@/components/ui/Words';
import { describeError } from '@/lib/api';

import { SoftOrb } from '@/components/ui/SoftOrb';
import { Arrow } from '@/components/ui/Arrow';

/** Lo que más se busca en el sitio: quien llega a un error no queda sin salida. */
const SHORTCUTS = [
  { label: 'Buscar un programa', href: '/programas#buscar' },
  { label: 'Las nueve universidades', href: '/universidades' },
  { label: 'Próximas actividades', href: '/actividades' },
  { label: 'Escribir al Foro', href: '/contacto' },
];

interface Props {
  code: string;
  title: string;
  text: string;
  error?: Error & { digest?: string };
  retry?: () => void;
  /** Sin layout (global-error): pinta su propio fondo. */
  bare?: boolean;
}

/**
 * Pantalla de error "fuera de acta": mismo lenguaje que el resto del sitio, con folio
 * (digest/requestId) para soporte, orbe ámbar de fondo y botones del sistema.
 */
export function ErrorScreen({ code, title, text, error, retry, bare }: Props) {
  useEffect(() => {
    if (!error) return;
    const d = describeError(error);
    sileo.error({ title: d.title, description: d.description, duration: 6000 });
  }, [error]);

  const folio = error?.digest ?? (error as { requestId?: string } | undefined)?.requestId;

  return (
    <div
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden"
      style={bare ? { background: '#fdfcff', color: '#1e1830' } : undefined}
    >
      <div
        aria-hidden
        data-reveal="scale"
        className="pointer-events-none absolute -right-[10%] top-1/2 -z-10 w-[70vmin] -translate-y-1/2 opacity-70 max-sm:top-auto max-sm:-right-[30%] max-sm:-bottom-[12%] max-sm:translate-y-0 max-sm:opacity-35"
      >
        <SoftOrb follow={false} />
      </div>
      <div className="container-x py-32">
        <p data-reveal="left" className="eyebrow text-fg-muted">
          Error <span className="text-accent">{code}</span>
          {folio ? `, referencia ${String(folio).slice(0, 8)}` : ''}
        </p>
        <h1 data-reveal-group className="mt-6 max-w-[14ch]">
          <Words text={title} />
        </h1>
        <p
          data-reveal="blur"
          className="mt-8 max-w-[46ch] text-[1.05rem] leading-relaxed text-fg-muted"
        >
          {text}
        </p>
        <div data-reveal="up" className="mt-12 flex flex-wrap gap-4">
          {retry && <Button onClick={retry}>Intentar de nuevo</Button>}
          <Button href="/" variant={retry ? 'secondary' : 'primary'}>
            Volver a la portada
          </Button>
        </div>
        <nav aria-label="Atajos" data-reveal="fade" className="error-shortcuts">
          <p className="eyebrow">O ve directo a</p>
          <ul>
            {SHORTCUTS.map((s) => (
              <li key={s.href}>
                <a href={s.href}>
                  {s.label} <Arrow />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
