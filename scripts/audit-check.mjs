// Auditoría de dependencias para el CI: falla con cualquier aviso alto o crítico, salvo los
// aceptados en scripts/audit-allowlist.json (cada uno con su justificación y fecha de vencimiento).
//
// Por qué no basta `npm audit --audit-level=high`: algunos avisos no tienen versión corregida
// (p. ej. `braces`, que Strapi usa para vigilar archivos en desarrollo) y bloquearían todo
// despliegue para siempre. Desactivar la auditoría sería peor: dejaría pasar los avisos nuevos.
// Una excepción vencida vuelve a fallar, para que alguien la revise.
//
// Uso: node scripts/audit-check.mjs   (desde la raíz o desde frontend/: `node ../scripts/audit-check.mjs`)

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BLOCKING = new Set(['high', 'critical']);
const here = path.dirname(fileURLToPath(import.meta.url));
const allowlist = JSON.parse(readFileSync(path.join(here, 'audit-allowlist.json'), 'utf8'));

let raw;
try {
  // Orden fija, sin datos externos: execSync funciona igual en Windows (npm.cmd) y Linux
  raw = execSync('npm audit --json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (error) {
  // npm audit sale con código 1 cuando hay avisos: el JSON viene igual en stdout
  raw = error.stdout;
  if (!raw) throw error;
}

const report = JSON.parse(raw);
if (report.error) {
  console.error('npm audit falló:', report.error.summary ?? report.error);
  process.exit(2);
}

const today = new Date().toISOString().slice(0, 10);
const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vulnerability.via) {
    // Las entradas de texto solo propagan el aviso de una dependencia; el aviso real es el objeto
    if (typeof via !== 'object' || !BLOCKING.has(via.severity)) continue;
    const id = String(via.url ?? '')
      .split('/')
      .pop();
    advisories.set(id, { id, package: via.name, severity: via.severity, title: via.title });
  }
}

const blocking = [];
for (const advisory of advisories.values()) {
  const accepted = allowlist.find((entry) => entry.id === advisory.id);
  if (accepted && accepted.expires >= today) {
    console.log(
      `Aceptado hasta ${accepted.expires}: ${advisory.id} (${advisory.package}) — ${accepted.reason}`
    );
  } else {
    blocking.push({ ...advisory, expired: accepted?.expires });
  }
}

if (blocking.length > 0) {
  console.error('\nAvisos de seguridad altos o críticos sin aceptar:');
  for (const advisory of blocking) {
    const note = advisory.expired ? ` [la excepción venció el ${advisory.expired}]` : '';
    console.error(
      `- ${advisory.severity} ${advisory.id} (${advisory.package}): ${advisory.title}${note}`
    );
  }
  process.exit(1);
}

console.log(`\nSin avisos altos ni críticos pendientes (${advisories.size} revisados).`);
