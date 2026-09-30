import {
  DEFAULT_CONTACT_RETENTION_DAYS,
  retentionCutoff,
  retentionDays,
} from '../../src/lib/contact-retention';

describe('conservación de mensajes de contacto', () => {
  it('usa el plazo configurado y, si es inválido, el de por defecto (365 días)', () => {
    expect(retentionDays(90)).toBe(90);
    expect(retentionDays('180')).toBe(180);
    expect(retentionDays(30.9)).toBe(30);
    for (const bad of [undefined, null, '', 'abc', 0, -5, Number.NaN]) {
      expect(retentionDays(bad)).toBe(DEFAULT_CONTACT_RETENTION_DAYS);
    }
  });

  it('la fecha de corte es exactamente N días antes de ahora', () => {
    const now = new Date('2026-09-29T12:00:00Z');
    expect(retentionCutoff(365, now).toISOString()).toBe('2025-09-29T12:00:00.000Z');
    expect(retentionCutoff(1, now).toISOString()).toBe('2026-09-28T12:00:00.000Z');
  });
});
