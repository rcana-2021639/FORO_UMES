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
  it('no altera texto plano: > y & quedan como caracteres, < como entidad', () => {
    expect(sanitizeRichText('2 &lt; 3 y 5 > 4')).toBe('2 &lt; 3 y 5 > 4');
    expect(sanitizeRichText('I+D & innovación')).toBe('I+D & innovación');
  });

  it('respeta la sintaxis Markdown de citas y código', () => {
    const md = ['Texto.', '', '> «Queremos que un estudiante…»', '', '`a && b`'].join('\n');
    expect(sanitizeRichText(md)).toBe(md);
  });

  it('es idempotente: guardar dos veces no cambia el contenido', () => {
    for (const md of ['A & B > C', '> cita con & y <b>negrita</b>', 'x &amp; y', '2 < 3']) {
      const once = sanitizeRichText(md);
      expect(sanitizeRichText(once)).toBe(once);
    }
  });

  it('devolver > y & no reabre etiquetas', () => {
    const clean = sanitizeRichText('&lt;script&gt;alert(1)&lt;/script&gt; <script>x</script>');
    expect(clean).not.toMatch(/<script/i);
  });

  // Regresión de los avisos GHSA-vccv-cmxp-4j9h, GHSA-g8qq-57p8-ggw5 y GHSA-jxwj-j7wr-gfrw
  // (sanitize-html < 2.17.7) y variantes clásicas de ofuscación de javascript:
  it.each([
    ['esquema en mayúsculas', '<a href="JaVaScRiPt:alert(1)">x</a>'],
    ['esquema con entidades', '<a href="&#106;avascript:alert(1)">x</a>'],
    ['esquema con espacios y tabulador', '<a href=" java\tscript:alert(1)">x</a>'],
    [
      'data: en enlaces',
      '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
    ],
    ['data: en imágenes', '<img src="data:image/svg+xml,<svg onload=alert(1)>">'],
    [
      'action/formaction',
      '<form action="javascript:alert(1)"><button formaction="javascript:alert(1)">x</button></form>',
    ],
    [
      'poster/background/data',
      '<video poster="javascript:alert(1)"></video><table background="javascript:alert(1)"></table><object data="javascript:alert(1)"></object>',
    ],
    [
      'SVG SMIL',
      '<svg><a><animate attributeName="href" values="javascript:alert(1)"/><text>x</text></a></svg>',
    ],
    ['cierre de textarea con barra', '<textarea/></textarea/><img src=x onerror=alert(1)>'],
  ])('neutraliza %s', (_, dirty) => {
    expect(sanitizeRichText(dirty)).not.toMatch(
      /javascript|data:|onerror|onload|<(form|button|video|object|svg|animate|textarea)/i
    );
  });

  it('los enlaces que abren otra pestaña llevan rel="noopener noreferrer"', () => {
    const clean = sanitizeRichText('<a href="https://foro.org" target="_blank" rel="opener">x</a>');
    expect(clean).toContain('target="_blank"');
    expect(clean).toContain('rel="noopener noreferrer"');
    expect(clean).not.toContain('rel="opener"');
  });
});
