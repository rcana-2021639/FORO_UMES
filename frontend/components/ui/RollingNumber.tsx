const DIGITS = '01234567890123456789'.split('');

/** Lo que tarda en asentarse la última columna desde que entra en pantalla (ms). */
export function rollDuration(value: number) {
  const columns = String(Math.max(0, Math.round(value))).length;
  return 1500 + (columns - 1) * 180;
}

/**
 * Cifra tipo odómetro: cada dígito es una columna 0–9 que da una vuelta completa antes de
 * detenerse en su valor, con retardo creciente de izquierda a derecha.
 *
 * El HTML ya trae cada columna en su dígito final; el giro lo hace el script de arranque
 * (`data-reveal="roll"`, lib/quality-script.ts) la primera vez que la cifra aparece: empieza en el
 * primer pintado, sin esperar a que React hidrate (antes se quedaba quieta hasta que cargaba la
 * página y además esperaba ~1 s). Sin JavaScript o con menos movimiento, el número se ve fijo.
 *
 * `standalone` (por defecto) hace de la cifra su propio disparador; si va dentro de otro grupo
 * (`data-reveal-group`, como las cifras de la portada), ese grupo la dispara y `delay` cuenta
 * desde ahí.
 */
export function RollingNumber({
  value,
  delay = 0,
  standalone = true,
}: {
  value: number;
  /** Segundos desde que el grupo entra en pantalla. */
  delay?: number;
  standalone?: boolean;
}) {
  const digits = String(Math.max(0, Math.round(value))).split('');
  return (
    <span
      className="rolling"
      aria-label={String(value)}
      role="img"
      data-reveal-group={standalone ? '' : undefined}
    >
      {digits.map((d, i) => (
        <span key={i} className="rolling__col" aria-hidden>
          <span
            className="rolling__strip"
            data-reveal="roll"
            data-reveal-at={Math.round(delay * 1000 + i * 180)}
            // Da una vuelta (10 posiciones) y se detiene en el dígito
            style={{ transform: `translateY(${-(10 + Number(d)) * 5}%)` }}
          >
            {DIGITS.map((n, k) => (
              <span key={k} className="rolling__digit">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
