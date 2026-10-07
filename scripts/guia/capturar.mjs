/* global document, localStorage, scrollBy -- código que corre dentro de la página (page.evaluate) */
// Capturas de la guía de editores (public/guia/). Recorre el panel LOCAL con la cuenta de prueba
// (scripts/demo-editor.ts) y guarda, por paso, una captura y el recuadro que se resalta (en % de
// la imagen). Luego `python scripts/guia/construir.py` las pasa a WebP y escribe public/guia/datos.js.
//
//   npm i --no-save playwright && npx playwright install chromium
//   npx tsx scripts/demo-editor.ts
//   node scripts/guia/capturar.mjs            (Strapi en :1337, sitio en :3000)
//
// Crea un programa "(ejemplo)" para mostrar el guardado: bórralo después desde el panel.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const ROOT = path.resolve(import.meta.dirname, '..', '..');
const cred = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'scripts/.cuentas-demo.local.json'), 'utf8')
);
const OUT = path.join(ROOT, '.tmp/guia-capturas');
fs.mkdirSync(OUT, { recursive: true });
const W = 1366,
  H = 820;
const onlyList = process.argv[2] ? process.argv[2].split(',') : null;
const want = (f) => !onlyList || onlyList.includes(f);

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: W, height: H }, locale: 'es-GT' });
let p = await ctx.newPage();
const steps = [];
let n = 0;

async function box(target, pad = 8) {
  if (!target) return null;
  const loc = typeof target === 'string' ? p.locator(target).first() : target;
  const r = await loc.boundingBox();
  if (!r) return null;
  const x = Math.max(0, r.x - pad),
    y = Math.max(0, r.y - pad);
  const w = Math.min(W - x, r.width + pad * 2),
    h = Math.min(H - y, r.height + pad * 2);
  return {
    x: +((x / W) * 100).toFixed(2),
    y: +((y / H) * 100).toFixed(2),
    w: +((w / W) * 100).toFixed(2),
    h: +((h / H) * 100).toFixed(2),
  };
}
async function shot(flow, target, title, text, opts = {}) {
  await p.waitForTimeout(opts.wait ?? 700);
  const name = `${flow}-${String(++n).padStart(2, '0')}`;
  const hl = opts.boxes
    ? await Promise.all(opts.boxes.map((t) => box(t)))
    : [await box(target, opts.pad)];
  await p.screenshot({ path: `${OUT}/${name}.png` });
  steps.push({ flow, img: `${name}.webp`, boxes: hl.filter(Boolean), title, text });
  fs.writeFileSync(
    `${OUT}/steps-${flow}.json`,
    JSON.stringify(
      steps.filter((x) => x.flow === flow),
      null,
      1
    )
  );
  console.log(name, title);
}

const CM = 'http://localhost:1337/admin/content-manager/collection-types/';
const navLink = (label) =>
  p
    .locator('nav a, aside a')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .first();

// ---------------------------------------------------------------- Entrar
await p.goto('http://localhost:1337/admin/auth/login', { waitUntil: 'networkidle' });
await p.evaluate(() => localStorage.setItem('strapi-admin-language', 'es'));
await p.reload({ waitUntil: 'networkidle' });
await shot(
  'entrar',
  'input[name=email]',
  'Abre el panel',
  'Entra a la dirección del panel que te dio el Foro. Escribe el correo de tu cuenta.'
);
await p.fill('input[name=email]', 'nombre@universidad.edu.gt');
await shot(
  'entrar',
  'input[name=password]',
  'Tu contraseña',
  'Escribe tu contraseña. Si la olvidaste, usa «¿Olvidó su contraseña?» debajo del recuadro: te llega un correo para crear otra.'
);
await shot(
  'entrar',
  'button[type=submit]',
  'Iniciar sesión',
  'Pulsa «Iniciar sesión». Después de una hora sin usarlo, el panel te pedirá entrar de nuevo (es por seguridad).'
);
await p.fill('input[name=email]', cred.email);
await p.fill('input[name=password]', cred.password);
await p.click('button[type=submit]');
await p.waitForURL(/\/admin\/?$/, { timeout: 30000 });
await ctx.storageState({ path: `${OUT}/sesion.json` });
await ctx.close();
const ctx2 = await b.newContext({
  viewport: { width: W, height: H },
  locale: 'es-GT',
  storageState: `${OUT}/sesion.json`,
});
p = await ctx2.newPage();
await p.goto('http://localhost:1337/admin', { waitUntil: 'networkidle' });
await p.waitForTimeout(2500);
await p.evaluate(() =>
  document.querySelector('[class*="Banner"] button, [aria-label="Cerrar el aviso"]')?.click()
);
await shot(
  'entrar',
  null,
  'El inicio del panel',
  'Aquí ves lo último que editaste. Abajo está la tarjeta «Cómo cargar información» con estos mismos pasos.',
  { boxes: [] }
);
await shot(
  'entrar',
  p.locator('a[href*="content-manager"]').first(),
  'El menú',
  'A la izquierda: el icono de la pluma es el gestor de contenido (donde cargas todo) y el de la foto, la biblioteca de medios.',
  { pad: 6 }
);

// ---------------------------------------------------------------- Programa
if (want('programa')) {
  n = 0;
  await p.goto(CM + 'api::academic-program.academic-program', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await shot(
    'programa',
    navLink('Programa académico'),
    'Programa académico',
    'En el gestor de contenido elige «Programa académico». Solo ves los programas de tu universidad.'
  );
  await shot(
    'programa',
    p.getByRole('link', { name: /Crear nueva entrada/ }).first(),
    'Crear un programa',
    'Pulsa «Crear nueva entrada». Para cambiar uno que ya existe, haz clic en su nombre en la lista.'
  );
  await p
    .getByRole('link', { name: /Crear nueva entrada/ })
    .first()
    .click();
  await p.waitForTimeout(2000);
  await p.getByLabel('Nombre del programa').fill('Maestría en Gestión Pública (ejemplo)');
  await shot(
    'programa',
    p.getByLabel('Nombre del programa'),
    'El nombre',
    'El nombre oficial del programa, sin el nombre de la universidad.'
  );
  await p.getByRole('combobox', { name: /^Grado/ }).click();
  await p.getByRole('option', { name: 'Maestria' }).click();
  await p.getByRole('combobox', { name: /^Modalidad/ }).click();
  await p.getByRole('option', { name: 'Hibrida' }).click();
  await shot(
    'programa',
    null,
    'Grado y modalidad',
    'Elige el grado (Maestría, Doctorado, Especialización o Diplomado) y la modalidad. En la lista van sin tilde; el sitio las muestra con tilde.',
    {
      boxes: [
        p.getByRole('combobox', { name: /^Grado/ }),
        p.getByRole('combobox', { name: /^Modalidad/ }),
      ],
    }
  );
  await p.getByLabel('Duración').fill('2 años (4 semestres)');
  await p.getByLabel('Facultad o escuela').fill('Facultad de Ciencias Económicas');
  await shot(
    'programa',
    null,
    'Duración y facultad',
    'La duración, como la dirías a un estudiante, y la facultad o escuela que lo imparte.',
    { boxes: [p.getByLabel('Duración'), p.getByLabel('Facultad o escuela')] }
  );
  const editor = p.locator('.CodeMirror').first();
  await editor.scrollIntoViewIfNeeded();
  await editor.click();
  await p.keyboard.type(
    'Forma profesionales capaces de dirigir instituciones públicas con criterios de transparencia y resultados.'
  );
  await p.keyboard.press('Enter');
  await p.keyboard.press('Enter');
  await p.keyboard.type(
    'Requisitos: licenciatura y entrevista. Horario: viernes por la tarde y sábados.'
  );
  await shot(
    'programa',
    p.getByText('Descripción', { exact: true }).locator('..').locator('..'),
    'La descripción',
    'El primer párrafo es el resumen que se ve en la portada: que se entienda solo. Después, requisitos, horario y plan de estudios.',
    { pad: 4 }
  );
  const topics = p.getByLabel('Temas principales');
  await topics.scrollIntoViewIfNeeded();
  await topics.fill('Políticas públicas\nPresupuesto por resultados\nÉtica y transparencia');
  await p
    .getByLabel('Dirigido a')
    .fill('Profesionales que trabajan o quieren trabajar en el sector público');
  await shot(
    'programa',
    null,
    'Temas y a quién va dirigido',
    'Hasta cuatro temas, uno por línea, y en una frase a quién va dirigido. Se ven en la ficha de la portada.',
    { boxes: [topics, p.getByLabel('Dirigido a')] }
  );
  const url = p.getByLabel('Enlace oficial del programa');
  await url.scrollIntoViewIfNeeded();
  await url.fill('https://www.usac.edu.gt/');
  await shot(
    'programa',
    null,
    'Enlace y universidad',
    'El enlace a la página oficial del programa. La universidad puedes dejarla vacía: se asigna sola la tuya.',
    { boxes: [url, p.getByRole('combobox', { name: /^Universidad/ })] }
  );
  await p.getByRole('button', { name: 'Guardar' }).scrollIntoViewIfNeeded();
  await shot(
    'programa',
    p.getByRole('button', { name: 'Guardar' }),
    'Guardar',
    'Pulsa «Guardar». Si falta algo obligatorio, el campo se marca en rojo y te dice qué arreglar.'
  );
  await p.getByRole('button', { name: 'Guardar' }).click();
  await p.waitForTimeout(1200);
  await shot(
    'programa',
    p.locator('[role="status"], [role="alert"]').first(),
    'Listo',
    'Aparece «Guardado». El programa se ve en el sitio en unos minutos (el sitio se actualiza solo).',
    { wait: 300 }
  );
  const id = p.url().split('/').pop();
  fs.writeFileSync(`${OUT}/ejemplo-id.txt`, id);
}

// ---------------------------------------------------------------- Representante
if (want('representante')) {
  n = 0;
  await p.goto(CM + 'api::representative.representative', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await shot(
    'representante',
    p.locator('table tbody tr').first(),
    'Tu representante',
    'En «Representante» está quien representa a tu universidad ante el Foro. Haz clic en su nombre para editarlo.'
  );
  await p.locator('table tbody tr').first().locator('a').first().click();
  await p.waitForTimeout(2200);
  await shot(
    'representante',
    null,
    'Datos y foto',
    'Actualiza cargo, correo institucional y foto. La foto: cuadrada o vertical, PNG, JPG o WebP de hasta 5 MB.',
    { boxes: [] }
  );
}

// ---------------------------------------------------------------- Actividad
if (want('actividad')) {
  n = 0;
  await p.goto(CM + 'api::activity.activity/create', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p
    .getByRole('textbox', { name: /^Título/ })
    .first()
    .fill('Jornada de investigación en posgrado (ejemplo)');
  await p.getByRole('combobox', { name: /^Tipo/ }).click();
  await p.getByRole('option', { name: 'Seminario' }).click();
  await shot(
    'actividad',
    null,
    'Una actividad',
    'En «Actividad» puedes proponer encuentros, seminarios o reuniones: título, tipo y fecha.',
    {
      boxes: [
        p.getByRole('textbox', { name: /^Título/ }).first(),
        p.getByRole('combobox', { name: /^Tipo/ }),
      ],
    }
  );
  const unis = p
    .getByText('Universidades participantes', { exact: true })
    .locator('..')
    .locator('..');
  await unis.scrollIntoViewIfNeeded();
  await shot(
    'actividad',
    unis,
    'Universidades participantes',
    'Tu universidad se agrega sola. Puedes sumar otras; quitar una solo lo puede hacer el Super Admin.',
    { pad: 4 }
  );
}

// ---------------------------------------------------------------- Noticia
if (want('noticia')) {
  n = 0;
  await p.goto(CM + 'api::news.news/create', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p
    .getByRole('textbox', { name: /^Título/ })
    .first()
    .fill('La USAC abre convocatoria de becas (ejemplo)');
  await p.getByLabel('Resumen').fill('Una o dos oraciones que cuentan la noticia.');
  await shot(
    'noticia',
    null,
    'Una noticia o un aporte',
    'Escribe título, resumen y contenido. Las noticias y los aportes quedan como borrador.',
    { boxes: [p.getByRole('textbox', { name: /^Título/ }).first(), p.getByLabel('Resumen')] }
  );
  await shot(
    'noticia',
    p.getByRole('button', { name: 'Guardar' }),
    'Guarda el borrador',
    'Pulsa «Guardar» y avisa al Foro: el Super Admin revisa y publica. El botón «Publicar» no es para editores.'
  );
}

// ---------------------------------------------------------------- Fotos
if (want('fotos')) {
  n = 0;
  await p.goto(CM + 'api::news.news/create', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  const cover = p
    .getByText(/Imagen de portada|Portada/)
    .first()
    .locator('..')
    .locator('..');
  await cover.scrollIntoViewIfNeeded();
  await shot(
    'fotos',
    cover,
    'Agregar una foto',
    'En un campo de imagen, haz clic en el recuadro para elegir una foto ya subida o subir una nueva.',
    { pad: 4 }
  );
}

// ---------------------------------------------------------------- Dónde se ve en el sitio
{
  const sitio = await b.newPage({ viewport: { width: 1366, height: 820 } });
  await sitio.goto('http://localhost:3000/?lenis=0', { waitUntil: 'load' });
  await sitio.waitForTimeout(1500);
  for (let k = 0; k < 200; k++) {
    const d = await sitio.evaluate(
      () => document.querySelector('.fichero').getBoundingClientRect().top - 90
    );
    if (Math.abs(d) < 4) break;
    await sitio.evaluate((d) => scrollBy(0, Math.max(-600, Math.min(600, d))), d);
    await sitio.waitForTimeout(70);
  }
  await sitio.waitForTimeout(2500);
  await sitio.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await sitio.waitForTimeout(300);
  const sel = {
    name: '.fopen__name',
    where: '.fopen__where',
    lead: '.fopen__lead',
    axes: '.fopen__axes',
    for: '.fopen__for',
    btn: '.fopen__actions',
  };
  const boxes = {};
  for (const [k, s] of Object.entries(sel)) {
    const r = await sitio.locator(s).first().boundingBox();
    if (r)
      boxes[k] = {
        x: +(r.x / 13.66).toFixed(2),
        y: +(r.y / 8.2).toFixed(2),
        w: +(r.width / 13.66).toFixed(2),
        h: +(r.height / 8.2).toFixed(2),
      };
  }
  fs.writeFileSync(`${OUT}/sitio-boxes.json`, JSON.stringify(boxes, null, 1));
  await sitio.screenshot({ path: `${OUT}/sitio-01.png` });
}

await b.close();
