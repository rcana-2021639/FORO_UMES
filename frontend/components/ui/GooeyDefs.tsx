/**
 * Filtro SVG "gooey" (metaball) compartido: blur + matriz de color con umbral alto.
 * Lo usan el indicador del navbar y las transiciones líquidas; se define una sola vez.
 */
export function GooeyDefs() {
  return (
    <svg aria-hidden className="absolute h-0 w-0" focusable="false">
      <defs>
        <filter id="gooey-filter">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        <filter id="grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
  );
}
