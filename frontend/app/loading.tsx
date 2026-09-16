/** Estado de carga entre rutas: una línea que respira, no un spinner. */
export default function Loading() {
  return (
    <div className="container-x pt-44" role="status" aria-live="polite">
      <span className="eyebrow text-fg-muted">Un momento</span>
      <span className="mt-4 block h-px w-40 overflow-hidden bg-line">
        <span className="block h-px w-1/3 animate-[breathe_1.4s_ease-in-out_infinite] bg-amber" />
      </span>
      <span className="sr-only">Cargando contenido</span>
    </div>
  );
}
