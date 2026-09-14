import { sanitizeRichText } from '../../src/security/richtext-sanitizer';

describe('sanitizeRichText', () => {
  it('elimina scripts, iframes, manejadores de eventos y javascript:', () => {
    const dirty =
      'Hola <script>alert(1)</script><iframe src="x"></iframe><b onclick="x()">negrita</b> <a href="javascript:alert(1)">enlace</a> <img src="https://ok/a.png" onerror="alert(1)">';
    const clean = sanitizeRichText(dirty);
    expect(clean).not.toMatch(/script|iframe|onclick|onerror|javascript:/);
    expect(clean).toContain('<b>negrita</b>');
    expect(clean).toContain('<img src="https://ok/a.png" />');
  });
  it('conserva formato básico y enlaces http/https/mailto', () => {
    const md =
      '# Título\n\n**negrita** y <em>énfasis</em> <a href="https://foro.org" target="_blank">sitio</a> <a href="mailto:a@b.c">correo</a>';
    const clean = sanitizeRichText(md);
    expect(clean).toContain('# Título');
    expect(clean).toContain('<em>énfasis</em>');
    expect(clean).toContain('href="https://foro.org"');
    expect(clean).toContain('href="mailto:a@b.c"');
  });
  it('no altera texto plano ni comparaciones con < y >', () => {
    expect(sanitizeRichText('2 &lt; 3 y 5 > 4')).toBe('2 &lt; 3 y 5 &gt; 4');
  });
});
