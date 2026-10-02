import { describe, expect, it } from 'vitest';
import { scoreEntry, search, terms, type SearchEntry } from '@/lib/search';

const INDEX: SearchEntry[] = [
  {
    kind: 'universidad',
    title: 'USAC',
    meta: 'Universidad de San Carlos de Guatemala',
    href: '/u/1',
  },
  { kind: 'universidad', title: 'URL', meta: 'Universidad Rafael Landívar', href: '/u/2' },
  {
    kind: 'programa',
    title: 'Maestría en Gestión Ambiental y Sostenibilidad',
    meta: 'UVG · Maestría · Híbrida',
    keywords: 'uvg maestria hibrida',
    href: '/p/1',
  },
  {
    kind: 'programa',
    title: 'Doctorado en Educación',
    meta: 'USAC · Doctorado · Presencial',
    keywords: 'usac doctorado presencial',
    href: '/p/2',
  },
  {
    kind: 'programa',
    title: 'Maestría en Gestión Pública',
    meta: 'USAC · Maestría · Virtual',
    keywords: 'usac maestria virtual',
    href: '/p/3',
  },
  { kind: 'noticia', title: 'Abierta la inscripción al Encuentro Anual', href: '/n/1' },
];

describe('buscador global', () => {
  it('ignora tildes, mayúsculas y palabras vacías', () => {
    expect(terms('Maestría en GESTIÓN de la calidad')).toEqual(['maestria', 'gestion', 'calidad']);
    expect(terms('  ¿y?  ')).toEqual([]);
  });

  it('exige todas las palabras', () => {
    const e = INDEX[2];
    expect(scoreEntry(e, terms('gestion ambiental'))).toBeGreaterThan(0);
    expect(scoreEntry(e, terms('gestion publica'))).toBe(0);
  });

  it('encuentra por lo que no está en el título (universidad, modalidad)', () => {
    const r = search(INDEX, 'gestion usac');
    const progs = r.find((g) => g.kind === 'programa')!;
    expect(progs.hits.map((h) => h.href)).toEqual(['/p/3']);
  });

  it('una sigla exacta pone su grupo primero', () => {
    const r = search(INDEX, 'usac');
    expect(r[0].kind).toBe('universidad');
    expect(r[0].hits[0].href).toBe('/u/1');
    expect(r.find((g) => g.kind === 'programa')!.total).toBe(2);
  });

  it('un prefijo cuenta ("gest" encuentra "Gestión")', () => {
    const r = search(INDEX, 'gest');
    expect(r[0].kind).toBe('programa');
    expect(r[0].total).toBe(2);
  });

  it('respeta el tope por grupo y dice cuántos hay en total', () => {
    const r = search(INDEX, 'maestria', 1);
    expect(r[0].hits).toHaveLength(1);
    expect(r[0].total).toBe(2);
  });

  it('sin palabras útiles no devuelve nada', () => {
    expect(search(INDEX, 'de la')).toEqual([]);
  });
});
