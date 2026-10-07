import { describe, expect, it } from 'vitest';
import { daysUntil, relativeDay } from '@/lib/activity-ink';
import {
  countByLevel,
  excerpt,
  formatDate,
  levelsByUniversity,
  modalitiesByUniversity,
  parseVideo,
  programBrief,
  readingMinutes,
  videoEmbed,
  videoThumbnail,
} from '@/lib/format';

describe('excerpt', () => {
  it('deja texto plano: sin Markdown, imágenes, enlaces ni HTML', () => {
    const md =
      '## Título\n\n**Negrita** y un [enlace](https://foro.org) ![foto](https://x/y.png) <u>subrayado</u>';
    expect(excerpt(md)).toBe('Título Negrita y un enlace subrayado');
  });
  it('recorta en el último espacio y agrega puntos suspensivos', () => {
    expect(excerpt('uno dos tres cuatro', 12)).toBe('uno dos…');
    expect(excerpt(null)).toBe('');
  });
  it('muestra los caracteres, no las entidades que guardaba el backend', () => {
    expect(excerpt('I+D &amp; innovación: 5 &lt; 9')).toBe('I+D & innovación: 5 < 9');
    // Una cita escapada pierde su marca como cualquier otra cita
    expect(excerpt('&gt; «Una cita»')).toBe('«Una cita»');
  });
});

describe('formatDate', () => {
  it('las fechas YYYY-MM-DD no se corren un día por la zona horaria', () => {
    expect(formatDate('2026-10-22')).toBe('22 de octubre de 2026');
    expect(formatDate('no es fecha')).toBe('');
  });
});

describe('videos de YouTube y Vimeo', () => {
  it('reconoce los formatos habituales de URL', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=YFgaqkjYm2o',
      'https://youtu.be/YFgaqkjYm2o',
      'https://m.youtube.com/watch?v=YFgaqkjYm2o&t=30',
      'https://www.youtube.com/shorts/YFgaqkjYm2o',
      'https://www.youtube.com/embed/YFgaqkjYm2o',
    ]) {
      expect(parseVideo(url)).toEqual({ provider: 'youtube', id: 'YFgaqkjYm2o' });
    }
    expect(parseVideo('https://vimeo.com/123456')).toEqual({ provider: 'vimeo', id: '123456' });
  });

  it('arma el reproductor sin cookies y la miniatura', () => {
    expect(videoEmbed('https://youtu.be/YFgaqkjYm2o')).toBe(
      'https://www.youtube-nocookie.com/embed/YFgaqkjYm2o?autoplay=1&rel=0'
    );
    expect(videoThumbnail('https://youtu.be/YFgaqkjYm2o')).toBe(
      'https://img.youtube.com/vi/YFgaqkjYm2o/hqdefault.jpg'
    );
    expect(videoEmbed('https://vimeo.com/42')).toBe('https://player.vimeo.com/video/42?autoplay=1');
  });

  it('rechaza ids imposibles, otros sitios y esquemas peligrosos', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=../../algo',
      'https://www.youtube.com/watch?v=abc',
      'https://youtu.be/YFgaqkjYm2o%22onload%3D',
      'https://evil.example/watch?v=YFgaqkjYm2o',
      'https://youtube.com.evil.example/watch?v=YFgaqkjYm2o',
      'javascript:alert(1)//youtu.be/YFgaqkjYm2o',
      'https://vimeo.com/abc',
      'no es url',
      '',
      null,
    ]) {
      expect(parseVideo(url)).toBeNull();
      expect(videoEmbed(url)).toBeNull();
    }
  });
});

describe('conteos por nivel', () => {
  const u = (documentId: string) => ({ id: 1, documentId, name: documentId });
  const programs = [
    { level: 'Maestria' as const, university: u('a') },
    { level: 'Maestria' as const, university: u('b') },
    { level: 'Doctorado' as const, university: u('a') },
    { level: 'Diplomado' as const, university: null },
  ];
  it('cuenta toda la oferta por nivel, también los niveles vacíos', () => {
    expect(countByLevel(programs)).toEqual({
      Maestria: 2,
      Doctorado: 1,
      Especializacion: 0,
      Diplomado: 1,
    });
  });
  it('separa por universidad e ignora programas sin universidad', () => {
    expect(levelsByUniversity(programs)).toEqual({
      a: { Maestria: 1, Doctorado: 1, Especializacion: 0, Diplomado: 0 },
      b: { Maestria: 1, Doctorado: 0, Especializacion: 0, Diplomado: 0 },
    });
  });
});

describe('modalidades por universidad', () => {
  it('cuenta presencial, virtual e híbrida de cada una', () => {
    const u = { id: 1, documentId: 'a', name: 'A' };
    expect(
      modalitiesByUniversity([
        { modality: 'Virtual', university: u },
        { modality: 'Virtual', university: u },
        { modality: 'Hibrida', university: u },
        { modality: 'Presencial', university: null },
      ])
    ).toEqual({ a: { Presencial: 0, Virtual: 2, Hibrida: 1 } });
  });
});

describe('fechas relativas de actividades', () => {
  const today = new Date(2026, 9, 1); // 1 de octubre de 2026, hora local
  it('cuenta días enteros hacia adelante y hacia atrás', () => {
    expect(daysUntil('2026-10-22', today)).toBe(21);
    expect(daysUntil('2026-10-01', today)).toBe(0);
    expect(daysUntil('2026-09-30', today)).toBe(-1);
    expect(daysUntil('2027-01-01', today)).toBe(92);
  });
  it('lo dice en palabras', () => {
    expect(relativeDay(0)).toBe('Es hoy');
    expect(relativeDay(1)).toBe('Es mañana');
    expect(relativeDay(21)).toBe('Faltan 21 días');
    expect(relativeDay(-1)).toBe('Fue ayer');
    expect(relativeDay(-10)).toBe('Hace 10 días');
    expect(relativeDay(-60)).toBe('Hace 2 meses');
    expect(relativeDay(-400)).toBe('Hace 1 año');
  });
});

describe('tiempo de lectura', () => {
  it('cuenta palabras reales a 200 por minuto, mínimo 1', () => {
    expect(readingMinutes(null)).toBe(1);
    expect(readingMinutes('Hola mundo')).toBe(1);
    expect(readingMinutes(Array(600).fill('palabra').join(' '))).toBe(3);
  });
  it('no cuenta marcas de Markdown, imágenes ni direcciones', () => {
    const noise = '![foto](https://x.y/z.png) https://a.b/c *** - - # > '.repeat(200);
    const md = `## Título\n\n${Array(399).fill('texto').join(' ')} [enlace](https://foro.org) ${noise}`;
    expect(readingMinutes(md)).toBe(2);
  });
});

describe('programBrief', () => {
  const md = [
    'La **Maestría en Educación** de la Universidad de San Carlos de Guatemala se imparte en la Facultad de Humanidades. Forma investigadores. Culmina con una tesis.',
    '**Ejes del programa**',
    '- Política educativa\n- Investigación &amp; docencia',
    '**Dirigido a:** Profesionales con licenciatura.',
    '**Modalidad:** Presencial · **Duración:** 2 años',
  ].join('\n\n');
  it('separa facultad, frases, ejes y a quién va dirigido', () => {
    expect(programBrief(md)).toEqual({
      where: 'Facultad de Humanidades',
      lead: 'Forma investigadores. Culmina con una tesis.',
      axes: ['Política educativa', 'Investigación & docencia'],
      audience: 'Profesionales con licenciatura.',
    });
  });
  it('si no sigue la plantilla, todo queda como texto (recortado) y nada se pierde', () => {
    expect(programBrief('Un programa **distinto**.\n\nCon otro párrafo.')).toEqual({
      where: null,
      lead: 'Un programa distinto. Con otro párrafo.',
      axes: [],
      audience: null,
    });
    expect(programBrief(null)).toEqual({ where: null, lead: null, axes: [], audience: null });
  });
  it('los campos propios de Strapi mandan sobre lo que dice la descripción', () => {
    expect(
      programBrief(md, {
        faculty: '  Escuela de Estudios de Postgrado ',
        topics: '- Evaluación\r\n\nCurrículo\n• Gestión\nDidáctica\nUno de más',
        audience: 'Docentes universitarios',
      })
    ).toEqual({
      where: 'Escuela de Estudios de Postgrado',
      lead: 'Forma investigadores. Culmina con una tesis.',
      axes: ['Evaluación', 'Currículo', 'Gestión', 'Didáctica'],
      audience: 'Docentes universitarios',
    });
  });
  it('un campo propio vacío no borra lo que sí está en la descripción', () => {
    expect(programBrief(md, { faculty: ' ', topics: '\n', audience: null })).toEqual(
      programBrief(md)
    );
  });
});
