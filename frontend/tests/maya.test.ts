import { describe, expect, it } from 'vitest';
import { mayaReading, vigesimal } from '@/components/ui/MayaNumber';

describe('numeración maya (base 20)', () => {
  it('descompone en veintenas, de la cifra mayor a la menor', () => {
    expect(vigesimal(0)).toEqual([0]);
    expect(vigesimal(9)).toEqual([9]);
    expect(vigesimal(19)).toEqual([19]);
    expect(vigesimal(20)).toEqual([1, 0]);
    expect(vigesimal(124)).toEqual([6, 4]);
    expect(vigesimal(400)).toEqual([1, 0, 0]);
    expect(vigesimal(2026)).toEqual([5, 1, 6]);
  });

  it('no acepta negativos ni decimales', () => {
    expect(vigesimal(-3)).toEqual([0]);
    expect(vigesimal(9.8)).toEqual([9]);
  });

  it('explica la lectura en palabras, con singular y plural', () => {
    expect(mayaReading(124)).toBe('124 en numeración maya: 6 veintenas y 4 unidades.');
    expect(mayaReading(21)).toBe('21 en numeración maya: 1 veintena y 1 unidad.');
    expect(mayaReading(40)).toBe('40 en numeración maya: 2 veintenas.');
    expect(mayaReading(0)).toBe('0 en numeración maya: la concha, que vale cero.');
  });
});
