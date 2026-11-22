import type { CSSProperties } from 'react';

export type StickerVariant = 'sun' | 'checker' | 'pinwheel' | 'flower';

interface StickerProps {
  variant: StickerVariant;
  /** Ancho en px en desktop (en mobile se reduce al 72%). */
  size?: number;
  /** Rotación en grados (-15 a 15). */
  rotate?: number;
  /** Posicionamiento absoluto (top/left/etc). */
  className?: string;
  float?: boolean;
  /** Retraso de la animación, en segundos. */
  delay?: number;
  /** Para usar en línea (ej. separador de la marquesina). */
  inline?: boolean;
  /** Sin contorno cream de troquel. */
  plain?: boolean;
}

const C = {
  cream: { fill: 'var(--color-cream)' },
  rust: { fill: 'var(--color-rust)' },
  orange: { fill: 'var(--color-orange)' },
  mustard: { fill: 'var(--color-mustard)' },
};

function starPoints(n: number, rOut: number, rIn: number) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const ring = (count: number, dist: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = (Math.PI * 2 * i) / count - Math.PI / 2;
    return { cx: 50 + dist * Math.cos(a), cy: 50 + dist * Math.sin(a) };
  });

const SUN = starPoints(12, 44, 32);
const PETALS_8 = ring(8, 27);
const PETALS_5 = ring(5, 21);

function wedge(i: number, total: number, r: number) {
  const a0 = (Math.PI * 2 * i) / total - Math.PI / 2;
  const a1 = (Math.PI * 2 * (i + 1)) / total - Math.PI / 2;
  const p = (a: number) => `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`;
  return `M50,50 L${p(a0)} A${r},${r} 0 0 1 ${p(a1)} Z`;
}

function Shape({ variant, plain }: { variant: StickerVariant; plain: boolean }) {
  const outline = !plain;
  switch (variant) {
    case 'sun':
      return (
        <>
          {outline && (
            <polygon points={SUN} style={C.cream} stroke="var(--color-cream)" strokeWidth="12" strokeLinejoin="round" />
          )}
          <polygon points={SUN} style={C.mustard} stroke="var(--color-mustard)" strokeWidth="5" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="17" style={C.orange} />
        </>
      );
    case 'checker':
      return (
        <>
          {outline && (
            <g style={C.cream} stroke="var(--color-cream)" strokeWidth="7">
              {PETALS_8.map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="15" />
              ))}
              <circle cx="50" cy="50" r="25" />
            </g>
          )}
          <g fill="url(#bdl-checker)">
            {PETALS_8.map((p, i) => (
              <circle key={i} cx={p.cx} cy={p.cy} r="15" />
            ))}
            <circle cx="50" cy="50" r="25" />
          </g>
        </>
      );
    case 'pinwheel':
      return (
        <>
          {outline && <circle cx="50" cy="50" r="48" style={C.cream} />}
          <circle cx="50" cy="50" r="44" style={C.orange} />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d={wedge(i, 8, 36)} style={i % 2 === 0 ? C.cream : C.orange} />
          ))}
          <circle cx="50" cy="50" r="5" style={C.cream} />
        </>
      );
    case 'flower':
      return (
        <>
          {outline && (
            <g style={C.cream} stroke="var(--color-cream)" strokeWidth="8">
              {PETALS_5.map((p, i) => (
                <circle key={i} cx={p.cx} cy={p.cy} r="17" />
              ))}
            </g>
          )}
          <g style={C.rust}>
            {PETALS_5.map((p, i) => (
              <circle key={i} cx={p.cx} cy={p.cy} r="17" />
            ))}
          </g>
          <circle cx="50" cy="50" r="11" style={C.mustard} />
        </>
      );
  }
}

export function Sticker({
  variant,
  size = 44,
  rotate = 0,
  className = '',
  float = true,
  delay = 0,
  inline = false,
  plain = false,
}: StickerProps) {
  const style = { '--s': `${size}px`, '--r': `${rotate}deg`, '--d': `${delay}s` } as CSSProperties;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="-6 -6 112 112"
      className={`sticker ${inline ? 'sticker--inline' : ''} ${float && !inline ? 'sticker--float' : ''} ${className}`}
      style={style}
    >
      <Shape variant={variant} plain={plain} />
    </svg>
  );
}
