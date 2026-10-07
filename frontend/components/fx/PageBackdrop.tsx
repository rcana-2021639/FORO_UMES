'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useQuality } from '@/lib/quality';
import { brandOf } from '@/lib/universities';

/**
 * Fondo propio de cada vista (v7, DESIGN_NOTES §29.4): no un adorno genérico, sino el papel de lo
 * que se está viendo, que responde al cursor.
 *
 * - Inicio · relieve: curvas de nivel de un paisaje volcánico, muy tenues (una de cada cinco más
 *   marcada, como en las cartas topográficas); aparecen de la más baja a la más alta y alrededor
 *   del cursor se encienden. Sustituyó a la retícula de puntos mayas, que distraía.
 * - Universidades · nueve hilos, uno por universidad: el cursor los empuja y vibran al soltarlos;
 *   el que se toca se tiñe del color de su universidad. En un perfil, su hilo va en su color.
 * - Programas · código de barras del catálogo: alrededor del cursor las barras se encienden en los
 *   colores de los cuatro niveles.
 * - Actividades · hoja de calendario: el día bajo el cursor se encierra en un círculo a mano.
 * - Noticias · semitono de periódico (puntos a 45°): el cursor es una lupa donde la tinta crece.
 * - Galería · hoja de contactos de fotógrafo: el cuadro bajo el cursor se marca con lápiz graso.
 * - Contacto y el resto · papel de carta rayado: el cursor escribe un trazo que se seca.
 *
 * Rendimiento (§29.2): dos lienzos fijos detrás de todo. El dibujo de fondo se hace una vez (al
 * cargar, al cambiar de vista o de tamaño). La capa viva solo existe con puntero fino y modo
 * completo, dibuja únicamente mientras algo se mueve y se detiene sola; en reposo no gasta nada.
 */

type Pattern = 'relieve' | 'hilos' | 'barras' | 'calendario' | 'semitono' | 'contactos' | 'carta';
/** Tono del papel: claro (la mayoría) u oscuro (Contacto). */
type Tone = 'light' | 'dark';

function patternFor(path: string): Pattern | null {
  if (path === '/') return 'relieve';
  // Contacto es oscura de punta a punta: su papel va dentro de la sección, en tono oscuro
  if (path.startsWith('/contacto')) return null;
  if (path.startsWith('/universidades')) return 'hilos';
  if (path.startsWith('/programas')) return 'barras';
  if (path.startsWith('/actividades')) return 'calendario';
  if (path.startsWith('/noticias')) return 'semitono';
  if (path.startsWith('/galeria')) return 'contactos';
  return 'carta';
}

const INK = '58,38,119'; // violeta 800
const PEN = '124,90,224'; // violeta 500
const ORCHID = '142,79,184';
const LEVELS = ['#6443c4', '#3a2677', '#4b4aa8', '#8a3f7a'];
const LEVEL_WEIGHTS = [92, 12, 15, 5];
const UNIS = ['USAC', 'URL', 'UVG', 'UMG', 'UNIS', 'UPANA', 'UMES', 'GALILEO', 'UNI'];

/** Azar con semilla: el mismo dibujo en cada visita y en cada tamaño. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const bump = (d: number, r: number) => {
  const x = 1 - d / r;
  return x <= 0 ? 0 : x * x * (3 - 2 * x);
};

/**
 * Puntos agrupados por intensidad (12 niveles): un solo relleno por nivel en vez de cambiar de
 * color en cada punto. Con cientos de puntos por fotograma (el semitono), cambiar el color de
 * relleno uno por uno costaba más que dibujarlos.
 */
function dotBatch(levels = 12) {
  const paths: (Path2D | null)[] = new Array(levels).fill(null);
  return {
    add(x: number, y: number, r: number, f: number) {
      const b = Math.min(levels - 1, Math.floor(f * levels));
      const path = paths[b] ?? (paths[b] = new Path2D());
      path.moveTo(x + r, y);
      path.arc(x, y, r, 0, Math.PI * 2);
    },
    fill(c: CanvasRenderingContext2D, color: (f: number) => string) {
      paths.forEach((path, b) => {
        if (!path) return;
        c.fillStyle = color((b + 0.5) / levels);
        c.fill(path);
      });
    },
  };
}

interface Pointer {
  x: number;
  y: number;
  /** Posición suavizada (la que dibuja). */
  sx: number;
  sy: number;
  /** 0–1: presencia del cursor (aparece y se va con suavidad). */
  on: number;
  inside: boolean;
  speed: number;
}

interface Painter {
  /** Dibujo fijo (una vez por vista y tamaño). */
  base(c: CanvasRenderingContext2D, w: number, h: number): void;
  /** Capa viva: devuelve true mientras necesite otro fotograma. */
  live?(c: CanvasRenderingContext2D, w: number, h: number, p: Pointer, now: number): boolean;
  /** La capa viva dibuja también el fondo (se llama una vez al inicio aunque no haya cursor). */
  ownsBase?: boolean;
  /** Suelta lo que el pintor tenga en curso (la entrada animada del relieve). */
  dispose?(): void;
}

// ---------------------------------------------------------------- Inicio: relieve
/** Ruido de valor con semilla (suave): ondula las curvas para que no sean círculos perfectos. */
function valueNoise(seed: number) {
  const r = rng(seed);
  const N = 64;
  const grid = Float32Array.from({ length: N * N }, () => r());
  const at = (i: number, j: number) => grid[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = s(x - i);
    const fy = s(y - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * fx;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fx;
    return a + (b - a) * fy;
  };
}

/** Cerros del relieve, en fracciones de la pantalla (u, v), radio en fracción del lado mayor. */
const PEAKS = [
  { u: 0.8, v: 0.34, r: 0.2, a: 1 },
  { u: 0.97, v: 0.74, r: 0.13, a: 0.62 },
  { u: 0.64, v: 0.95, r: 0.12, a: 0.5 },
  { u: 0.04, v: 0.94, r: 0.17, a: 0.66 },
  { u: 0.4, v: -0.04, r: 0.11, a: 0.34 },
];

/**
 * Curvas de nivel de un relieve volcánico (marching squares sobre una rejilla de 8 px). Cada
 * nivel es un solo Path2D; una de cada cinco es "maestra", más marcada, como en las cartas
 * topográficas (y como la barra que vale cinco en la numeración maya).
 */
function contours(w: number, h: number) {
  const G = 8;
  const cols = Math.ceil(w / G) + 1;
  const rows = Math.ceil(h / G) + 1;
  const S = Math.max(w, h);
  const noise = valueNoise(9);
  const field = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = i * G;
      const y = j * G;
      let z = 0;
      for (const k of PEAKS) {
        const d = Math.hypot(x - k.u * w, y - k.v * h) / (k.r * S);
        z += k.a * Math.exp(-Math.pow(d, 1.35));
      }
      const n = noise((x / S) * 5, (y / S) * 5) * 0.11 + noise((x / S) * 13, (y / S) * 13) * 0.04;
      field[j * cols + i] = z + n;
    }

  const STEP = 0.056;
  const FIRST = 0.15;
  const levels: { path: Path2D; major: boolean }[] = [];
  for (let L = 0, t = FIRST; t < 1.3; L++, t += STEP) {
    const path = new Path2D();
    let any = false;
    for (let j = 0; j < rows - 1; j++)
      for (let i = 0; i < cols - 1; i++) {
        const a = field[j * cols + i];
        const b = field[j * cols + i + 1];
        const c = field[(j + 1) * cols + i + 1];
        const d = field[(j + 1) * cols + i];
        const idx = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * G;
        const y = j * G;
        // Cruces en los cuatro bordes de la celda (interpolados)
        const top = (): [number, number] => [x + G * ((t - a) / (b - a)), y];
        const right = (): [number, number] => [x + G, y + G * ((t - b) / (c - b))];
        const bottom = (): [number, number] => [x + G * ((t - d) / (c - d)), y + G];
        const left = (): [number, number] => [x, y + G * ((t - a) / (d - a))];
        const seg = (p: [number, number], q: [number, number]) => {
          path.moveTo(p[0], p[1]);
          path.lineTo(q[0], q[1]);
          any = true;
        };
        const center = (a + b + c + d) / 4 > t;
        switch (idx) {
          case 1:
          case 14:
            seg(left(), bottom());
            break;
          case 2:
          case 13:
            seg(bottom(), right());
            break;
          case 3:
          case 12:
            seg(left(), right());
            break;
          case 4:
          case 11:
            seg(top(), right());
            break;
          case 6:
          case 9:
            seg(top(), bottom());
            break;
          case 7:
          case 8:
            seg(left(), top());
            break;
          case 5:
            if (center) {
              seg(left(), top());
              seg(bottom(), right());
            } else {
              seg(left(), bottom());
              seg(top(), right());
            }
            break;
          case 10:
            if (center) {
              seg(left(), bottom());
              seg(top(), right());
            } else {
              seg(left(), top());
              seg(bottom(), right());
            }
            break;
        }
      }
    if (any) levels.push({ path, major: L % 5 === 4 });
  }
  // Cumbres: un triángulo pequeño, como en los mapas
  const summits = PEAKS.filter((k) => k.a > 0.45).map((k) => ({ x: k.u * w, y: k.v * h }));
  return { levels, summits };
}

/**
 * Inicio · relieve. Curvas de nivel finas, casi de agua; aparecen de la más baja a la más alta al
 * llegar a la portada (una curva por fotograma, ~1 s) y alrededor del cursor se encienden, como
 * si una lámpara recorriera la carta. No hay nada que se mueva solo.
 */
function relieve(): Painter {
  let key = '';
  let map: ReturnType<typeof contours> | null = null;
  let lit: HTMLCanvasElement | null = null;
  let litKey = '';
  let intro = 0;
  let introDone = false;
  let shown = 0;

  const ensure = (w: number, h: number) => {
    const k = `${w}x${h}`;
    if (k !== key || !map) {
      key = k;
      map = contours(w, h);
    }
    return map;
  };
  const strokeLevel = (
    c: CanvasRenderingContext2D,
    l: { path: Path2D; major: boolean },
    bright: boolean
  ) => {
    c.strokeStyle = bright
      ? `rgba(${PEN},${l.major ? 0.62 : 0.42})`
      : `rgba(${PEN},${l.major ? 0.17 : 0.085})`;
    c.lineWidth = l.major ? (bright ? 1.5 : 1.15) : bright ? 1.1 : 0.85;
    c.stroke(l.path);
  };
  const drawSummits = (c: CanvasRenderingContext2D, m: ReturnType<typeof contours>) => {
    c.fillStyle = `rgba(${PEN},0.2)`;
    for (const s of m.summits) {
      c.beginPath();
      c.moveTo(s.x, s.y - 4);
      c.lineTo(s.x + 4, s.y + 3);
      c.lineTo(s.x - 4, s.y + 3);
      c.closePath();
      c.fill();
    }
  };

  return {
    base(c, w, h) {
      const m = ensure(w, h);
      cancelAnimationFrame(intro);
      c.lineJoin = 'round';
      c.lineCap = 'round';
      const still =
        introDone ||
        document.documentElement.dataset.quality === 'still' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (still) {
        for (const l of m.levels) strokeLevel(c, l, false);
        drawSummits(c, m);
        introDone = true;
        return;
      }
      // Entrada: de la curva más baja a la más alta, una cada ~45 ms. Si se vuelve a pintar a
      // medias (llegan las fuentes, cambia el tamaño), repone lo ya dibujado y sigue desde ahí
      for (let i = 0; i < shown && i < m.levels.length; i++) strokeLevel(c, m.levels[i], false);
      let last = 0;
      const step = (now: number) => {
        if (now - last >= 45) {
          last = now;
          const l = m.levels[shown++];
          if (l) strokeLevel(c, l, false);
        }
        if (shown < m.levels.length) intro = requestAnimationFrame(step);
        else {
          drawSummits(c, m);
          introDone = true;
        }
      };
      intro = requestAnimationFrame(step);
    },
    live(c, w, h, p) {
      if (p.on < 0.01) return false;
      const m = ensure(w, h);
      const d = c.getTransform().a || 1;
      // Copia encendida de todas las curvas (una vez por tamaño): cada fotograma solo recorta
      // un círculo alrededor del cursor
      if (!lit || litKey !== `${key}@${d}`) {
        litKey = `${key}@${d}`;
        lit = document.createElement('canvas');
        lit.width = Math.round(w * d);
        lit.height = Math.round(h * d);
        const lc = lit.getContext('2d');
        if (!lc) return false;
        lc.setTransform(d, 0, 0, d, 0, 0);
        lc.lineJoin = 'round';
        lc.lineCap = 'round';
        for (const l of m.levels) strokeLevel(lc, l, true);
      }
      const R = 190;
      const x0 = Math.max(0, p.sx - R);
      const y0 = Math.max(0, p.sy - R);
      const x1 = Math.min(w, p.sx + R);
      const y1 = Math.min(h, p.sy + R);
      if (x1 <= x0 || y1 <= y0) return false;
      c.save();
      c.drawImage(lit, x0 * d, y0 * d, (x1 - x0) * d, (y1 - y0) * d, x0, y0, x1 - x0, y1 - y0);
      c.globalCompositeOperation = 'destination-in';
      const g = c.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, R);
      g.addColorStop(0, `rgba(0,0,0,${p.on.toFixed(3)})`);
      g.addColorStop(0.45, `rgba(0,0,0,${(0.55 * p.on).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.restore();
      return false;
    },
    dispose() {
      cancelAnimationFrame(intro);
      lit = null;
    },
  };
}

// ---------------------------------------------------------------- Universidades: nueve hilos
function hilos(): Painter {
  const STEP = 22;
  let threads: { x0: number; off: Float32Array; vel: Float32Array; tint: number; color: string }[] =
    [];
  let lastW = 0;
  let lastH = 0;
  let own: string | null = null;
  const setup = (w: number, h: number) => {
    if (w === lastW && h === lastH && threads.length) return;
    lastW = w;
    lastH = h;
    const n = Math.ceil(h / STEP) + 1;
    own = getComputedStyle(document.documentElement).getPropertyValue('--u-primary').trim() || null;
    threads = UNIS.map((u, i) => ({
      x0: (w * (i + 1)) / 10,
      off: new Float32Array(n),
      vel: new Float32Array(n),
      tint: 0,
      color: brandOf(u).primary,
    }));
  };
  const drawThreads = (c: CanvasRenderingContext2D) => {
    threads.forEach((t, i) => {
      const mine = own && i === 4;
      c.lineWidth = mine ? 2.4 : 1.3 + t.tint;
      c.strokeStyle = mine ? own! : t.tint > 0.02 ? mixColor(t.color, t.tint) : `rgba(${PEN},0.26)`;
      c.globalAlpha = mine ? 0.55 : 1;
      c.beginPath();
      c.moveTo(t.x0 + t.off[0], 0);
      for (let k = 1; k < t.off.length; k++) {
        const y0 = (k - 1) * STEP;
        const y1 = k * STEP;
        const xm = t.x0 + (t.off[k - 1] + t.off[k]) / 2;
        c.quadraticCurveTo(t.x0 + t.off[k - 1], y0, xm, (y0 + y1) / 2);
      }
      c.stroke();
      c.globalAlpha = 1;
    });
  };
  return {
    ownsBase: true,
    base(c, w, h) {
      setup(w, h);
      drawThreads(c);
    },
    live(c, w, h, p) {
      setup(w, h);
      let busy = false;
      for (const t of threads) {
        const n = t.off.length;
        let maxOff = 0;
        for (let k = 0; k < n; k++) {
          const y = k * STEP;
          let target = 0;
          if (p.on > 0.01) {
            const dx = t.x0 + t.off[k] - p.sx;
            const dy = y - p.sy;
            const reach = 74;
            if (Math.abs(dx) < reach && Math.abs(dy) < 220) {
              target =
                Math.sign(dx || 1) * (reach - Math.abs(dx)) * Math.exp(-((dy / 120) ** 2)) * p.on;
            }
          }
          // Resorte hacia su sitio (o hacia donde lo empuja el cursor) + tensión de cuerda
          const tension =
            k > 0 && k < n - 1 ? (t.off[k - 1] + t.off[k + 1] - 2 * t.off[k]) * 0.22 : -t.off[k];
          t.vel[k] += (target - t.off[k]) * 0.09 + tension - t.vel[k] * 0.16;
        }
        for (let k = 0; k < n; k++) {
          t.off[k] += t.vel[k];
          maxOff = Math.max(maxOff, Math.abs(t.off[k]));
          if (Math.abs(t.vel[k]) > 0.02 || Math.abs(t.off[k]) > 0.06) busy = true;
        }
        // Al tocarlo se tiñe del color de su universidad, y se le va despacio
        const goal = maxOff > 6 ? 1 : 0;
        t.tint += (goal - t.tint) * (goal ? 0.12 : 0.025);
        if (t.tint > 0.005 && goal === 0) busy = true;
      }
      drawThreads(c);
      return busy;
    },
  };
}

/** Color de marca con su intensidad (0–1) sobre el violeta de reposo. */
function mixColor(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const a = 0.26 + 0.5 * k;
  const mr = Math.round(124 + (r - 124) * k);
  const mg = Math.round(90 + (g - 90) * k);
  const mb = Math.round(224 + (b - 224) * k);
  return `rgba(${mr},${mg},${mb},${a.toFixed(3)})`;
}

// ---------------------------------------------------------------- Programas: código de barras
function barras(): Painter {
  let bars: { x: number; w: number; lv: number }[] = [];
  let lastW = 0;
  const setup = (w: number) => {
    if (w === lastW) return;
    lastW = w;
    const r = rng(124);
    const total = LEVEL_WEIGHTS.reduce((a, b) => a + b, 0);
    bars = [];
    for (let x = 8; x < w;) {
      const bw = [1, 1, 2, 3, 1, 2][Math.floor(r() * 6)];
      let pick = r() * total;
      let lv = 0;
      while (pick > LEVEL_WEIGHTS[lv]) pick -= LEVEL_WEIGHTS[lv++];
      bars.push({ x, w: bw, lv });
      x += bw + 3 + Math.floor(r() * 8);
    }
  };
  return {
    base(c, w, h) {
      setup(w);
      c.fillStyle = `rgba(${INK},0.045)`;
      for (const b of bars) c.fillRect(b.x, 0, b.w, h);
    },
    live(c, w, h, p) {
      if (p.on < 0.01) return false;
      setup(w);
      const R = 190;
      const top = Math.max(0, p.sy - 260);
      const bottom = Math.min(h, p.sy + 260);
      // Un degradado por nivel (no uno por barra); la intensidad va en la opacidad
      const grads = LEVELS.map((col) => {
        const g = c.createLinearGradient(0, top, 0, bottom);
        g.addColorStop(0, `${col}00`);
        g.addColorStop(0.5, `${col}6b`);
        g.addColorStop(1, `${col}00`);
        return g;
      });
      for (const b of bars) {
        const f = bump(Math.abs(b.x - p.sx), R) * p.on;
        if (f < 0.02) continue;
        c.globalAlpha = f;
        c.fillStyle = grads[b.lv];
        c.fillRect(b.x, top, b.w + (f > 0.6 ? 1 : 0), bottom - top);
      }
      c.globalAlpha = 1;
      return false;
    },
  };
}

// ---------------------------------------------------------------- Actividades: calendario
function calendario(): Painter {
  const ROW = 132;
  let cols = 7;
  let cw = 0;
  let firstDow = 0;
  let days = 30;
  let prevDays = 31;
  let today = 1;
  // Círculos a mano: el del día bajo el cursor se dibuja; los anteriores se desvanecen
  const marks: { col: number; row: number; born: number; gone: number | null; seed: number }[] = [];
  const setup = (w: number) => {
    cols = 7;
    cw = w / cols;
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    firstDow = (first.getDay() + 6) % 7; // semana desde el lunes
    days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    prevDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    today = now.getDate();
  };
  const dayAt = (col: number, row: number) => {
    const idx = row * cols + col - firstDow + 1;
    if (idx < 1) return { n: prevDays + idx, out: true };
    if (idx > days) return { n: ((idx - 1) % days) + 1, out: true };
    return { n: idx, out: false };
  };
  const circle = (
    c: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    prog: number,
    seed: number
  ) => {
    const r = rng(seed);
    const a0 = r() * Math.PI * 2;
    const turns = 1.12;
    const steps = 48;
    c.beginPath();
    for (let i = 0; i <= steps * prog; i++) {
      const t = a0 + (i / steps) * Math.PI * 2 * turns;
      const wob = 1 + 0.07 * Math.sin(3 * t + seed) + 0.04 * Math.sin(5 * t + seed * 2);
      const x = cx + Math.cos(t) * 27 * wob + (i / steps) * 3;
      const y = cy + Math.sin(t) * 19 * wob;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  };
  return {
    base(c, w, h) {
      setup(w);
      c.strokeStyle = `rgba(${INK},0.075)`;
      c.lineWidth = 1;
      c.beginPath();
      for (let i = 1; i < cols; i++) {
        c.moveTo(Math.round(i * cw) + 0.5, 0);
        c.lineTo(Math.round(i * cw) + 0.5, h);
      }
      for (let y = ROW; y < h; y += ROW) {
        c.moveTo(0, y + 0.5);
        c.lineTo(w, y + 0.5);
      }
      c.stroke();
      c.font = '700 15px "Alegreya Sans", system-ui, sans-serif';
      c.textBaseline = 'top';
      const rows = Math.ceil(h / ROW);
      for (let row = 0; row < rows; row++)
        for (let col = 0; col < cols; col++) {
          const d = dayAt(col, row);
          const isToday = !d.out && d.n === today && row < 6;
          c.fillStyle = isToday ? `rgba(${PEN},0.55)` : `rgba(${INK},${d.out ? 0.07 : 0.15})`;
          c.fillText(String(d.n), col * cw + 14, row * ROW + 12);
          if (isToday) {
            c.strokeStyle = `rgba(${PEN},0.4)`;
            c.lineWidth = 2;
            circle(c, col * cw + 22, row * ROW + 21, 1, 9);
          }
        }
    },
    live(c, w, h, p, now) {
      setup(w);
      const col = Math.min(cols - 1, Math.max(0, Math.floor(p.sx / cw)));
      const row = Math.max(0, Math.floor(p.sy / ROW));
      const cur = marks.find((m) => m.gone === null);
      if (p.on > 0.5 && (!cur || cur.col !== col || cur.row !== row)) {
        if (cur) cur.gone = now;
        marks.push({ col, row, born: now, gone: null, seed: col * 31 + row * 7 + 3 });
      } else if (p.on <= 0.5 && cur) cur.gone = now;
      let busy = false;
      c.lineCap = 'round';
      for (let i = marks.length - 1; i >= 0; i--) {
        const m = marks[i];
        const prog = ease((now - m.born) / 420);
        const fade = m.gone === null ? 1 : 1 - (now - m.gone) / 380;
        if (fade <= 0) {
          marks.splice(i, 1);
          continue;
        }
        if (prog < 1 || m.gone !== null) busy = true;
        c.strokeStyle = `rgba(${ORCHID},${(0.6 * fade).toFixed(3)})`;
        c.lineWidth = 2.4;
        circle(c, m.col * cw + 22, m.row * ROW + 21, prog, m.seed);
      }
      return busy;
    },
  };
}

// ---------------------------------------------------------------- Noticias: semitono a 45°
function semitono(): Painter {
  const S = 11;
  const A = Math.PI / 4;
  const cos = Math.cos(A);
  const sin = Math.sin(A);
  // Retícula girada: punto (i, j) → pantalla
  const toScreen = (i: number, j: number) => ({
    x: (i * cos - j * sin) * S,
    y: (i * sin + j * cos) * S,
  });
  const toGrid = (x: number, y: number) => ({
    i: (x * cos + y * sin) / S,
    j: (-x * sin + y * cos) / S,
  });
  return {
    base(c, w, h) {
      c.fillStyle = `rgba(${INK},0.085)`;
      const corners = [toGrid(0, 0), toGrid(w, 0), toGrid(0, h), toGrid(w, h)];
      const iMin = Math.floor(Math.min(...corners.map((q) => q.i)));
      const iMax = Math.ceil(Math.max(...corners.map((q) => q.i)));
      const jMin = Math.floor(Math.min(...corners.map((q) => q.j)));
      const jMax = Math.ceil(Math.max(...corners.map((q) => q.j)));
      for (let i = iMin; i <= iMax; i++)
        for (let j = jMin; j <= jMax; j++) {
          const q = toScreen(i, j);
          if (q.x < -2 || q.y < -2 || q.x > w + 2 || q.y > h + 2) continue;
          c.beginPath();
          c.arc(q.x, q.y, 0.95, 0, Math.PI * 2);
          c.fill();
        }
    },
    live(c, w, h, p) {
      if (p.on < 0.01) return false;
      const R = 190;
      const g = toGrid(p.sx, p.sy);
      const k = Math.ceil(R / S) + 1;
      const batch = dotBatch();
      for (let i = Math.floor(g.i) - k; i <= Math.ceil(g.i) + k; i++)
        for (let j = Math.floor(g.j) - k; j <= Math.ceil(g.j) + k; j++) {
          const q = toScreen(i, j);
          const f = bump(Math.hypot(q.x - p.sx, q.y - p.sy), R) * p.on;
          if (f < 0.02) continue;
          batch.add(q.x, q.y, 0.95 + 3.6 * Math.pow(f, 1.3), f);
        }
      batch.fill(c, (f) => `rgba(${INK},${(0.085 + 0.3 * f).toFixed(3)})`);
      return false;
    },
  };
}

// ---------------------------------------------------------------- Galería: hoja de contactos
function contactos(): Painter {
  const STRIP = 172;
  const GAP = 30;
  const FH = 112;
  const FW = 168;
  const FG = 16;
  const frameAt = (x: number, y: number) => {
    const s = Math.floor(y / (STRIP + GAP));
    const local = y - s * (STRIP + GAP);
    const top = s * (STRIP + GAP) + (STRIP - FH) / 2;
    if (local < (STRIP - FH) / 2 || local > (STRIP + FH) / 2) return null;
    const shift = (s % 2) * 60;
    const f = Math.floor((x + shift) / (FW + FG));
    const left = f * (FW + FG) - shift;
    if (x - left > FW) return null;
    return { s, f, x: left, y: top };
  };
  const marks: {
    key: string;
    x: number;
    y: number;
    born: number;
    gone: number | null;
    seed: number;
  }[] = [];
  const box = (
    c: CanvasRenderingContext2D,
    m: { x: number; y: number; seed: number },
    prog: number
  ) => {
    const r = rng(m.seed);
    const pts: [number, number][] = [
      [m.x - 6 + r() * 4, m.y - 5 + r() * 4],
      [m.x + FW + 5 - r() * 4, m.y - 7 + r() * 4],
      [m.x + FW + 6 - r() * 3, m.y + FH + 5 - r() * 4],
      [m.x - 5 + r() * 3, m.y + FH + 7 - r() * 4],
      [m.x - 7 + r() * 4, m.y - 9 + r() * 4],
    ];
    const total = 4 * prog;
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= 4; i++) {
      const t = Math.min(1, Math.max(0, total - (i - 1)));
      if (t <= 0) break;
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      c.lineTo(ax + (bx - ax) * t, ay + (by - ay) * t);
    }
    c.stroke();
  };
  return {
    base(c, w, h) {
      c.lineWidth = 1;
      for (let s = 0, y = 0; y < h; s++, y += STRIP + GAP) {
        // Película: franja tenue, perforaciones arriba y abajo, cuadros y su número
        c.fillStyle = `rgba(${INK},0.02)`;
        c.fillRect(0, y, w, STRIP);
        c.fillStyle = `rgba(${INK},0.07)`;
        for (let x = 6; x < w; x += 22) {
          c.beginPath();
          c.roundRect(x, y + 9, 9, 12, 2);
          c.roundRect(x, y + STRIP - 21, 9, 12, 2);
          c.fill();
        }
        const shift = (s % 2) * 60;
        c.strokeStyle = `rgba(${INK},0.065)`;
        c.font = '700 10px "Alegreya Sans", system-ui, sans-serif';
        c.textBaseline = 'middle';
        for (let f = 0, x = -shift; x < w; f++, x += FW + FG) {
          c.strokeRect(x + 0.5, y + (STRIP - FH) / 2 + 0.5, FW, FH);
          c.fillStyle = `rgba(${INK},0.14)`;
          const n = s * 9 + f + 1;
          c.fillText(`${n}  ▸ ${n}A`, x + 4, y + STRIP - 4.5);
          if (f % 4 === 1) c.fillText('FORO 400', x + FW / 2 - 18, y + 4.5);
        }
      }
    },
    live(c, w, h, p, now) {
      const hit = p.on > 0.5 ? frameAt(p.sx, p.sy) : null;
      const key = hit ? `${hit.s}-${hit.f}` : '';
      const cur = marks.find((m) => m.gone === null);
      if (cur && cur.key !== key) cur.gone = now;
      if (hit && (!cur || cur.key !== key))
        marks.push({
          key,
          x: hit.x,
          y: hit.y,
          born: now,
          gone: null,
          seed: hit.s * 97 + hit.f * 13 + 5,
        });
      let busy = false;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      for (let i = marks.length - 1; i >= 0; i--) {
        const m = marks[i];
        const prog = ease((now - m.born) / 380);
        const fade = m.gone === null ? 1 : 1 - (now - m.gone) / 420;
        if (fade <= 0) {
          marks.splice(i, 1);
          continue;
        }
        if (prog < 1 || m.gone !== null) busy = true;
        // Lápiz graso: trazo grueso, rojo violáceo, con algo de transparencia
        c.strokeStyle = `rgba(176,58,104,${(0.5 * fade).toFixed(3)})`;
        c.lineWidth = 3.2;
        box(c, m, prog);
      }
      return busy;
    },
  };
}

// ---------------------------------------------------------------- Contacto: papel de carta
function carta(tone: Tone): Painter {
  const LINE = 34;
  const dark = tone === 'dark';
  const ink: { x: number; y: number; t: number; w: number }[] = [];
  return {
    base(c, w, h) {
      c.strokeStyle = dark ? 'rgba(215,218,255,0.07)' : 'rgba(75,74,168,0.085)';
      c.lineWidth = 1;
      c.beginPath();
      for (let y = LINE * 2; y < h; y += LINE) {
        c.moveTo(0, y + 0.5);
        c.lineTo(w, y + 0.5);
      }
      c.stroke();
      // Margen doble, como en la hoja de cuaderno
      // Margen a la izquierda del texto (dentro del medianil), como en la hoja de cuaderno
      const mx = Math.max(10, Math.min(40, w * 0.02 + 8));
      c.strokeStyle = dark ? 'rgba(235,207,242,0.16)' : `rgba(${ORCHID},0.22)`;
      c.beginPath();
      c.moveTo(mx + 0.5, 0);
      c.lineTo(mx + 0.5, h);
      c.moveTo(mx + 4.5, 0);
      c.lineTo(mx + 4.5, h);
      c.stroke();
    },
    live(c, w, h, p, now) {
      const last = ink[ink.length - 1];
      if (p.on > 0.5 && (!last || Math.hypot(p.sx - last.x, p.sy - last.y) > 2.5)) {
        // Más lento, más tinta: el plumín se carga cuando se detiene
        const width = Math.max(0.7, Math.min(2.8, 3 - p.speed * 0.045));
        ink.push({ x: p.sx, y: p.sy, t: now, w: width });
      }
      while (ink.length && now - ink[0].t > 1500) ink.shift();
      c.lineCap = 'round';
      for (let i = 1; i < ink.length; i++) {
        const a = ink[i - 1];
        const b = ink[i];
        const age = (now - b.t) / 1500;
        c.strokeStyle = dark
          ? `rgba(184,162,250,${(0.42 * (1 - age)).toFixed(3)})`
          : `rgba(${INK},${(0.32 * (1 - age)).toFixed(3)})`;
        c.lineWidth = (a.w + b.w) / 2;
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
      }
      return ink.length > 0;
    },
  };
}

const MAKERS: Record<Pattern, (tone: Tone) => Painter> = {
  relieve,
  hilos,
  barras,
  calendario,
  semitono,
  contactos,
  carta,
};

/**
 * Un fondo dibujado. `local`: en vez de fijo a la pantalla, ocupa su contenedor (va dentro de una
 * sección, como el papel oscuro de Contacto) y el cursor se mide respecto de él.
 */
export function BackdropLayer({
  pattern,
  tone = 'light',
  local = false,
  className,
}: {
  pattern: Pattern;
  tone?: Tone;
  local?: boolean;
  className?: string;
}) {
  const quality = useQuality();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const liveRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const baseCv = baseRef.current;
    const liveCv = liveRef.current;
    if (!root || !baseCv || !liveCv) return;
    const bc = baseCv.getContext('2d');
    const lc = liveCv.getContext('2d');
    if (!bc || !lc) return;

    const painter = MAKERS[pattern](tone);
    const interactive =
      quality === 'full' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    const p: Pointer = { x: -999, y: -999, sx: -999, sy: -999, on: 0, inside: false, speed: 0 };

    const size = () => {
      w = local ? root.clientWidth : window.innerWidth;
      h = local ? root.clientHeight : window.innerHeight;
      if (!w || !h) return;
      const db = Math.min(window.devicePixelRatio || 1, 2);
      const dl = Math.min(window.devicePixelRatio || 1, 1.5);
      baseCv.width = Math.round(w * db);
      baseCv.height = Math.round(h * db);
      // Sin capa viva (teléfono, modo ligero) su lienzo queda en cero: no ocupa memoria
      const live = interactive && !!painter.live;
      liveCv.width = live ? Math.round(w * dl) : 0;
      liveCv.height = live ? Math.round(h * dl) : 0;
      bc.setTransform(db, 0, 0, db, 0, 0);
      lc.setTransform(dl, 0, 0, dl, 0, 0);
      bc.clearRect(0, 0, w, h);
      // Si la capa viva dibuja el fondo (hilos), en modo estático lo hace aquí
      if (!painter.ownsBase || !interactive) painter.base(bc, w, h);
      if (interactive && painter.ownsBase) {
        lc.clearRect(0, 0, w, h);
        painter.live?.(lc, w, h, p, performance.now());
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const k = 0.28;
      p.sx += (p.x - p.sx) * k;
      p.sy += (p.y - p.sy) * k;
      p.on += ((p.inside ? 1 : 0) - p.on) * 0.14;
      p.speed *= 0.85;
      lc.clearRect(0, 0, w, h);
      const busy = painter.live?.(lc, w, h, p, now) ?? false;
      const moving =
        Math.abs(p.x - p.sx) > 0.3 ||
        Math.abs(p.y - p.sy) > 0.3 ||
        Math.abs((p.inside ? 1 : 0) - p.on) > 0.01;
      if (busy || moving) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      let x = e.clientX;
      let y = e.clientY;
      if (local) {
        const r = root.getBoundingClientRect();
        x -= r.left;
        y -= r.top;
      }
      const inside = x >= 0 && y >= 0 && x <= w && y <= h;
      if (!p.inside && inside) {
        p.sx = x;
        p.sy = y;
      }
      p.speed = Math.hypot(x - p.x, y - p.y);
      p.x = x;
      p.y = y;
      p.inside = inside;
      wake();
    };
    const onLeave = () => {
      p.inside = false;
      wake();
    };

    size();
    // Las fuentes del calendario y de la hoja de contactos pueden llegar después
    void document.fonts?.ready.then(() => size());
    const ro = local ? new ResizeObserver(size) : null;
    ro?.observe(root);
    if (!local) window.addEventListener('resize', size);
    if (interactive && painter.live) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('mouseleave', onLeave);
      window.addEventListener('blur', onLeave);
    } else {
      lc.clearRect(0, 0, w, h);
    }
    return () => {
      cancelAnimationFrame(raf);
      painter.dispose?.();
      ro?.disconnect();
      window.removeEventListener('resize', size);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, [pattern, tone, local, quality, pathname]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={[
        local ? 'backdrop-layer backdrop-layer--local' : 'backdrop-layer page-backdrop',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-pattern={pattern}
    >
      <canvas ref={baseRef} />
      <canvas ref={liveRef} />
    </div>
  );
}

/** Fondo de la vista actual, fijo detrás de todo (va en el layout). */
export function PageBackdrop() {
  const pattern = patternFor(usePathname());
  if (!pattern) return null;
  // La clave reinicia la entrada (fundido) al cambiar de vista
  return <BackdropLayer key={pattern} pattern={pattern} />;
}
