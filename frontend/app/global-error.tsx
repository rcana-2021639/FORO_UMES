'use client';

import { ErrorScreen } from '@/components/feedback/ErrorScreen';

/** Error del layout raíz: no hay fuentes ni estilos globales garantizados, así que pinta lo básico. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Georgia, serif' }}>
        <ErrorScreen
          code="500"
          title="El sitio del Foro no pudo cargarse"
          text="Ocurrió un error inesperado. Intenta de nuevo en unos segundos."
          error={error}
          reset={reset}
          bare
        />
      </body>
    </html>
  );
}
