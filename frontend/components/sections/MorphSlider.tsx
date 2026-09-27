'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mesh, Program, Renderer, Texture, Triangle } from 'ogl';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/cn';

export interface MorphItem {
  image: string;
  caption?: string;
  href?: string;
}

const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform float uProgress;
uniform float uIntensity;
uniform float uScale;
uniform float uAberration;
uniform float uDrift;
uniform float uTime;
uniform float uReduce;
uniform vec3 uOverlay;
varying vec2 vUv;
const float PI = 3.14159265359;

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
vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float rA = res.x / max(res.y, 1.0);
  float iA = img.x / max(img.y, 1.0);
  vec2 s = vec2(1.0);
  float ratio = rA / max(iA, 0.0001);
  if (ratio > 1.0) s.y = 1.0 / ratio; else s.x = ratio;
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
  if (uReduce < 0.5) {
    // "melt": el ruido fbm desplaza ambas imágenes y decide dónde se funde una en otra
    float nn = fbm(uv * uScale + uTime * 0.03);
    float warp = fbm(uv * uScale * 1.7 - uTime * 0.02);
    vec2 g = vec2(nn, warp) - 0.5;
    uvC = uv + g * uIntensity * 0.5 * p;
    uvN = uv - g * uIntensity * 0.5 * (1.0 - p);
    m = smoothstep(nn - 0.15, nn + 0.15, p);
  }
  vec2 sC = coverUV(uvC, uResolution, uCurrentSize);
  vec2 sN = coverUV(uvN, uResolution, uNextSize);
  float ca = uReduce < 0.5 ? uAberration * env * 0.03 : 0.0;
  vec3 colC = vec3(texture2D(tCurrent, sC + vec2(ca, 0.0)).r, texture2D(tCurrent, sC).g, texture2D(tCurrent, sC - vec2(ca, 0.0)).b);
  vec3 colN = vec3(texture2D(tNext, sN + vec2(ca, 0.0)).r, texture2D(tNext, sN).g, texture2D(tNext, sN - vec2(ca, 0.0)).b);
  vec3 col = mix(colC, colN, m);
  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
  col = mix(col, uOverlay, (1.0 - vig) * 0.3);
  gl_FragColor = vec4(col, 1.0);
}
`;

const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

interface Props {
  items: MorphItem[];
  duration?: number;
  intensity?: number;
  scale?: number;
  aberration?: number;
  drift?: number;
  overlayColor?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  radius?: number;
  className?: string;
}

/**
 * Deslizador con transición "melt" en WebGL (React Bits `MorphSlider`, OGL + GSAP), reducido a
 * la transición que encaja con el tono (el ruido funde una foto en la siguiente, como tinta
 * húmeda). Overlay crepúsculo, controles del sistema. Arrastre horizontal, flechas y teclado.
 * Con reduced-motion la transición es un fundido corto sin distorsión.
 */
export function MorphSlider({
  items,
  duration = 1.1,
  intensity = 0.55,
  scale = 2.4,
  aberration = 0.3,
  drift = 0.4,
  overlayColor = '#130d24',
  autoplay = true,
  autoplayDelay = 5,
  radius = 6,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = useRef<{
    next: () => void;
    prev: () => void;
    destroy: () => void;
  } | null>(null);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || items.length === 0) return;
    const reduce = prefersReducedMotion();
    const renderer = new Renderer({
      alpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
    });
    const gl = renderer.gl;
    gl.clearColor(0.08, 0.07, 0.16, 1);
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.className = 'morph-slider-canvas';
    el.appendChild(canvas);

    const fallback = () => {
      const data = new Uint8Array([21, 17, 42, 255]);
      return new Texture(gl, { image: data, width: 1, height: 1, generateMipmaps: false });
    };
    const textures = items.map(() => fallback());
    const sizes: [number, number][] = items.map(() => [1, 1]);
    let current = 0;
    let animating = false;
    let tween: gsap.core.Tween | null = null;

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        tCurrent: { value: textures[0] },
        tNext: { value: textures[0] },
        uResolution: { value: [1, 1] },
        uCurrentSize: { value: sizes[0] },
        uNextSize: { value: sizes[0] },
        uProgress: { value: 0 },
        uIntensity: { value: intensity },
        uScale: { value: scale },
        uAberration: { value: aberration },
        uDrift: { value: drift },
        uTime: { value: 0 },
        uReduce: { value: reduce ? 1 : 0 },
        uOverlay: { value: hexToRgb(overlayColor) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    items.forEach((item, i) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = item.image;
      img.onload = () => {
        const t = new Texture(gl, { generateMipmaps: false });
        t.image = img;
        textures[i] = t;
        sizes[i] = [img.naturalWidth || 1, img.naturalHeight || 1];
        if (i === current) {
          program.uniforms.tCurrent.value = t;
          program.uniforms.uCurrentSize.value = sizes[i];
        }
      };
    });

    const resize = () => {
      const r = el.getBoundingClientRect();
      renderer.setSize(Math.max(r.width, 1), Math.max(r.height, 1));
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let raf = 0;
    let visible = true;
    const loop = (t: number) => {
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene: mesh });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    });
    io.observe(el);

    const wrap = (i: number) => ((i % items.length) + items.length) % items.length;
    const goTo = (dir: number) => {
      if (animating || items.length < 2) return;
      const target = wrap(current + dir);
      program.uniforms.tCurrent.value = textures[current];
      program.uniforms.uCurrentSize.value = sizes[current];
      program.uniforms.tNext.value = textures[target];
      program.uniforms.uNextSize.value = sizes[target];
      animating = true;
      setIndex(target);
      tween = gsap.fromTo(
        program.uniforms.uProgress,
        { value: 0 },
        {
          value: 1,
          duration: reduce ? 0.4 : duration,
          ease: 'power2.inOut',
          onComplete: () => {
            current = target;
            program.uniforms.tCurrent.value = textures[target];
            program.uniforms.uCurrentSize.value = sizes[target];
            program.uniforms.uProgress.value = 0;
            animating = false;
            tween = null;
          },
        }
      );
    };

    // Arrastre horizontal: un gesto de más de 60 px cambia de foto
    let startX: number | null = null;
    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 60) goTo(dx < 0 ? 1 : -1);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', () => (startX = null));

    engine.current = {
      next: () => goTo(1),
      prev: () => goTo(-1),
      destroy: () => {
        cancelAnimationFrame(raf);
        tween?.kill();
        ro.disconnect();
        io.disconnect();
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointerup', onUp);
        textures.forEach((t) => t.texture && gl.deleteTexture(t.texture));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        canvas.remove();
      },
    };
    setIndex(0);
    return () => {
      engine.current?.destroy();
      engine.current = null;
    };
  }, [items, duration, intensity, scale, aberration, drift, overlayColor]);

  useEffect(() => {
    if (!autoplay || hovering || items.length < 2) return;
    const id = window.setTimeout(() => engine.current?.next(), Math.max(autoplayDelay, 1) * 1000);
    return () => window.clearTimeout(id);
  }, [autoplay, autoplayDelay, hovering, index, items.length]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      engine.current?.next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      engine.current?.prev();
    }
  }, []);

  const active = items[index];

  return (
    <div
      className={cn('relative w-full overflow-hidden bg-dusk select-none', className)}
      style={{ borderRadius: radius }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay"
        role="group"
        aria-roledescription="carrusel"
        aria-label="Fotos destacadas de la galería"
        tabIndex={0}
        onKeyDown={onKeyDown}
      />

      {active?.caption && (
        <div
          className="pointer-events-none absolute bottom-5 left-5 z-[2] max-w-[70%]"
          aria-live="polite"
        >
          {items.map((it, i) =>
            it.caption ? (
              <span
                key={i}
                aria-hidden={i !== index}
                className={cn(
                  'absolute bottom-0 left-0 inline-block rounded-[4px] bg-dusk/60 px-3.5 py-2 font-display text-[1.05rem] text-paper backdrop-blur-md transition-[opacity,transform,filter] duration-700 ease-(--ease-out-premium)',
                  i === index
                    ? 'opacity-100 blur-0 translate-y-0'
                    : 'opacity-0 blur-[6px] translate-y-3'
                )}
                style={{ fontVariationSettings: "'opsz' 24, 'SOFT' 30" }}
              >
                {it.caption}
              </span>
            ) : null
          )}
        </div>
      )}

      {items.length > 1 && (
        <>
          <button
            type="button"
            className="depth-carousel__arrow left-4 !border-paper/30 !bg-dusk/40 !text-paper hover:!border-lilac-2 hover:!bg-lilac-2 hover:!text-lilac-3"
            aria-label="Foto anterior"
            onClick={() => engine.current?.prev()}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="depth-carousel__arrow right-4 !border-paper/30 !bg-dusk/40 !text-paper hover:!border-lilac-2 hover:!bg-lilac-2 hover:!text-lilac-3"
            aria-label="Foto siguiente"
            onClick={() => engine.current?.next()}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M9 5l7 7-7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            className="absolute right-5 bottom-6 z-[3] flex items-center gap-2"
            role="tablist"
            aria-label="Fotos"
          >
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Ir a la foto ${i + 1}`}
                className={cn(
                  'depth-carousel__dot !bg-paper/40',
                  i === index && 'is-active !bg-lilac-2'
                )}
                onClick={() => {
                  if (i === index) return;
                  (i > index ? engine.current?.next : engine.current?.prev)?.();
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
