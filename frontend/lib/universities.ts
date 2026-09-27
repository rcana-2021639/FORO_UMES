/**
 * Identidad de color de cada universidad, medida en su sitio oficial (colores pintados en
 * pantalla, ponderados por área) y contrastada con su bandera/escudo cuando la hay. Solo se usa
 * en lo que *es* de esa universidad: su perfil y su losa al pasar el cursor. El resto del sitio es
 * neutro. Ver DESIGN_NOTES.md §20.
 *
 * - `surface`: fondo de la cabecera del perfil; texto `onSurface` encima (≥ 7:1 en todas).
 * - `primary`: el color de marca tal cual (muestras, líneas, detalles).
 * - `accent`: segundo color institucional; solo detalle o insignia con `onAccent` (≥ 4.5:1).
 * - `text`: el color de marca apto para texto sobre piedra (≥ 5.4:1).
 */
export interface UniversityBrand {
  primary: string;
  surface: string;
  onSurface: string;
  accent: string;
  onAccent: string;
  text: string;
  names: { primary: string; accent: string };
}

const BRANDS: Record<string, UniversityBrand> = {
  USAC: {
    primary: '#001d5e',
    surface: '#001d5e',
    onSurface: '#ffffff',
    accent: '#c9a227',
    onAccent: '#1c1b19',
    text: '#001d5e',
    names: { primary: 'Azul marino', accent: 'Oro del escudo' },
  },
  URL: {
    primary: '#150f5d',
    surface: '#150f5d',
    onSurface: '#ffffff',
    accent: '#ffc61f',
    onAccent: '#1c1b19',
    text: '#150f5d',
    names: { primary: 'Índigo', accent: 'Amarillo' },
  },
  UVG: {
    primary: '#078b45',
    surface: '#05653a',
    onSurface: '#ffffff',
    accent: '#93bb4e',
    onAccent: '#1c1b19',
    text: '#05653a',
    names: { primary: 'Verde', accent: 'Verde hoja' },
  },
  UMG: {
    primary: '#003168',
    surface: '#003168',
    onSurface: '#ffffff',
    accent: '#a1252b',
    onAccent: '#ffffff',
    text: '#003168',
    names: { primary: 'Azul', accent: 'Rojo' },
  },
  UNIS: {
    primary: '#540013',
    surface: '#540013',
    onSurface: '#ffffff',
    accent: '#efa800',
    onAccent: '#1c1b19',
    text: '#540013',
    names: { primary: 'Corinto', accent: 'Oro' },
  },
  UPANA: {
    primary: '#001b42',
    surface: '#001b42',
    onSurface: '#ffffff',
    accent: '#9fd140',
    onAccent: '#1c1b19',
    text: '#001b42',
    names: { primary: 'Azul marino', accent: 'Lima' },
  },
  UMES: {
    primary: '#0a4735',
    surface: '#0a4735',
    onSurface: '#ffffff',
    accent: '#e6deca',
    onAccent: '#1c1b19',
    text: '#0a4735',
    names: { primary: 'Verde bosque', accent: 'Arena' },
  },
  GALILEO: {
    primary: '#041b64',
    surface: '#041b64',
    onSurface: '#ffffff',
    accent: '#b89a59',
    onAccent: '#1c1b19',
    text: '#041b64',
    names: { primary: 'Azul marino', accent: 'Dorado' },
  },
  UNI: {
    primary: '#006c8f',
    surface: '#005a78',
    onSurface: '#ffffff',
    accent: '#ee6946',
    onAccent: '#1c1b19',
    text: '#005a78',
    names: { primary: 'Petróleo', accent: 'Naranja' },
  },
};

/** Grafito del Foro para universidades nuevas que aún no tienen identidad registrada aquí. */
const FALLBACK: UniversityBrand = {
  primary: '#45423d',
  surface: '#1c1b19',
  onSurface: '#f6f4f0',
  accent: '#ccc3f0',
  onAccent: '#1c1b19',
  text: '#1c1b19',
  names: { primary: 'Grafito', accent: 'Nácar' },
};

export function brandOf(acronym?: string | null): UniversityBrand {
  if (!acronym) return FALLBACK;
  return BRANDS[acronym.trim().toUpperCase()] ?? FALLBACK;
}

/** Variables CSS listas para `style`: los componentes leen `var(--u-*)`. */
export function brandVars(acronym?: string | null): React.CSSProperties {
  const b = brandOf(acronym);
  return {
    '--u-primary': b.primary,
    '--u-surface': b.surface,
    '--u-on-surface': b.onSurface,
    '--u-accent': b.accent,
    '--u-on-accent': b.onAccent,
    '--u-text': b.text,
  } as React.CSSProperties;
}
