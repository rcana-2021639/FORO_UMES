/**
 * Funciones puras agregadas en la auditoría de producción (oct-2026).
 */
import { routePath } from '../../src/lib/route-path';
import { ipKey } from '../../src/lib/rate-limiter';
import { sanitizeLine, validateContact } from '../../src/lib/contact-validation';
import { applyPanelConfig, PANEL_LABELS } from '../../src/panel/labels';

describe('routePath', () => {
  it('lleva a la misma ruta lo que el enrutador de Strapi trata como igual', () => {
    for (const variant of ['/api/contact', '/API/CONTACT', '/api/contact/', '/Api/Contact//']) {
      expect(routePath(variant)).toBe('/api/contact');
    }
    expect(routePath('/content-manager/./collection-types//api::news.news/')).toBe(
      '/content-manager/collection-types/api::news.news'
    );
  });
  it('la raíz y una ruta vacía quedan como "/"', () => {
    expect(routePath('/')).toBe('/');
    expect(routePath('')).toBe('/');
  });
});

describe('ipKey', () => {
  it('IPv4 y su forma mapeada en IPv6 son la misma clave', () => {
    expect(ipKey('203.0.113.7')).toBe('203.0.113.7');
    expect(ipKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });
  it('todas las direcciones de un mismo /64 comparten clave', () => {
    const a = ipKey('2001:db8:1234:5678::1');
    expect(ipKey('2001:0db8:1234:5678:ffff:ffff:ffff:ffff')).toBe(a);
    expect(ipKey('2001:DB8:1234:5678:0:0:0:abcd')).toBe(a);
    expect(a).toBe('2001:db8:1234:5678::/64');
  });
  it('redes /64 distintas tienen claves distintas', () => {
    expect(ipKey('2001:db8:1234:5679::1')).not.toBe(ipKey('2001:db8:1234:5678::1'));
    expect(ipKey('::1')).toBe('0:0:0:0::/64');
  });
});

describe('sanitizeLine y validateContact', () => {
  it('quita los saltos de línea de los campos de una línea (sin inyección de cabeceras)', () => {
    expect(sanitizeLine('Consulta\r\nBcc: victima@ejemplo.org')).toBe(
      'Consulta Bcc: victima@ejemplo.org'
    );
    expect(sanitizeLine(`Hola${String.fromCharCode(0x2028)}mundo`)).toBe('Hola mundo');
  });
  it('el asunto y el nombre salen en una sola línea; el mensaje conserva sus párrafos', () => {
    const result = validateContact({
      name: 'Ana\nLópez',
      email: 'ana@ejemplo.org',
      subject: 'Becas\r\nCc: otro@ejemplo.org',
      message: 'Primer párrafo.\n\nSegundo párrafo.',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.name).toBe('Ana López');
    expect(result.data.subject).toBe('Becas Cc: otro@ejemplo.org');
    expect(result.data.message).toBe('Primer párrafo.\n\nSegundo párrafo.');
  });
  it('rechaza correos que se leerían como varios destinatarios', () => {
    for (const email of ['a,b@ejemplo.org', 'a;b@ejemplo.org', '"x"<a@ejemplo.org>']) {
      const result = validateContact({ name: 'Ana', email, message: 'Mensaje de prueba.' });
      expect({ email, ok: result.ok }).toEqual({ email, ok: false });
    }
  });
});

describe('applyPanelConfig', () => {
  const current = {
    settings: { mainField: 'id', pageSize: 10 },
    metadatas: {
      id: { edit: {}, list: { label: 'id', searchable: true } },
      fullName: {
        edit: { label: 'fullName', description: '', placeholder: '', visible: true },
        list: { label: 'fullName', searchable: true },
      },
      institutionalEmail: {
        edit: { label: 'institutionalEmail', description: '', placeholder: '', visible: true },
        list: { label: 'institutionalEmail', searchable: true },
      },
    },
    layouts: { list: ['id', 'fullName'], edit: [[{ name: 'fullName', size: 6 }]] },
  };
  const config = {
    mainField: 'fullName',
    list: ['fullName', 'institutionalEmail', 'campoQueNoExiste'],
    fields: {
      fullName: { label: 'Nombre completo', placeholder: 'Dra. Ana' },
      institutionalEmail: { label: 'Correo institucional', description: 'Se publica.' },
    },
  };

  it('pone etiquetas, ayudas y columnas sin tocar el resto de la configuración', () => {
    const next = applyPanelConfig(current, config);
    expect(next).not.toBeNull();
    expect(next!.settings).toEqual({ mainField: 'fullName', pageSize: 10 });
    expect(next!.metadatas.fullName.edit).toMatchObject({
      label: 'Nombre completo',
      placeholder: 'Dra. Ana',
      visible: true,
    });
    expect(next!.metadatas.institutionalEmail.list).toMatchObject({
      label: 'Correo institucional',
      searchable: true,
    });
    expect(next!.metadatas.id.list).toMatchObject({ label: 'ID' });
    expect(next!.layouts.list).toEqual(['fullName', 'institutionalEmail']);
    expect(next!.layouts.edit).toBe(current.layouts.edit);
  });

  it('devuelve null si ya está al día (no reescribe en cada arranque)', () => {
    const next = applyPanelConfig(current, config)!;
    expect(applyPanelConfig(next, config)).toBeNull();
  });

  it('todas las columnas declaradas existen en su tipo de contenido', () => {
    for (const [uid, panel] of Object.entries(PANEL_LABELS)) {
      for (const column of panel.list ?? []) {
        expect({
          uid,
          column,
          known: column in panel.fields || column === 'createdAt' || column === 'publishedAt',
        }).toEqual({ uid, column, known: true });
      }
    }
  });
});

describe('applyPanelConfig · orden del formulario', () => {
  const current = {
    settings: {},
    metadatas: {
      name: { edit: { label: 'name' } },
      description: { edit: { label: 'description' } },
      topics: { edit: { label: 'topics' } },
      audience: { edit: { label: 'audience' } },
      infoUrl: { edit: { label: 'infoUrl' } },
    },
    layouts: {
      list: ['name'],
      edit: [
        [{ name: 'name', size: 6 }],
        [{ name: 'description', size: 12 }],
        [{ name: 'infoUrl', size: 6 }],
        [
          { name: 'topics', size: 12 },
          { name: 'audience', size: 6 },
        ],
      ],
    },
  };

  it('ordena por filas, reparte el ancho y deja al final lo que no se nombra', () => {
    const next = applyPanelConfig(current, {
      fields: {},
      edit: [['name'], ['topics', 'audience'], ['description'], ['noExiste']],
    });
    expect(next!.layouts.edit).toEqual([
      [{ name: 'name', size: 12 }],
      [
        { name: 'topics', size: 6 },
        { name: 'audience', size: 6 },
      ],
      [{ name: 'description', size: 12 }],
      [{ name: 'infoUrl', size: 6 }],
    ]);
  });

  it('los programas tienen sus campos nuevos con etiqueta y en el formulario', () => {
    const p = PANEL_LABELS['api::academic-program.academic-program'];
    for (const f of ['faculty', 'topics', 'audience']) {
      expect(p.fields[f]?.label).toBeTruthy();
      expect(p.edit!.flat()).toContain(f);
    }
  });
});
