'use client';

import { ErrorScreen } from '@/components/feedback/ErrorScreen';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorScreen
      code="500"
      title="No pudimos cargar esta página"
      text="Suele ser una falla pasajera de conexión con el servidor del Foro. Espera unos segundos y pulsa «Intentar de nuevo»; si sigue igual, vuelve a la portada. Si escribes al Foro por esto, menciona la referencia de arriba."
      error={error}
      retry={retry}
    />
  );
}
