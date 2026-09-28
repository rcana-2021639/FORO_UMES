'use client';

/**
 * Malla elástica en OGL: una superficie (imagen o degradado) que se hunde y rebota bajo el
 * puntero. Código de React Bits `ElasticMesh`, con estos cambios: dpr ≤ 1.5, el bucle se
 * pausa fuera del viewport y con la pestaña oculta, y sin `touchAction: none` (no roba el
 * scroll en móvil).
 *
 * Añadidos del Foro: la imagen se encuadra como `object-fit: cover` (no se deforma); cambiar
 * `image` no reconstruye WebGL, sino que la nueva se revela en círculo desde el centro mientras
 * la tela da un latido; los colores del degradado viajan suaves de un valor a otro; e `idle`
 * hace que la superficie respire sola (se ve viva también en pantallas táctiles).
 */
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import type { CSSProperties } from 'react';
import { Renderer, Geometry, Program, Mesh, Texture } from 'ogl';

const DIST = 4.6;
const FIT = 0.82;

const VERT = `
precision highp float;
attribute vec2 aGrid;
attribute vec2 uv;
attribute vec3 aOffset;
attribute vec3 aNormal;

uniform float uAspect;
uniform float uTilt;
uniform float uDist;
uniform float uFit;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDepth;

void main() {
  vUv = uv;

  vec2 base = vec2((aGrid.x * 2.0 - 1.0) * uAspect, 1.0 - aGrid.y * 2.0);
  vec3 p = vec3(base + aOffset.xy, aOffset.z);

  float ct = cos(uTilt);
  float st = sin(uTilt);
  float ry = p.y * ct - p.z * st;
  float rz = p.y * st + p.z * ct;
  p.y = ry;
  p.z = rz;

  float persp = uDist / (uDist - p.z);
  vec2 clip = vec2(p.x / uAspect, p.y) * persp * uFit;

  vNormal = aNormal;
  vDepth = aOffset.z;
  gl_Position = vec4(clip, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDepth;

uniform sampler2D tMap;
uniform sampler2D tPrev;
uniform float uHasImage;
uniform float uHasPrev;
uniform float uMix;
uniform vec2 uImgScale;
uniform vec2 uPrevScale;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uHighlight;
uniform float uShading;
uniform vec2 uRes;
uniform float uRadius;
uniform float uGrid;
uniform float uGridDensity;
uniform float uGridOpacity;
uniform vec3 uGridColor;

vec2 coverUv(vec2 uv, vec2 s) {
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec3 grad = mix(uColor1, uColor2, clamp(vUv.y, 0.0, 1.0));
  vec3 cur = uHasImage > 0.5 ? texture2D(tMap, coverUv(vUv, uImgScale)).rgb : grad;
  vec3 prev = uHasPrev > 0.5 ? texture2D(tPrev, coverUv(vUv, uPrevScale)).rgb : grad;
  // Revelado en círculo desde el centro, con borde suave y un brillo en el frente de onda
  float dist = length((vUv - 0.5) * vec2(uRes.x / max(uRes.y, 1.0), 1.0));
  float front = uMix * 1.35;
  float reveal = 1.0 - smoothstep(front - 0.16, front, dist);
  vec3 base = mix(prev, cur, reveal);
  base += uHighlight * 0.18 * (1.0 - smoothstep(0.0, 0.08, abs(dist - front + 0.05))) * (1.0 - uMix);

  vec3 N = normalize(vNormal);
  vec3 L = normalize(vec3(-0.35, 0.55, 0.78));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);

  float diff = clamp(dot(N, L), 0.0, 1.0);
  float specRaw = pow(clamp(dot(N, H), 0.0, 1.0), 26.0);
  float specFlat = pow(clamp(H.z, 0.0, 1.0), 26.0);
  float spec = clamp((specRaw - specFlat) / (1.0 - specFlat), 0.0, 1.0);
  float ao = clamp(1.0 + vDepth * 0.45, 0.65, 1.25);

  vec3 lit = base * (1.0 - uShading * 0.28);
  lit += base * diff * uShading * 0.55;
  lit *= ao;
  lit += uHighlight * spec * uShading * 0.25;

  if (uGrid > 0.5) {
    vec2 g = vUv * uGridDensity;
    vec2 w = uGridDensity / max(uRes, vec2(1.0));
    vec2 d = abs(fract(g - 0.5) - 0.5) / max(w * 1.5, vec2(1e-4));
    float line = 1.0 - clamp(min(d.x, d.y), 0.0, 1.0);
    lit = mix(lit, uGridColor, line * uGridOpacity * (0.45 + diff * 0.55));
  }

  vec2 p = (vUv - 0.5) * uRes;
  vec2 halfRes = uRes * 0.5;
  float r = min(uRadius, min(halfRes.x, halfRes.y));
  vec2 q = abs(p) - (halfRes - r);
  float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  float alpha = 1.0 - smoothstep(-1.25, 1.25, sd);
  if (alpha <= 0.002) discard;

  gl_FragColor = vec4(lit, alpha);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  let h = (hex || '').replace('#', '').trim();
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h || '000000', 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function lerp3(out: [number, number, number], to: [number, number, number], k: number) {
  out[0] += (to[0] - out[0]) * k;
  out[1] += (to[1] - out[1]) * k;
  out[2] += (to[2] - out[2]) * k;
}

interface Live {
  color1: string;
  color2: string;
  highlight: string;
  showGrid: boolean;
  gridDensity: number;
  gridOpacity: number;
  gridColor: string;
  borderRadius: number;
  stiffness: number;
  damping: number;
  grabRadius: number;
  pull: number;
  wobble: number;
  tilt: number;
  shading: number;
  interaction: 'hover' | 'drag';
  enabled: boolean;
  idle: number;
}

export interface ElasticMeshProps {
  image?: string;
  color1?: string;
  color2?: string;
  highlight?: string;
  showGrid?: boolean;
  gridDensity?: number;
  gridOpacity?: number;
  gridColor?: string;
  borderRadius?: number;
  stiffness?: number;
  damping?: number;
  grabRadius?: number;
  pull?: number;
  wobble?: number;
  tilt?: number;
  shading?: number;
  resolution?: number;
  interaction?: 'hover' | 'drag';
  enabled?: boolean;
  /** Respiración sin puntero (0 = quieta). 1 es un oleaje apenas visible. */
  idle?: number;
  className?: string;
  style?: CSSProperties;
}

const ElasticMesh = ({
  image = '',
  color1 = '#5227FF',
  color2 = '#B19EEF',
  highlight = '#ffffff',
  showGrid = true,
  gridDensity = 20,
  gridOpacity = 0.28,
  gridColor = '#ffffff',
  borderRadius = 25,
  stiffness = 0.05,
  damping = 0.2,
  grabRadius = 0.6,
  pull = 0.4,
  wobble = 5,
  tilt = 14,
  shading = 0.5,
  resolution = 25,
  interaction = 'hover',
  enabled = true,
  idle = 0,
  className = '',
  style,
}: ElasticMeshProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Imagen vigente y acción para cambiarla sin reconstruir la escena
  const imageRef = useRef(image);
  const setImageRef = useRef<((url: string) => void) | null>(null);

  const live: Live = {
    color1,
    color2,
    highlight,
    showGrid,
    gridDensity,
    gridOpacity,
    gridColor,
    borderRadius,
    stiffness,
    damping,
    grabRadius,
    pull,
    wobble,
    tilt,
    shading,
    interaction,
    enabled,
    idle,
  };
  const propsRef = useRef<Live>(live);
  useEffect(() => {
    propsRef.current = live;
  });

  useEffect(() => {
    const container = containerRef.current as HTMLDivElement;
    if (!container) return;

    const reduceMotion = prefersReducedMotion();

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const N = Math.max(6, Math.min(40, Math.round(resolution)));
    const nodeCount = N * N;

    const aGrid = new Float32Array(nodeCount * 2);
    const uv = new Float32Array(nodeCount * 2);
    const aOffset = new Float32Array(nodeCount * 3);
    const aNormal = new Float32Array(nodeCount * 3);

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * N + i;
        const u = i / (N - 1);
        const v = j / (N - 1);
        aGrid[idx * 2] = u;
        aGrid[idx * 2 + 1] = v;
        uv[idx * 2] = u;
        uv[idx * 2 + 1] = v;
        aNormal[idx * 3 + 2] = 1;
      }
    }

    const quads = (N - 1) * (N - 1);
    const index = new Uint16Array(quads * 6);
    let t = 0;
    for (let j = 0; j < N - 1; j++) {
      for (let i = 0; i < N - 1; i++) {
        const a = j * N + i;
        const b = a + 1;
        const c = a + N;
        const d = c + 1;
        index[t++] = a;
        index[t++] = c;
        index[t++] = b;
        index[t++] = b;
        index[t++] = c;
        index[t++] = d;
      }
    }

    const geometry = new Geometry(gl, {
      aGrid: { size: 2, data: aGrid },
      uv: { size: 2, data: uv },
      aOffset: { size: 3, data: aOffset },
      aNormal: { size: 3, data: aNormal },
      index: { data: index },
    });

    // Dos texturas que se turnan: la vigente (tMap) y la anterior (tPrev) durante el revelado
    const texOpts = {
      generateMipmaps: false,
      flipY: false,
      minFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    };
    let texCur = new Texture(gl, texOpts);
    let texPrev = new Texture(gl, texOpts);
    const imgAspect = { cur: 1, prev: 1 };
    let mix = 1;
    let loadToken = 0;
    let firstShown = false;

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      transparent: true,
      cullFace: null,
      uniforms: {
        tMap: { value: texCur },
        tPrev: { value: texPrev },
        uHasImage: { value: 0 },
        uHasPrev: { value: 0 },
        uMix: { value: 1 },
        uImgScale: { value: [1, 1] },
        uPrevScale: { value: [1, 1] },
        uColor1: { value: hexToRgb(color1) },
        uColor2: { value: hexToRgb(color2) },
        uHighlight: { value: hexToRgb(highlight) },
        uGrid: { value: showGrid ? 1 : 0 },
        uGridDensity: { value: gridDensity },
        uGridOpacity: { value: gridOpacity },
        uGridColor: { value: hexToRgb(gridColor) },
        uShading: { value: shading },
        uRes: { value: [1, 1] },
        uRadius: { value: borderRadius },
        uAspect: { value: 1 },
        uTilt: { value: (tilt * Math.PI) / 180 },
        uDist: { value: DIST },
        uFit: { value: FIT },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const baseX = new Float32Array(nodeCount);
    const baseY = new Float32Array(nodeCount);
    const pos = new Float32Array(nodeCount * 3);
    const vel = new Float32Array(nodeCount * 3);
    const accel = new Float32Array(nodeCount * 3);

    let aspect = 1;
    function refreshBase() {
      for (let idx = 0; idx < nodeCount; idx++) {
        baseX[idx] = (aGrid[idx * 2] * 2 - 1) * aspect;
        baseY[idx] = 1 - aGrid[idx * 2 + 1] * 2;
      }
    }

    function resize() {
      const w = container.offsetWidth || 1;
      const h = container.offsetHeight || 1;
      renderer.setSize(w, h);
      aspect = w / h;
      program.uniforms.uAspect.value = aspect;
      program.uniforms.uRes.value = [w, h];
      refreshBase();
      updateCover();
    }

    /** Escala de UV para que la imagen cubra el plano sin deformarse (object-fit: cover). */
    function coverScale(img: number): [number, number] {
      return img > aspect ? [aspect / img, 1] : [1, img / aspect];
    }
    function updateCover() {
      program.uniforms.uImgScale.value = coverScale(imgAspect.cur);
      program.uniforms.uPrevScale.value = coverScale(imgAspect.prev);
    }

    /** Latido: la tela se abomba desde el centro y vuelve con su propio rebote. */
    function kick(strength: number) {
      if (reduceMotion) return;
      for (let idx = 0; idx < nodeCount; idx++) {
        const d2 = baseX[idx] * baseX[idx] * 0.35 + baseY[idx] * baseY[idx];
        vel[idx * 3 + 2] += strength * Math.exp(-d2 * 2.2);
      }
    }

    /** Carga una imagen nueva y la revela sobre la actual (o vuelve al degradado si es ''). */
    function setImage(url: string) {
      const token = ++loadToken;
      const swap = (img: HTMLImageElement | null) => {
        if (token !== loadToken) return;
        // La vigente pasa a ser la anterior
        [texPrev, texCur] = [texCur, texPrev];
        imgAspect.prev = imgAspect.cur;
        program.uniforms.uHasPrev.value = program.uniforms.uHasImage.value;
        if (img) {
          texCur.image = img;
          imgAspect.cur = img.naturalWidth / Math.max(1, img.naturalHeight);
        }
        program.uniforms.uHasImage.value = img ? 1 : 0;
        program.uniforms.tMap.value = texCur;
        program.uniforms.tPrev.value = texPrev;
        updateCover();
        mix = reduceMotion || !firstShown ? 1 : 0;
        if (firstShown) kick(0.05);
        firstShown = true;
      };
      if (!url) return swap(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.onload = () => swap(img);
      img.src = url;
    }

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    setImage(imageRef.current);
    setImageRef.current = setImage;

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false, targetActive: false };

    function toPlane(clientX: number, clientY: number) {
      const rect = container.getBoundingClientRect();
      const mx = (clientX - rect.left) / rect.width;
      const my = (clientY - rect.top) / rect.height;
      const clipX = mx * 2 - 1;
      const clipY = 1 - my * 2;
      const t = ((propsRef.current.tilt || 0) * Math.PI) / 180;
      const ct = Math.cos(t);
      const st = Math.sin(t);
      const a = clipY / (ct * FIT * DIST);
      const py = (a * DIST) / (1 + a * st);
      const persp = DIST / (DIST - py * st);
      pointer.tx = (clipX * aspect) / (persp * FIT);
      pointer.ty = py;
    }

    function onMove(e: MouseEvent) {
      toPlane(e.clientX, e.clientY);
      if (propsRef.current.interaction === 'hover') pointer.targetActive = true;
    }
    function onEnter() {
      if (propsRef.current.interaction === 'hover') pointer.targetActive = true;
    }
    function onLeave() {
      pointer.targetActive = false;
    }
    function onDown(e: MouseEvent) {
      if (propsRef.current.interaction === 'drag') {
        toPlane(e.clientX, e.clientY);
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
        pointer.targetActive = true;
      }
    }
    function onUp() {
      if (propsRef.current.interaction === 'drag') pointer.targetActive = false;
    }
    function onTouch(e: TouchEvent) {
      if (e.touches.length) {
        toPlane(e.touches[0].clientX, e.touches[0].clientY);
        pointer.targetActive = true;
      }
    }

    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseenter', onEnter);
    container.addEventListener('mouseleave', onLeave);
    container.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    container.addEventListener('touchstart', onTouch, { passive: true });
    container.addEventListener('touchmove', onTouch, { passive: true });
    container.addEventListener('touchend', onLeave);

    let clock = 0;
    const STEP = 1 / 120;
    const MAX_SUB = 5;
    let accTime = 0;
    let last = performance.now();
    let maxOffset = 0;
    let maxVel = 0;

    function substep() {
      const p = propsRef.current;
      const s = p.stiffness;
      const retain = 1 - p.damping;
      const coupling = 0.06 + p.wobble * 0.032;
      const active = pointer.active && p.enabled && !reduceMotion;
      const r = Math.max(0.08, p.grabRadius) * 1.4;
      const invR = 1 / r;
      const force = p.pull * 0.009;
      const idleAmp = reduceMotion ? 0 : p.idle * 0.00045;
      clock += STEP;

      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const idx = j * N + i;
          const o3 = idx * 3;
          const ox = pos[o3];
          const oy = pos[o3 + 1];
          const oz = pos[o3 + 2];

          let ax = -s * ox;
          let ay = -s * oy;
          let az = -s * oz;

          let sumx = 0;
          let sumy = 0;
          let sumz = 0;
          let cnt = 0;
          if (i > 0) {
            const n = (idx - 1) * 3;
            sumx += pos[n];
            sumy += pos[n + 1];
            sumz += pos[n + 2];
            cnt++;
          }
          if (i < N - 1) {
            const n = (idx + 1) * 3;
            sumx += pos[n];
            sumy += pos[n + 1];
            sumz += pos[n + 2];
            cnt++;
          }
          if (j > 0) {
            const n = (idx - N) * 3;
            sumx += pos[n];
            sumy += pos[n + 1];
            sumz += pos[n + 2];
            cnt++;
          }
          if (j < N - 1) {
            const n = (idx + N) * 3;
            sumx += pos[n];
            sumy += pos[n + 1];
            sumz += pos[n + 2];
            cnt++;
          }
          ax += coupling * (sumx - cnt * ox);
          ay += coupling * (sumy - cnt * oy);
          az += coupling * (sumz - cnt * oz);

          // Respiración: dos ondas lentas cruzadas, solo mientras nadie la toca
          if (idleAmp > 0 && !active) {
            const bx = baseX[idx];
            const by = baseY[idx];
            az +=
              idleAmp *
              (Math.sin(clock * 1.25 + bx * 2.1 + by * 0.8) +
                0.6 * Math.sin(clock * 0.8 - by * 2.6 + bx * 0.5));
          }

          if (active) {
            const dx = pointer.x - (baseX[idx] + ox);
            const dy = pointer.y - (baseY[idx] + oy);
            const d = Math.sqrt(dx * dx + dy * dy);
            const tnorm = d * invR;
            if (tnorm < 1) {
              const zBump = 1 - tnorm * tnorm;
              az += force * zBump * zBump * 6.0;
              if (d > 1e-4) {
                const pinch = tnorm * (1 - tnorm) * (1 - tnorm) * 6.75;
                const dir = (force * pinch * 1.6) / d;
                ax += dx * dir;
                ay += dy * dir;
              }
            }
          }

          accel[o3] = ax;
          accel[o3 + 1] = ay;
          accel[o3 + 2] = az;
        }
      }

      for (let k = 0; k < nodeCount; k++) {
        const o3 = k * 3;
        const nvx = (vel[o3] + accel[o3]) * retain;
        const nvy = (vel[o3 + 1] + accel[o3 + 1]) * retain;
        const nvz = (vel[o3 + 2] + accel[o3 + 2]) * retain;
        vel[o3] = nvx;
        vel[o3 + 1] = nvy;
        vel[o3 + 2] = nvz;

        let px = pos[o3] + nvx;
        let py = pos[o3 + 1] + nvy;
        let pz = pos[o3 + 2] + nvz;
        if (px > 1.2) px = 1.2;
        else if (px < -1.2) px = -1.2;
        if (py > 1.2) py = 1.2;
        else if (py < -1.2) py = -1.2;
        if (pz > 1.2) pz = 1.2;
        else if (pz < -1.2) pz = -1.2;
        pos[o3] = px;
        pos[o3 + 1] = py;
        pos[o3 + 2] = pz;
      }
    }

    function commit() {
      maxOffset = 0;
      maxVel = 0;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const idx = j * N + i;
          const o3 = idx * 3;
          const iL = i > 0 ? idx - 1 : idx;
          const iR = i < N - 1 ? idx + 1 : idx;
          const iD = j > 0 ? idx - N : idx;
          const iU = j < N - 1 ? idx + N : idx;

          const lx = baseX[iL] + pos[iL * 3];
          const ly = baseY[iL] + pos[iL * 3 + 1];
          const lz = pos[iL * 3 + 2];
          const rx = baseX[iR] + pos[iR * 3];
          const ry = baseY[iR] + pos[iR * 3 + 1];
          const rz = pos[iR * 3 + 2];
          const dx = baseX[iD] + pos[iD * 3];
          const dy = baseY[iD] + pos[iD * 3 + 1];
          const dz = pos[iD * 3 + 2];
          const ux = baseX[iU] + pos[iU * 3];
          const uy = baseY[iU] + pos[iU * 3 + 1];
          const uz = pos[iU * 3 + 2];

          const txx = rx - lx;
          const txy = ry - ly;
          const txz = rz - lz;
          const tyx = ux - dx;
          const tyy = uy - dy;
          const tyz = uz - dz;

          let nx = txy * tyz - txz * tyy;
          let ny = txz * tyx - txx * tyz;
          let nz = txx * tyy - txy * tyx;
          if (nz < 0) {
            nx = -nx;
            ny = -ny;
            nz = -nz;
          }
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          aNormal[o3] = nx / len;
          aNormal[o3 + 1] = ny / len;
          aNormal[o3 + 2] = nz / len;

          aOffset[o3] = pos[o3];
          aOffset[o3 + 1] = pos[o3 + 1];
          aOffset[o3 + 2] = pos[o3 + 2];

          const om = Math.abs(pos[o3]) + Math.abs(pos[o3 + 1]) + Math.abs(pos[o3 + 2]);
          if (om > maxOffset) maxOffset = om;
          const vm = Math.abs(vel[o3]) + Math.abs(vel[o3 + 1]) + Math.abs(vel[o3 + 2]);
          if (vm > maxVel) maxVel = vm;
        }
      }
      geometry.attributes.aOffset.needsUpdate = true;
      geometry.attributes.aNormal.needsUpdate = true;
    }

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    let raf = 0;
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const p = propsRef.current;

      program.uniforms.uShading.value = p.shading;
      program.uniforms.uRadius.value = p.borderRadius;
      program.uniforms.uTilt.value = (p.tilt * Math.PI) / 180;
      // Colores y revelado viajan suaves hacia su valor (independiente de los fps)
      const step = Math.max((now - last) / 1000, 1e-4);
      const kc = 1 - Math.exp(-step / 0.25);
      lerp3(c1, hexToRgb(p.color1), kc);
      lerp3(c2, hexToRgb(p.color2), kc);
      program.uniforms.uColor1.value = c1;
      program.uniforms.uColor2.value = c2;
      if (mix < 1) mix = Math.min(1, mix + Math.min(step, 0.1) / 1.1);
      // Curva de salida: rápido al principio, se asienta al final
      program.uniforms.uMix.value = 1 - Math.pow(1 - mix, 3);
      program.uniforms.uHighlight.value = hexToRgb(p.highlight);
      program.uniforms.uGrid.value = p.showGrid ? 1 : 0;
      program.uniforms.uGridDensity.value = p.gridDensity;
      program.uniforms.uGridOpacity.value = p.gridOpacity;
      program.uniforms.uGridColor.value = hexToRgb(p.gridColor);

      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.25) dt = 0.25;

      const tau = 0.06;
      const kLerp = 1 - Math.exp(-Math.max(dt, 1e-4) / tau);
      pointer.x += (pointer.tx - pointer.x) * kLerp;
      pointer.y += (pointer.ty - pointer.y) * kLerp;
      pointer.active = pointer.targetActive;

      accTime += dt;
      let sub = 0;
      while (accTime >= STEP && sub < MAX_SUB) {
        substep();
        accTime -= STEP;
        sub++;
      }
      if (accTime > STEP) accTime = 0;

      commit();
      renderer.render({ scene: mesh });
    }
    let visible = false;
    let pageVisible = !document.hidden;
    const tryStart = () => {
      if (visible && pageVisible && raf === 0) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const tryStop = () => {
      if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) tryStart();
      else tryStop();
    });
    io.observe(container);
    const onVis = () => {
      pageVisible = !document.hidden;
      if (pageVisible) tryStart();
      else tryStop();
    };
    document.addEventListener('visibilitychange', onVis);

    container.appendChild(gl.canvas);
    gl.canvas.style.display = 'block';

    return () => {
      setImageRef.current = null;
      tryStop();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      container.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseenter', onEnter);
      container.removeEventListener('mouseleave', onLeave);
      container.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      container.removeEventListener('touchstart', onTouch);
      container.removeEventListener('touchmove', onTouch);
      container.removeEventListener('touchend', onLeave);
      if (gl.canvas.parentElement === container) container.removeChild(gl.canvas);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolution]);

  // Cambiar de imagen: revelado sobre la anterior, sin reconstruir la escena
  useEffect(() => {
    if (imageRef.current === image) return;
    imageRef.current = image;
    setImageRef.current?.(image);
  }, [image]);

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full${className ? ` ${className}` : ''}`}
      style={style}
    />
  );
};

export { ElasticMesh };
