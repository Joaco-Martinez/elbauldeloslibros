interface CircularTextProps {
  text: string;
  id: string;
  /** Tamaño del viewBox. */
  size?: number;
  fontSize?: number;
  spin?: boolean;
  className?: string;
  /** Color del texto (por defecto crema). */
  color?: string;
  /** Distancia del texto al borde (en unidades del viewBox). */
  inset?: number;
}

/** Texto en loop alrededor de un círculo, decorativo. */
export function CircularText({
  text,
  id,
  size = 460,
  fontSize = 22,
  spin = true,
  className = '',
  color = 'var(--color-cream)',
  inset = 14,
}: CircularTextProps) {
  const c = size / 2;
  const r = c - fontSize - inset;
  const circumference = 2 * Math.PI * r;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox={`0 0 ${size} ${size}`}
      className={`${spin ? 'spin-slow' : ''} ${className}`}
    >
      <defs>
        <path id={id} d={`M ${c},${c} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`} />
      </defs>
      <text
        textLength={circumference}
        lengthAdjust="spacing"
        style={{
          fill: color,
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize,
          letterSpacing: '0.04em',
        }}
      >
        <textPath href={`#${id}`}>{text}</textPath>
      </text>
    </svg>
  );
}
