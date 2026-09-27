import type { ProgramLevel } from './types';

/** Orden, explicación breve y color de cada nivel de posgrado. Compartido por portada y catálogo. */
export const LEVELS: ProgramLevel[] = ['Maestria', 'Doctorado', 'Especializacion', 'Diplomado'];

export const LEVEL_META: Record<
  ProgramLevel,
  {
    /** Nombre en plural para cabeceras ("Maestrías"). */
    plural: string;
    /** Qué es, en una línea, para quien no conoce la distinción. */
    hint: string;
    /** Duración típica, como referencia. */
    span: string;
    /** Color del nivel (variables del tema). */
    color: string;
    /** Sigla grande que identifica al nivel en tarjetas y pestañas. */
    glyph: string;
  }
> = {
  Maestria: {
    plural: 'Maestrías',
    hint: 'Grado académico de profundización o investigación tras la licenciatura.',
    span: '1 a 3 años',
    color: 'var(--color-violet-600)',
    glyph: 'M',
  },
  Doctorado: {
    plural: 'Doctorados',
    hint: 'El grado más alto: investigación original que aporta conocimiento nuevo.',
    span: '3 a 5 años',
    color: 'var(--color-violet-800)',
    glyph: 'D',
  },
  Especializacion: {
    plural: 'Especializaciones',
    hint: 'Formación técnica en un área concreta de la profesión.',
    span: '6 a 18 meses',
    color: 'var(--color-indigo)',
    glyph: 'E',
  },
  Diplomado: {
    plural: 'Diplomados',
    hint: 'Actualización corta y práctica, sin grado académico.',
    span: '2 a 6 meses',
    color: 'var(--color-mulberry)',
    glyph: 'Dp',
  },
};
