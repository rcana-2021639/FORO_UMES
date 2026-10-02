import { Emblem } from '@/components/ui/Emblem';

/**
 * Estado de carga entre rutas: el emblema se arma y se desarma (nueve puntos que se vuelven el 9
 * maya) sobre la línea que respira. Sin spinner.
 */
export default function Loading() {
  return (
    <div className="container-x page-loading" role="status" aria-live="polite">
      <Emblem motion="loop" className="page-loading__mark" />
      <span data-reveal="fade" className="eyebrow text-fg-muted">
        Un momento
      </span>
      <span className="mt-4 block h-px w-40 overflow-hidden bg-line">
        <span className="block h-px w-1/3 animate-[breathe_1.4s_ease-in-out_infinite] bg-clay" />
      </span>
      <span className="sr-only">Cargando contenido</span>
    </div>
  );
}
