import { describe, expect, it } from 'vitest';
import { compareAnswer, compareSort, listEs, type CompareRow } from '@/lib/compare';

const row = (
  acronym: string,
  order: number,
  levels: [number, number, number, number],
  mods: [number, number, number],
  joined: number | null
): CompareRow => {
  const [Maestria, Doctorado, Especializacion, Diplomado] = levels;
  const [Presencial, Hibrida, Virtual] = mods;
  return {
    acronym,
    order,
    total: Maestria + Doctorado + Especializacion + Diplomado,
    levels: { Maestria, Doctorado, Especializacion, Diplomado },
    modalities: { Presencial, Hibrida, Virtual },
    joined,
  };
};

const rows = [
  row('USAC', 1, [9, 3, 1, 1], [10, 3, 1], 2008),
  row('URL', 2, [10, 3, 3, 0], [5, 6, 5], 2008),
  row('UPANA', 3, [12, 0, 0, 1], [6, 4, 3], 2012),
  row('UMES', 4, [6, 0, 0, 2], [2, 1, 5], 2014),
];

describe('listEs', () => {
  it('une con comas y "y"', () => {
    expect(listEs(['A'])).toBe('A');
    expect(listEs(['A', 'B'])).toBe('A y B');
    expect(listEs(['A', 'B', 'C'])).toBe('A, B y C');
  });
});

describe('compareAnswer', () => {
  it('cuántos programas: la más grande y la más pequeña', () => {
    expect(compareAnswer('total', rows)).toBe(
      'URL tiene la oferta más grande: 16 programas. La más pequeña es la de UMES (8).'
    );
  });
  it('un nivel que todas ofrecen: la que más y las que siguen', () => {
    expect(compareAnswer('Maestria', rows)).toBe(
      'Las 4 ofrecen maestrías. UPANA tiene más: 12. Le sigue URL (10).'
    );
  });
  it('un nivel que solo algunas ofrecen, todas con la misma cifra', () => {
    expect(compareAnswer('Doctorado', rows)).toBe(
      'Solo 2 de las 4 ofrecen doctorados: USAC y URL, con 3 cada una.'
    );
  });
  it('a distancia suma virtual e híbrido', () => {
    expect(compareAnswer('online', rows)).toBe(
      'Las 4 tienen opciones a distancia. URL tiene más: 11. Le sigue UPANA (7).'
    );
  });
  it('desde cuándo: las fundadoras y la más reciente', () => {
    expect(compareAnswer('joined', rows)).toBe(
      'USAC y URL están desde el inicio (2008). La más reciente en sumarse es UMES (2014).'
    );
  });
  it('sin datos no inventa nada', () => {
    expect(compareAnswer('total', [])).toBe('Todavía no hay universidades publicadas.');
    expect(compareAnswer('Diplomado', [rows[1]])).toBe(
      'Ninguna universidad tiene diplomados publicados todavía.'
    );
  });
});

describe('compareSort', () => {
  it('cifras de mayor a menor; años de menor a mayor; empates por el orden del Foro', () => {
    expect(compareSort('Doctorado', rows).map((r) => r.acronym)).toEqual([
      'USAC',
      'URL',
      'UPANA',
      'UMES',
    ]);
    expect(compareSort('joined', rows).map((r) => r.acronym)).toEqual([
      'USAC',
      'URL',
      'UPANA',
      'UMES',
    ]);
  });
});
