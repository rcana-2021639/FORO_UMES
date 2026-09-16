'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { sileo } from 'sileo';
import { Button } from '@/components/ui/Button';
import { describeError } from '@/lib/api';

const Orb = dynamic(() => import('@/components/sections/Orb').then((m) => m.Orb), { ssr: false });

interface Props {
  code: string;
  title: string;
  text: string;
  error?: Error & { digest?: string };
  reset?: () => void;
  /** Sin layout (global-error): pinta su propio fondo. */
  bare?: boolean;
}

/**
 * Pantalla de error "fuera de acta": mismo lenguaje que el resto del sitio, con folio
 * (digest/requestId) para soporte, orbe ámbar de fondo y botones del sistema.
 */
export function ErrorScreen({ code, title, text, error, reset, bare }: Props) {
  useEffect(() => {
    if (!error) return;
    const d = describeError(error);
    sileo.error({ title: d.title, description: d.description, duration: 6000 });
  }, [error]);

  const folio = error?.digest ?? (error as { requestId?: string } | undefined)?.requestId;

  return (
    <div
      className="relative isolate flex min-h-svh flex-col justify-center overflow-hidden"
      style={bare ? { background: '#edefe9', color: '#101511' } : undefined}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] top-1/2 -z-10 h-[70vmin] w-[70vmin] -translate-y-1/2 opacity-60 mix-blend-multiply"
      >
        <Orb backgroundColor="#edefe9" hue={0} hoverIntensity={0.2} />
      </div>
      <div className="container-x py-32">
        <p className="eyebrow text-fg-muted">
          Error <span className="text-accent">{code}</span>
          {folio ? `, referencia ${String(folio).slice(0, 8)}` : ''}
        </p>
        <h1 className="mt-6 max-w-[14ch]">{title}</h1>
        <p className="mt-8 max-w-[46ch] text-[1.05rem] leading-relaxed text-fg-muted">{text}</p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button href="/">Volver a la portada</Button>
          {reset && (
            <Button variant="secondary" onClick={reset}>
              Intentar de nuevo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
