import { readRelation, refMatches } from '../../src/security/relation-input';

const target = { id: 7, documentId: 'doc7' };

describe('readRelation', () => {
  it('interpreta valores escalares e ids/documentIds', () => {
    expect(readRelation(7)).toEqual({
      present: true,
      replaces: true,
      connect: [{ id: 7 }],
      disconnect: [],
    });
    expect(readRelation('doc7').connect).toEqual([{ documentId: 'doc7' }]);
    expect(readRelation('42').connect).toEqual([{ id: 42 }]);
  });
  it('interpreta listas y objetos', () => {
    expect(readRelation([7, 'doc8', { id: 9 }, { documentId: 'doc10' }]).connect).toHaveLength(4);
    expect(readRelation({ id: '7', documentId: 'doc7' }).connect).toEqual([
      { id: 7, documentId: 'doc7' },
    ]);
  });
  it('interpreta connect/disconnect/set', () => {
    const r = readRelation({ connect: [{ documentId: 'a' }], disconnect: [{ id: 1 }] });
    expect(r).toEqual({
      present: true,
      replaces: false,
      connect: [{ documentId: 'a' }],
      disconnect: [{ id: 1 }],
    });
    const s = readRelation({ set: [1, 2] });
    expect(s.replaces).toBe(true);
    expect(s.connect).toHaveLength(2);
  });
  it('distingue ausente, null y elementos inválidos', () => {
    expect(readRelation(undefined).present).toBe(false);
    expect(readRelation(null)).toEqual({
      present: true,
      replaces: true,
      connect: [],
      disconnect: [],
    });
    expect(readRelation([null, {}, 'x']).connect).toEqual([{ documentId: 'x' }]);
  });
});

describe('refMatches', () => {
  it('compara por id o por documentId', () => {
    expect(refMatches({ id: 7 }, target)).toBe(true);
    expect(refMatches({ documentId: 'doc7' }, target)).toBe(true);
    expect(refMatches({ id: 8 }, target)).toBe(false);
    expect(refMatches({ documentId: 'otro' }, target)).toBe(false);
    expect(refMatches({}, target)).toBe(false);
  });
});
