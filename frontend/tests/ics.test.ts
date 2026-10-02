import { describe, expect, it } from 'vitest';
import { buildIcs, icsEscape, icsFileName, icsFold } from '@/lib/ics';

describe('archivo de calendario (.ics)', () => {
  const ics = buildIcs(
    {
      uid: 'abc123',
      date: '2026-10-22',
      title: 'Encuentro Anual del Foro 2026',
      description: 'Sede: Campus Central, zona 16; doble titulación',
      url: 'https://foro.example/actividades/abc123',
    },
    new Date('2026-10-01T10:20:30.456Z')
  );

  it('es un evento de día completo con fin exclusivo al día siguiente', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:20261022\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261023\r\n');
    expect(ics).toContain('DTSTAMP:20261001T102030Z\r\n');
    expect(ics).toContain('UID:abc123@foro-posgrado\r\n');
  });

  it('usa CRLF, abre y cierra el calendario', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('cambia de mes y de año al calcular el día siguiente', () => {
    expect(buildIcs({ uid: 'x', date: '2026-12-31', title: 'T' })).toContain(
      'DTEND;VALUE=DATE:20270101'
    );
  });

  it('escapa comas, punto y coma, barras y saltos de línea', () => {
    expect(icsEscape('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
    expect(ics).toContain('DESCRIPTION:Sede: Campus Central\\, zona 16\\; doble titulación');
  });

  it('parte las líneas largas en 75 octetos sin romper caracteres', () => {
    const long = 'SUMMARY:' + 'Programación '.repeat(12);
    const folded = icsFold(long);
    const parts = folded.split('\r\n');
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(75);
    expect(parts.slice(1).every((p) => p.startsWith(' '))).toBe(true);
    expect(parts.map((p, i) => (i ? p.slice(1) : p)).join('')).toBe(long);
  });

  it('da un nombre de archivo limpio', () => {
    expect(icsFileName('Encuentro Anual del Foro 2026')).toBe('encuentro-anual-del-foro-2026.ics');
    expect(icsFileName('¿Qué es?')).toBe('que-es.ics');
    expect(icsFileName('***')).toBe('actividad.ics');
  });
});
