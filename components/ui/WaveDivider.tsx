import { toneVar, type Tone } from '@/lib/tokens';

/**
 * Ondas irregulares (no sinusoidales): crestas desiguales, ~300–450px de longitud de onda
 * a 1440px. Se cierran muy por debajo del viewBox para poder desplazarlas.
 */
const SHAPES = [
  'M0,34 C110,14 220,8 340,24 C470,42 560,58 700,46 C830,35 905,12 1050,18 C1190,24 1290,50 1440,32 L1440,400 L0,400 Z',
  'M0,26 C140,44 250,54 380,38 C500,24 590,8 740,16 C880,24 960,50 1100,44 C1230,38 1330,16 1440,28 L1440,400 L0,400 Z',
  'M0,44 C90,26 180,12 300,20 C430,30 500,54 640,52 C780,50 860,20 1000,14 C1130,9 1240,36 1440,22 L1440,400 L0,400 Z',
];

interface WaveDividerProps {
  /** Color de la sección de arriba. */
  top: Tone;
  /** Color de la sección de abajo. */
  bottom: Tone;
  /** Banda intermedia opcional (doble capa). */
  band?: Tone;
  /** Segunda banda opcional. */
  band2?: Tone;
  variant?: 0 | 1 | 2;
  flip?: boolean;
}

export function WaveDivider({ top, bottom, band, band2, variant = 0, flip = false }: WaveDividerProps) {
  const d = SHAPES[variant];
  const layers = [band, band2].filter(Boolean) as Tone[];
  const BAND = 22;
  const viewH = 72 + layers.length * BAND;
  const heightClass =
    layers.length === 0
      ? 'h-8 md:h-12 lg:h-16'
      : layers.length === 1
        ? 'h-11 md:h-[60px] lg:h-[84px]'
        : 'h-14 md:h-[76px] lg:h-[104px]';

  return (
    <div
      aria-hidden="true"
      className={`relative z-10 -my-px block w-full ${heightClass}`}
      style={{ backgroundColor: toneVar(top) }}
    >
      <svg
        viewBox={`0 0 1440 ${viewH}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-[calc(100%+2px)] w-full overflow-hidden"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
        focusable="false"
      >
        {layers.map((tone, i) => (
          <path key={tone + i} d={d} style={{ fill: toneVar(tone) }} transform={`translate(0,${6 + i * BAND})`} />
        ))}
        <path d={d} style={{ fill: toneVar(bottom) }} transform={`translate(0,${6 + layers.length * BAND})`} />
      </svg>
    </div>
  );
}
