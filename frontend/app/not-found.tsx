import { ErrorScreen } from '@/components/feedback/ErrorScreen';

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      title="Aquí no hay ninguna silla"
      text="La página que buscas no existe o fue retirada. Revisa la dirección o vuelve a la portada."
    />
  );
}
