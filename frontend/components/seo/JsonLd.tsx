/**
 * Datos estructurados en la página (ver lib/json-ld.ts). Es un bloque de datos, no código: el
 * navegador no lo ejecuta y la CSP no lo bloquea. Se escapa `<` para que un texto del backend con
 * "</script>" no pueda cerrar la etiqueta e inyectar HTML (recomendación de la guía de Next).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
