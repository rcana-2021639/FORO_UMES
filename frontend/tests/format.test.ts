import { describe, expect, it } from 'vitest';
import { excerpt, formatDate, parseVideo, videoEmbed, videoThumbnail } from '@/lib/format';

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
