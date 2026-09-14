import { RateLimiter } from '../../src/lib/rate-limiter';

describe('RateLimiter', () => {
  const rule = { name: 'test', windowMs: 60_000, max: 3 };

  it('permite hasta max peticiones y bloquea la siguiente', () => {
    const limiter = new RateLimiter(() => 1000);
    expect(limiter.hit(rule, 'ip1').allowed).toBe(true);
    expect(limiter.hit(rule, 'ip1').allowed).toBe(true);
    const third = limiter.hit(rule, 'ip1');
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
    const fourth = limiter.hit(rule, 'ip1');
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterSeconds).toBe(60);
  });

  it('cuenta por clave de forma independiente', () => {
    const limiter = new RateLimiter(() => 1000);
    for (let i = 0; i < 3; i++) limiter.hit(rule, 'ip1');
    expect(limiter.hit(rule, 'ip1').allowed).toBe(false);
    expect(limiter.hit(rule, 'ip2').allowed).toBe(true);
  });

  it('reinicia la ventana cuando expira', () => {
    let now = 1000;
    const limiter = new RateLimiter(() => now);
    for (let i = 0; i < 4; i++) limiter.hit(rule, 'ip1');
    expect(limiter.hit(rule, 'ip1').allowed).toBe(false);
    now += 60_001;
    expect(limiter.hit(rule, 'ip1').allowed).toBe(true);
  });

  it('limpia ventanas vencidas periódicamente (sweep) y reset vacía todo', () => {
    let now = 1000;
    const limiter = new RateLimiter(() => now);
    limiter.hit(rule, 'vieja');
    now += 120_000; // pasa la ventana y el intervalo de limpieza
    limiter.hit(rule, 'nueva');
    expect(limiter.hit(rule, 'vieja').remaining).toBe(2); // volvió a empezar
    limiter.reset();
    expect(limiter.hit(rule, 'nueva').remaining).toBe(2);
  });
});
