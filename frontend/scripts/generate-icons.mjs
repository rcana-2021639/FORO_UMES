/**
 * Genera los íconos del sitio a partir de la marca del Foro (la "F" blanca sobre el círculo
 * violeta del menú). Se versionan los archivos generados; este script solo hace falta si cambia
 * la marca:  node scripts/generate-icons.mjs
 *
 * - app/icon.svg         favicon vectorial (navegadores actuales)
 * - app/favicon.ico      16/32/48 px para navegadores viejos y quien pida /favicon.ico
 * - app/apple-icon.png   180 px, fondo completo (iOS redondea las esquinas por su cuenta)
 * - public/icons/*.png   192/512 px y versión "maskable" para el manifiesto (Android)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Degradado de la marca (styles/tokens.css → --violet-glow)
const GRADIENT = `
  <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#6443c4"/>
    <stop offset="0.55" stop-color="#8e4fb8"/>
    <stop offset="1" stop-color="#9a7bf0"/>
  </linearGradient>`;

// La "F" en una cuadrícula de 512: asta, brazo superior y brazo medio (ópticamente centrada)
const GLYPH = `
  <path fill="#fff" d="M184 128h160v56H240v48h72v52h-72v100h-56z"/>`;

/** Círculo sobre transparente (favicon, manifiesto "any"). */
const round = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>${GRADIENT}</defs>
  <circle cx="256" cy="256" r="256" fill="url(#g)"/>${GLYPH}
</svg>`;

/** Cuadrado a sangre (Apple y "maskable": el sistema recorta la forma; la F queda en la zona segura). */
const square = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>${GRADIENT}</defs>
  <rect width="512" height="512" fill="url(#g)"/>${GLYPH}
</svg>`;

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

/** Contenedor ICO con imágenes PNG dentro (formato admitido desde Windows Vista). */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reservado
  header.writeUInt16LE(1, 2); // tipo: ícono
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // sin paleta
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por píxel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const write = (rel, data) => {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  console.log(`✓ ${rel} (${data.length} bytes)`);
};

write('app/icon.svg', round.replace(/\n\s*/g, ''));
write(
  'app/favicon.ico',
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(round, size) }))))
);
write('app/apple-icon.png', await png(square, 180));
write('public/icons/icon-192.png', await png(round, 192));
write('public/icons/icon-512.png', await png(round, 512));
write('public/icons/maskable-512.png', await png(square, 512));
