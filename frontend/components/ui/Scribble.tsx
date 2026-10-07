import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * Trazos hechos a mano (v7 "Anuario anotado", DESIGN_NOTES §29.3): lo que alguien dibujaría con
 * una pluma sobre el anuario impreso. Cada trazo se dibuja solo cuando aparece
 * (`data-reveal="draw"`, script de arranque: anima `stroke-dashoffset` de 1 a 0 con `pathLength=1`),
 * sin JavaScript de React ni medidas: el SVG se estira sobre la palabra que acompaña.
 *
 * Los caminos están hechos a mano, con su temblor: nada de líneas perfectas.
 */
export type ScribbleKind =
  | 'underline'
  | 'swash'
  | 'double'
  | 'circle'
  | 'highlight'
  | 'arrow-left'
  | 'arrow-down'
  | 'arrow-right'
  | 'spark'
  | 'zigzag';

interface Shape {
  viewBox: string;
  paths: { d: string; w?: number; o?: number }[];
  /** Cómo se coloca respecto de su palabra. */
  place: 'under' | 'around' | 'behind' | 'free';
}

const SHAPES: Record<ScribbleKind, Shape> = {
  underline: {
    viewBox: '0 0 200 20',
    place: 'under',
    paths: [{ d: 'M3 12.5C38 8.4 79 6.6 121 8.1C150 9.1 177 10.8 197 7.4' }],
  },
  swash: {
    viewBox: '0 0 200 24',
    place: 'under',
    paths: [
      { d: 'M2 16C26 7.5 52 19.5 82 12.4C112 5.3 141 3.6 168 9.8C180 12.5 190 15.6 198 13.2' },
    ],
  },
  double: {
    viewBox: '0 0 200 24',
    place: 'under',
    paths: [
      { d: 'M4 9.6C51 6.2 113 5.8 196 8.4' },
      { d: 'M12 17.2C66 13.6 128 13.9 189 16.3', w: 0.8 },
    ],
  },
  circle: {
    viewBox: '0 0 200 80',
    place: 'around',
    paths: [
      {
        d: 'M44 14.5C78 3.7 145 2.6 176 18.3C201 30.9 197 56.7 163 68.4C126 81 63 79.2 30 67.1C1.6 56.7 2.9 33.4 25.9 20.9C47.6 9.1 92 6.4 118 8.6',
      },
    ],
  },
  highlight: {
    viewBox: '0 0 200 30',
    place: 'behind',
    paths: [{ d: 'M3 18.5C48 15.6 104 20.3 197 16.2', w: 9, o: 0.28 }],
  },
  'arrow-left': {
    viewBox: '0 0 120 60',
    place: 'free',
    paths: [
      { d: 'M114 44C92 52 56 49 26 30C19 25.6 13.5 20.8 9 15.4' },
      { d: 'M8.2 31.7L8.5 14.6L24.6 12.3' },
    ],
  },
  'arrow-down': {
    viewBox: '0 0 60 120',
    place: 'free',
    paths: [
      { d: 'M14 4C37 21 45 48 38 74C35.5 84 31.4 94 26.5 108' },
      { d: 'M13.6 95.2L26.3 109.3L39.4 98.1' },
    ],
  },
  'arrow-right': {
    viewBox: '0 0 120 60',
    place: 'free',
    paths: [
      { d: 'M6 44C28 52 64 49 94 30C101 25.6 106.5 20.8 111 15.4' },
      { d: 'M111.8 31.7L111.5 14.6L95.4 12.3' },
    ],
  },
  spark: {
    viewBox: '0 0 40 40',
    place: 'free',
    paths: [
      { d: 'M20.4 4.5C20 12 20.2 15.8 19.6 21' },
      { d: 'M8.5 13.6C13.4 15.8 16 17 19.6 21' },
      { d: 'M31.4 12.6C27 15.9 24 18.3 19.6 21' },
    ],
  },
  zigzag: {
    viewBox: '0 0 200 20',
    place: 'under',
    paths: [
      { d: 'M3 12L17 6L31 13L46 6L61 13L76 6L91 13L106 6L121 13L136 6L151 13L166 6L181 13L196 7' },
    ],
  },
};

interface Props {
  kind: ScribbleKind;
  className?: string;
  style?: CSSProperties;
  /** Momento (ms) dentro de su grupo de entrada; sin grupo, desde que aparece. */
  at?: number;
  /** Grosor del trazo en unidades del dibujo (el subrayado mide 200 de ancho). */
  weight?: number;
}

export function Scribble({ kind, className, style, at, weight = 2.6 }: Props) {
  const s = SHAPES[kind];
  return (
    <svg
      aria-hidden
      viewBox={s.viewBox}
      preserveAspectRatio={s.place === 'free' ? 'xMidYMid meet' : 'none'}
      className={cn('scribble', `scribble--${s.place}`, className)}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {s.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          pathLength={1}
          strokeWidth={(p.w ?? 1) * weight}
          opacity={p.o}
          data-reveal="draw"
          data-reveal-at={at != null ? at + i * 260 : undefined}
        />
      ))}
    </svg>
  );
}

/**
 * Una palabra marcada a mano: subrayada, encerrada en un círculo o resaltada. Hereda la letra del
 * titular; el trazo va en el color de las notas.
 */
export function Marked({
  children,
  kind = 'underline',
  at,
  className,
}: {
  children: React.ReactNode;
  kind?: ScribbleKind;
  at?: number;
  className?: string;
}) {
  return (
    <span className={cn('marked', `marked--${kind}`, className)}>
      {children}
      <Scribble kind={kind} at={at} />
    </span>
  );
}
