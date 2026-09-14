import {
  PUBLIC_QUERY_RULES,
  validateFilters,
  validatePopulate,
  validateSort,
} from '../../src/lib/query-whitelist';

const programs = PUBLIC_QUERY_RULES['academic-programs'];

describe('validateFilters', () => {
  it('acepta campos escalares con operadores', () => {
    expect(
      validateFilters({ level: { $eq: 'Maestria' }, name: { $containsi: 'doc' } }, programs.filters)
    ).toBeNull();
  });
  it('acepta relaciones permitidas con sus subcampos', () => {
    expect(
      validateFilters({ university: { documentId: { $eq: 'abc' } } }, programs.filters)
    ).toBeNull();
    expect(validateFilters({ university: { acronym: 'USAC' } }, programs.filters)).toBeNull();
  });
  it('acepta $and / $or / $not con campos permitidos', () => {
    expect(
      validateFilters(
        { $or: [{ level: 'Maestria' }, { $not: { modality: 'Virtual' } }] },
        programs.filters
      )
    ).toBeNull();
  });
  it('rechaza campos no permitidos en cualquier nivel', () => {
    expect(validateFilters({ createdBy: { id: 1 } }, programs.filters)?.field).toBe('createdBy');
    expect(
      validateFilters({ university: { editorProfiles: { id: 1 } } }, programs.filters)?.field
    ).toBe('university.editorProfiles');
    expect(validateFilters({ $or: [{ secret: 1 }] }, programs.filters)?.field).toBe('secret');
  });
  it('rechaza operadores desconocidos', () => {
    expect(validateFilters({ $raw: 'x' }, programs.filters)?.field).toBe('$raw');
    expect(validateFilters({ level: { $sql: 'x' } }, programs.filters)?.field).toBe('level.$sql');
  });
  it('lista los campos permitidos en el error', () => {
    expect(validateFilters({ nope: 1 }, programs.filters)?.allowed).toContain('university.acronym');
  });
});

describe('validateSort', () => {
  it('acepta campo, campo:dir, listas y comas', () => {
    expect(validateSort('name:asc', programs.sort)).toBeNull();
    expect(validateSort(['level:desc', 'name'], programs.sort)).toBeNull();
    expect(validateSort('name,level:desc', programs.sort)).toBeNull();
    expect(validateSort(undefined, programs.sort)).toBeNull();
  });
  it('rechaza campos no permitidos', () => {
    expect(validateSort('createdAt:desc', programs.sort)?.field).toBe('createdAt');
    expect(validateSort(['name', 'id'], programs.sort)?.field).toBe('id');
  });
});

describe('validatePopulate', () => {
  it('acepta * (se sustituye después), listas y objetos permitidos', () => {
    expect(validatePopulate('*', programs.populate)).toBeNull();
    expect(validatePopulate('university', programs.populate)).toBeNull();
    expect(validatePopulate({ university: { fields: ['name'] } }, programs.populate)).toBeNull();
  });
  it('rechaza relaciones no permitidas', () => {
    expect(validatePopulate('createdBy', programs.populate)?.field).toBe('createdBy');
    expect(validatePopulate(['university', 'updatedBy'], programs.populate)?.field).toBe(
      'updatedBy'
    );
  });
});
