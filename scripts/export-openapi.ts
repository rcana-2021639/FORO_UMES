/**
 * Exporta la especificación OpenAPI generada por @strapi/plugin-documentation a `openapi.yaml`
 * en la raíz del repositorio, para versionarla junto con el código.
 *
 * Uso: npm run openapi:export   (con el servidor detenido o corriendo, da igual: lee el archivo)
 * El JSON fuente se regenera cada vez que Strapi arranca en desarrollo.
 */
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const version = '1.0.0';
const source = path.resolve(
  'src/extensions/documentation/documentation',
  version,
  'full_documentation.json'
);
const target = path.resolve('openapi.yaml');

if (!fs.existsSync(source)) {
  console.error(`[openapi] no existe ${source}. Arranca Strapi (npm run develop) para generarlo.`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(source, 'utf8'));
// Endpoints que la API pública no expone (se sirven solo desde el panel)
for (const p of Object.keys(spec.paths)) {
  if (/^\/(contact-messages|editor-profiles|audit-logs)/.test(p)) delete spec.paths[p];
}
fs.writeFileSync(target, YAML.stringify(spec, { lineWidth: 0 }), 'utf8');
console.log(`[openapi] escrito ${target} (${Object.keys(spec.paths).length} rutas)`);
