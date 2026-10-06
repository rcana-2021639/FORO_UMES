/**
 * Limitador de tasa en memoria con ventana fija (Sprint 5, tarea 4).
 *
 * Suficiente para el tráfico esperado (un solo proceso). Si algún día se corre en varias
 * instancias, se reemplaza el almacén por Redis sin cambiar la interfaz.
 * Sin dependencias, probado unitariamente.
 */
export type RateLimitRule = {
  /** Identificador de la regla (para logs y cabeceras) */
  name: string;
  /** Duración de la ventana en milisegundos */
  windowMs: number;
  /** Máximo de peticiones por clave dentro de la ventana */
  max: number;
};

type Bucket = { count: number; resetAt: number };

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Segundos hasta que se reinicia la ventana */
  retryAfterSeconds: number;
};

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private lastSweep = 0;

  constructor(private readonly now: () => number = () => Date.now()) {}

  hit(rule: RateLimitRule, key: string): RateLimitResult {
    const now = this.now();
    this.sweep(now);

    const id = `${rule.name}:${key}`;
    let bucket = this.buckets.get(id);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + rule.windowMs };
      this.buckets.set(id, bucket);
    }
    bucket.count += 1;

    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: bucket.count <= rule.max,
      remaining: Math.max(0, rule.max - bucket.count),
      retryAfterSeconds,
    };
  }

  /** Limpia ventanas vencidas como máximo una vez por minuto para que el Map no crezca sin límite. */
  private sweep(now: number) {
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [id, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(id);
    }
  }

  reset() {
    this.buckets.clear();
  }
}

/**
 * Clave de límite para una IP. Una conexión IPv6 doméstica recibe un bloque /64 entero (18 trillones
 * de direcciones): contar cada dirección por separado permitiría saltarse cualquier límite rotando
 * de dirección. Se cuenta por el /64, como hacen los proveedores. Las IPv4 (y las IPv4 mapeadas en
 * IPv6, "::ffff:1.2.3.4") se cuentan por dirección.
 */
export function ipKey(ip: string): string {
  const value = ip.trim().toLowerCase();
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
  if (mapped) return mapped[1];
  if (!value.includes(':')) return value;

  const [head, tail = ''] = value.split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const missing = value.includes('::') ? 8 - left.length - right.length : 0;
  const groups = [...left, ...Array<string>(Math.max(0, missing)).fill('0'), ...right];
  return `${groups
    .slice(0, 4)
    .map((g) => (parseInt(g, 16) || 0).toString(16))
    .join(':')}::/64`;
}
