'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { CSSProperties, ReactNode, Ref } from 'react';
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';
import { Chevron } from '@/components/ui/Chevron';

/**
 * Deslizador con transiciones en WebGL: React Bits `MorphSlider` (OGL + GSAP), tal como lo pasó el
 * equipo, con su motor completo (melt, ripple, shear, swirl; arrastre que "frota" la transición,
 * leyendas, controles e indicadores). Cambios para el sitio (DESIGN_NOTES §29.5):
 * - el motor solo dibuja mientras el deslizador está en pantalla y la pestaña visible;
 * - en reposo el shader no calcula el ruido de la transición (solo la deriva), que es lo caro;
 * - densidad de píxeles hasta 1.5 (no 2): la diferencia no se ve en una foto en movimiento;
 * - `goToIndex` para saltar a cualquier foto (la hoja de contactos de la portada);
 * - `onReady` cuando la primera foto ya es textura (hasta entonces se ve la foto normal debajo);
 * - textos en español y controles con la flecha del sitio.
 */

export type MorphTransition = 'melt' | 'ripple' | 'shear' | 'swirl';

export interface MorphItem {
  image: string;
  caption?: string;
  href?: string;
}

interface EngineOptions {
  transition: MorphTransition;
  duration: number;
  ease: string;
  intensity: number;
  scale: number;
  aberration: number;
  drift: number;
  overlayColor: string;
  loop: boolean;
}

type GL = Renderer['gl'];

const TRANSITIONS: Record<MorphTransition, number> = { melt: 0, ripple: 1, shear: 2, swirl: 3 };

const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform float uProgress;
uniform float uDir;
uniform int uMode;
uniform float uIntensity;
uniform float uScale;
uniform float uAberration;
uniform float uDrift;
uniform float uTime;
uniform float uReduce;
uniform vec2 uPointer;
uniform vec3 uOverlay;

varying vec2 vUv;

const float PI = 3.14159265359;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float rA = res.x / max(res.y, 1.0);
  float iA = img.x / max(img.y, 1.0);
  vec2 s = vec2(1.0);
  float ratio = rA / max(iA, 0.0001);
  if (ratio > 1.0) {
    s.y = 1.0 / ratio;
  } else {
    s.x = ratio;
  }
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);
  float env = sin(p * PI);

  vec2 uv = vUv;

  uv += vec2(sin(uTime * 0.25 + uv.y * 4.0), cos(uTime * 0.22 + uv.x * 4.0)) * uDrift * 0.008;
  uv = (uv - 0.5) * (1.0 - uDrift * 0.02 * sin(uTime * 0.4)) + 0.5;

  vec2 uvC = uv;
  vec2 uvN = uv;
  float m = smoothstep(0.0, 1.0, p);

  // En reposo (sin transición ni arrastre) no hace falta el ruido: es lo que más cuesta por píxel
  if (uReduce < 0.5 && p > 0.0001) {
    if (uMode == 3) {
      vec2 c = uv - 0.5;
      float r = length(c);
      float ang = env * uIntensity * 3.5 * (1.0 - r);
      uvC = rot(ang) * c + 0.5;
      uvN = rot(-ang) * c + 0.5;
      m = smoothstep(0.0, 1.0, p);
    } else if (uMode == 1) {
      float d = distance(uv, uPointer);
      float ring = p * 1.6;
      float wave = sin((d - ring) * 30.0) * env;
      vec2 dir = normalize(uv - uPointer + 1e-4);
      vec2 disp = dir * wave * uIntensity * 0.25;
      uvC = uv + disp;
      uvN = uv + disp * 0.6;
      m = 1.0 - smoothstep(ring - 0.03, ring + 0.03, d);
    } else if (uMode == 2) {
      float slices = 14.0;
      float row = floor(uv.y * slices);
      float rnd = hash11(row);
      vec2 disp = vec2((rnd - 0.5) * env * uIntensity * 0.6, 0.0);
      uvC = uv + disp;
      uvN = uv + disp;
      float localX = uDir > 0.0 ? uv.x : 1.0 - uv.x;
      float th = p * 1.5 - 0.25 + (rnd - 0.5) * 0.25;
      m = 1.0 - smoothstep(th - 0.06, th + 0.06, localX);
    } else {
      float nn = fbm(uv * uScale + uTime * 0.03);
      float warp = fbm(uv * uScale * 1.7 - uTime * 0.02);
      vec2 g = vec2(nn, warp) - 0.5;
      uvC = uv + g * uIntensity * 0.5 * p;
      uvN = uv - g * uIntensity * 0.5 * (1.0 - p);
      m = smoothstep(nn - 0.15, nn + 0.15, p);
    }
  }

  vec2 sC = coverUV(uvC, uResolution, uCurrentSize);
  vec2 sN = coverUV(uvN, uResolution, uNextSize);

  float ca = uReduce < 0.5 ? uAberration * env * 0.03 : 0.0;

  vec3 colC = vec3(
    texture2D(tCurrent, sC + vec2(ca, 0.0)).r,
    texture2D(tCurrent, sC).g,
    texture2D(tCurrent, sC - vec2(ca, 0.0)).b
  );
  vec3 colN = vec3(
    texture2D(tNext, sN + vec2(ca, 0.0)).r,
    texture2D(tNext, sN).g,
    texture2D(tNext, sN - vec2(ca, 0.0)).b
  );

  vec3 col = mix(colC, colN, m);

  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
  col = mix(col, uOverlay, (1.0 - vig) * 0.28);

  gl_FragColor = vec4(col, 1.0);
}
`;

function makeFallbackTexture(gl: GL): Texture {
  const size = 4;
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = 22;
    data[i * 4 + 1] = 15;
    data[i * 4 + 2] = 48;
    data[i * 4 + 3] = 255;
  }
  return new Texture(gl, { image: data, width: size, height: size, generateMipmaps: false });
}

function hexToRgb(hex: string): [number, number, number] {
  let h = (hex || '#000000').replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

interface EngineConfig {
  items: MorphItem[];
  startIndex: number;
  reducedMotion: boolean;
  getOptions: () => EngineOptions;
  onIndexChange: (index: number) => void;
  onReady: () => void;
  dprCap: number;
}

class MorphEngine {
  private container: HTMLElement;
  private items: MorphItem[];
  private getOptions: () => EngineOptions;
  private onIndexChange: (index: number) => void;
  private onReady: () => void;
  private reducedMotion: boolean;

  private current: number;
  private animating = false;
  private dragging = false;
  private dragDir = 0;
  private shownIndex: number;
  private tween: gsap.core.Tween | null = null;

  private renderer: Renderer;
  private gl: GL;
  private canvas: HTMLCanvasElement;
  private geometry: Triangle;
  private program: Program;
  private mesh: Mesh;
  private textures: Texture[];
  private sizes: [number, number][];
  private resizeObserver: ResizeObserver;
  private visibility: IntersectionObserver;
  private onScreen = true;
  private destroyed = false;
  private uploads: number[] = [];
  private uploadTimer = 0;
  private raf = 0;
  private boundLoop: (t: number) => void;
  private boundContextLost: (e: Event) => void;
  private boundVisibility: () => void;

  constructor(container: HTMLElement, config: EngineConfig) {
    this.container = container;
    this.items = config.items;
    this.getOptions = config.getOptions;
    this.onIndexChange = config.onIndexChange;
    this.onReady = config.onReady;
    this.reducedMotion = config.reducedMotion;
    this.current = config.startIndex;
    this.shownIndex = config.startIndex;

    this.renderer = new Renderer({
      alpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, config.dprCap),
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0.09, 0.06, 0.19, 1);

    this.canvas = this.gl.canvas as HTMLCanvasElement;
    this.canvas.className = 'morph-slider__canvas';
    container.appendChild(this.canvas);

    this.geometry = new Triangle(this.gl);

    this.textures = this.items.map(() => makeFallbackTexture(this.gl));
    this.sizes = this.items.map(() => [1, 1] as [number, number]);

    const opts = this.getOptions();
    this.program = new Program(this.gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        tCurrent: { value: this.textures[this.current] },
        tNext: { value: this.textures[this.current] },
        uResolution: { value: [1, 1] },
        uCurrentSize: { value: this.sizes[this.current] },
        uNextSize: { value: this.sizes[this.current] },
        uProgress: { value: 0 },
        uDir: { value: 1 },
        uMode: { value: TRANSITIONS[opts.transition] ?? 0 },
        uIntensity: { value: opts.intensity },
        uScale: { value: opts.scale },
        uAberration: { value: opts.aberration },
        uDrift: { value: opts.drift },
        uTime: { value: 0 },
        uReduce: { value: this.reducedMotion ? 1 : 0 },
        uPointer: { value: [0.5, 0.5] },
        uOverlay: { value: hexToRgb(opts.overlayColor) },
      },
    });

    this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program });

    this.boundContextLost = this.onContextLost.bind(this);
    this.canvas.addEventListener('webglcontextlost', this.boundContextLost, false);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.loadTextures();

    this.boundLoop = this.loop.bind(this);
    // Solo se dibuja con el deslizador en pantalla y la pestaña visible
    this.visibility = new IntersectionObserver(([e]) => {
      this.onScreen = e.isIntersecting;
      this.wake();
    });
    this.visibility.observe(container);
    this.boundVisibility = () => this.wake();
    document.addEventListener('visibilitychange', this.boundVisibility);
    this.wake();
  }

  private wake(): void {
    const run = this.onScreen && document.visibilityState === 'visible';
    if (run && !this.raf) this.raf = requestAnimationFrame(this.boundLoop);
    if (!run && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  private loadTextures(): void {
    this.items.forEach((item, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.src = item.image;
      // Decodificada fuera del hilo principal antes de convertirse en textura
      img
        .decode()
        .catch(() => undefined)
        .then(() => {
          if (this.destroyed || !img.naturalWidth) return;
          const texture = new Texture(this.gl, { generateMipmaps: false });
          texture.image = img;
          this.textures[index] = texture;
          this.sizes[index] = [img.naturalWidth || 1, img.naturalHeight || 1];
          if (index === this.current) {
            this.program.uniforms.tCurrent.value = texture;
            this.program.uniforms.uCurrentSize.value = this.sizes[index];
            // Un fotograma después, para que la textura ya esté en la GPU al mostrarse
            requestAnimationFrame(() => requestAnimationFrame(() => this.onReady()));
          } else {
            this.enqueue(index);
          }
        });
    });
  }

  /**
   * Subir una foto a la GPU cuesta un buen tramo de fotograma. Sin esto ocurría en el primer
   * fotograma de su transición (un tirón justo al cambiar); ahora se suben de una en una en
   * momentos libres, primero las vecinas de la que está a la vista.
   */
  private enqueue(index: number): void {
    this.uploads.push(index);
    if (this.uploadTimer) return;
    const run = () => {
      this.uploadTimer = 0;
      if (this.destroyed || !this.uploads.length) return;
      const n = this.items.length;
      const dist = (i: number) => {
        const d = Math.abs(i - this.current) % n;
        return Math.min(d, n - d);
      };
      this.uploads.sort((a, b) => dist(a) - dist(b));
      const i = this.uploads.shift() as number;
      this.textures[i].update();
      if (this.uploads.length) this.schedule(run);
    };
    this.schedule(run);
  }

  private schedule(fn: () => void): void {
    this.uploadTimer =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(fn, { timeout: 600 })
        : window.setTimeout(fn, 60);
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    this.renderer.setSize(w, h);
    this.program.uniforms.uResolution.value = [this.gl.canvas.width, this.gl.canvas.height];
  }

  private syncOptions(): void {
    const opts = this.getOptions();
    this.program.uniforms.uMode.value = TRANSITIONS[opts.transition] ?? 0;
    this.program.uniforms.uIntensity.value = opts.intensity;
    this.program.uniforms.uScale.value = opts.scale;
    this.program.uniforms.uAberration.value = opts.aberration;
    this.program.uniforms.uDrift.value = opts.drift;
    this.program.uniforms.uOverlay.value = hexToRgb(opts.overlayColor);
  }

  private loop(t: number): void {
    this.raf = 0;
    this.program.uniforms.uTime.value = t * 0.001;
    if (!this.dragging && !this.animating) this.syncOptions();
    this.renderer.render({ scene: this.mesh });
    this.wake();
  }

  private wrap(i: number): number {
    const n = this.items.length;
    return ((i % n) + n) % n;
  }

  private prepare(target: number, dir: number): void {
    this.program.uniforms.tCurrent.value = this.textures[this.current];
    this.program.uniforms.uCurrentSize.value = this.sizes[this.current];
    this.program.uniforms.tNext.value = this.textures[target];
    this.program.uniforms.uNextSize.value = this.sizes[target];
    this.program.uniforms.uDir.value = dir;
  }

  private prepareNext(dir: number): number {
    const target = this.wrap(this.current + dir);
    this.prepare(target, dir);
    return target;
  }

  private run(target: number, dir: number): void {
    const opts = this.getOptions();
    this.syncOptions();
    this.prepare(target, dir);
    this.animating = true;
    this.announce(target);
    const duration = this.reducedMotion ? Math.min(opts.duration, 0.4) : opts.duration;
    this.tween = gsap.fromTo(
      this.program.uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration,
        ease: opts.ease,
        onComplete: () => this.commit(target),
      }
    );
  }

  goTo(dir: number): void {
    if (this.animating || this.dragging || this.items.length < 2) return;
    const opts = this.getOptions();
    if (!opts.loop) {
      const raw = this.current + dir;
      if (raw < 0 || raw > this.items.length - 1) return;
    }
    this.run(this.wrap(this.current + dir), dir);
  }

  /** Salta a una foto cualquiera con la misma transición. */
  goToIndex(index: number): void {
    if (this.animating || this.dragging || this.items.length < 2) return;
    const target = this.wrap(index);
    if (target === this.current) return;
    this.run(target, target > this.current ? 1 : -1);
  }

  get index(): number {
    return this.current;
  }

  get busy(): boolean {
    return this.animating || this.dragging;
  }

  private announce(index: number): void {
    if (index === this.shownIndex) return;
    this.shownIndex = index;
    this.onIndexChange(index);
  }

  private commit(target: number): void {
    this.current = target;
    this.program.uniforms.tCurrent.value = this.textures[target];
    this.program.uniforms.uCurrentSize.value = this.sizes[target];
    this.program.uniforms.uProgress.value = 0;
    this.animating = false;
    this.tween = null;
    this.announce(target);
  }

  next(): void {
    this.goTo(1);
  }

  prev(): void {
    this.goTo(-1);
  }

  setPointer(x: number, y: number): void {
    this.program.uniforms.uPointer.value = [x, y];
  }

  beginDrag(): boolean {
    if (this.animating || this.items.length < 2) return false;
    this.dragging = true;
    this.dragDir = 0;
    this.syncOptions();
    return true;
  }

  drag(ndx: number): void {
    if (!this.dragging) return;
    const opts = this.getOptions();
    const dir = ndx < 0 ? 1 : -1;
    if (!opts.loop) {
      const raw = this.current + dir;
      if (raw < 0 || raw > this.items.length - 1) {
        this.program.uniforms.uProgress.value = 0;
        return;
      }
    }
    if (dir !== this.dragDir) {
      this.dragDir = dir;
      this.prepareNext(dir);
    }
    const progress = Math.min(Math.abs(ndx), 1);
    this.program.uniforms.uProgress.value = progress;
    this.announce(progress > 0.5 ? this.wrap(this.current + dir) : this.current);
  }

  endDrag(): void {
    if (!this.dragging) return;
    this.dragging = false;
    const p = this.program.uniforms.uProgress.value as number;
    if (this.dragDir === 0) return;
    const target = this.wrap(this.current + this.dragDir);
    const duration = this.reducedMotion ? 0.3 : 0.5;
    this.animating = true;
    if (p > 0.4) {
      this.announce(target);
      this.tween = gsap.to(this.program.uniforms.uProgress, {
        value: 1,
        duration,
        ease: 'power2.out',
        onComplete: () => this.commit(target),
      });
    } else {
      this.announce(this.current);
      this.tween = gsap.to(this.program.uniforms.uProgress, {
        value: 0,
        duration,
        ease: 'power2.out',
        onComplete: () => {
          this.animating = false;
          this.tween = null;
        },
      });
    }
  }

  private onContextLost(e: Event): void {
    e.preventDefault();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  destroy(): void {
    this.destroyed = true;
    if (this.uploadTimer) {
      if (typeof window.cancelIdleCallback === 'function')
        window.cancelIdleCallback(this.uploadTimer);
      window.clearTimeout(this.uploadTimer);
    }
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.onScreen = false;
    if (this.tween) this.tween.kill();
    this.resizeObserver.disconnect();
    this.visibility.disconnect();
    document.removeEventListener('visibilitychange', this.boundVisibility);
    this.canvas.removeEventListener('webglcontextlost', this.boundContextLost);
    this.textures.forEach((tex) => {
      if (tex && tex.texture) this.gl.deleteTexture(tex.texture);
    });
    if (this.program && this.program.program) this.gl.deleteProgram(this.program.program);
    const ext = this.gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
  }
}

/** Mando desde fuera: la hoja de contactos de la portada salta con esto. */
export interface MorphSliderHandle {
  goToIndex: (index: number) => void;
  next: () => void;
  prev: () => void;
}

export interface MorphSliderProps {
  items: MorphItem[];
  startIndex?: number;
  transition?: MorphTransition;
  duration?: number;
  ease?: string;
  intensity?: number;
  scale?: number;
  aberration?: number;
  drift?: number;
  autoplay?: boolean;
  autoplayDelay?: number;
  loop?: boolean;
  radius?: number;
  overlayColor?: string;
  showCaptions?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  className?: string;
  /** Rótulo accesible del conjunto. */
  label?: string;
  /** Leyenda propia (en vez del texto simple de `caption`). */
  renderCaption?: (item: MorphItem, index: number) => ReactNode;
  /** Click (sin arrastre) sobre la foto actual. */
  onOpen?: (index: number) => void;
  onIndexChange?: (index: number) => void;
  /** Foto que se ve debajo mientras la primera textura llega a la GPU. */
  poster?: ReactNode;
  handleRef?: Ref<MorphSliderHandle>;
}

export function MorphSlider({
  items,
  startIndex = 0,
  transition = 'melt',
  duration = 1.1,
  ease = 'power2.inOut',
  intensity = 0.55,
  scale = 2.4,
  aberration = 0.35,
  drift = 0.4,
  autoplay = false,
  autoplayDelay = 4,
  loop = true,
  radius = 16,
  overlayColor = '#160f30',
  showCaptions = true,
  showControls = true,
  showIndicators = true,
  className,
  label = 'Fotos del Foro',
  renderCaption,
  onOpen,
  onIndexChange,
  poster,
  handleRef,
}: MorphSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MorphEngine | null>(null);
  const [index, setIndex] = useState(startIndex);
  const [hovering, setHovering] = useState(false);
  const [ready, setReady] = useState(false);
  const onIndexRef = useRef(onIndexChange);
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onIndexRef.current = onIndexChange;
    onOpenRef.current = onOpen;
  }, [onIndexChange, onOpen]);

  const optsRef = useRef<EngineOptions>({
    transition,
    duration,
    ease,
    intensity,
    scale,
    aberration,
    drift,
    overlayColor,
    loop,
  });
  useEffect(() => {
    optsRef.current = {
      transition,
      duration,
      ease,
      intensity,
      scale,
      aberration,
      drift,
      overlayColor,
      loop,
    };
  }, [transition, duration, ease, intensity, scale, aberration, drift, overlayColor, loop]);

  useEffect(() => {
    if (!containerRef.current || !items.length) return undefined;
    const engine = new MorphEngine(containerRef.current, {
      items,
      startIndex,
      reducedMotion: prefersReducedMotion(),
      dprCap: 1.5,
      getOptions: () => optsRef.current,
      onIndexChange: (i) => {
        setIndex(i);
        onIndexRef.current?.(i);
      },
      onReady: () => setReady(true),
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [items, startIndex]);

  useImperativeHandle(
    handleRef,
    () => ({
      goToIndex: (i) => engineRef.current?.goToIndex(i),
      next: () => engineRef.current?.next(),
      prev: () => engineRef.current?.prev(),
    }),
    []
  );

  const handleNext = useCallback(() => engineRef.current?.next(), []);
  const handlePrev = useCallback(() => engineRef.current?.prev(), []);

  useEffect(() => {
    if (!autoplay || hovering) return undefined;
    const id = window.setTimeout(
      () => engineRef.current?.next(),
      Math.max(autoplayDelay, 1) * 1000
    );
    return () => window.clearTimeout(id);
  }, [autoplay, autoplayDelay, hovering, index]);

  // Arrastre: el gesto "frota" la transición; soltar pasada la mitad la completa
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    let startX = 0;
    let startY = 0;
    let width = 1;
    let active = false;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      width = rect.width || 1;
      startX = e.clientX;
      startY = e.clientY;
      moved = false;
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      engineRef.current?.setPointer(px, 1 - py);
      active = engineRef.current?.beginDrag() ?? false;
      if (active && el.setPointerCapture) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* el puntero ya se soltó */
        }
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!active) return;
      const dx = e.clientX - startX;
      if (!moved && Math.hypot(dx, e.clientY - startY) > 6) moved = true;
      engineRef.current?.drag(dx / width);
    };
    const onUp = () => {
      if (!active) return;
      active = false;
      const engine = engineRef.current;
      engine?.endDrag();
      // Un toque sin arrastre abre la foto
      if (!moved && engine) onOpenRef.current?.(engine.index);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Enter' && engineRef.current) {
        e.preventDefault();
        onOpenRef.current?.(engineRef.current.index);
      }
    },
    [handleNext, handlePrev]
  );

  const hasCaptions = items.some((item) => item.caption) || !!renderCaption;

  return (
    <div
      className={cn('morph-slider', className)}
      style={
        {
          borderRadius: `${radius}px`,
          '--ms-swap': `${(duration * 0.66).toFixed(3)}s`,
          '--ms-dot': `${(duration * 0.45).toFixed(3)}s`,
        } as CSSProperties
      }
      data-ready={ready || undefined}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {poster && (
        <div className="morph-slider__poster" aria-hidden>
          {poster}
        </div>
      )}
      <div
        ref={containerRef}
        className="morph-slider__stage"
        role="group"
        aria-roledescription="carrusel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
      />

      {showCaptions && hasCaptions && (
        <div className="morph-slider__captions" aria-live="polite">
          {items.map((item, i) =>
            item.caption || renderCaption ? (
              <span
                key={i}
                aria-hidden={i === index ? undefined : true}
                className="morph-slider__caption"
                data-on={i === index || undefined}
              >
                {renderCaption ? renderCaption(item, i) : item.caption}
              </span>
            ) : null
          )}
        </div>
      )}

      {showControls && items.length > 1 && (
        <div className="morph-slider__controls">
          <button type="button" aria-label="Foto anterior" onClick={handlePrev}>
            <Chevron dir="prev" />
          </button>
          <button type="button" aria-label="Foto siguiente" onClick={handleNext}>
            <Chevron dir="next" />
          </button>
        </div>
      )}

      {showIndicators && items.length > 1 && (
        <div className="morph-slider__dots" role="tablist" aria-label="Fotos">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ir a la foto ${i + 1}`}
              className="morph-slider__dot"
              data-on={i === index || undefined}
              onClick={() => engineRef.current?.goToIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
