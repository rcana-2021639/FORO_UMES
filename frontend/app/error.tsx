'use client';

import { ErrorScreen } from '@/components/feedback/ErrorScreen';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorScreen
      code="500"
      title="Esta página se levantó de la mesa"
      text="Algo falló al preparar el contenido. El error ya quedó registrado con su referencia; puedes intentarlo de nuevo o volver a la portada."
      error={error}
      reset={reset}
    />
  );
}
