import { ErrorScreen } from '@/components/feedback/ErrorScreen';

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="No hay nada en este folio"
      text="La página que buscas no existe o fue retirada del acta. Revisa la dirección o vuelve a la portada."
    />
  );
}
