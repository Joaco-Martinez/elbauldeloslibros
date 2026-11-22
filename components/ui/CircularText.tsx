interface CircularTextProps {
  text: string;
  id: string;
  /** Tamaño del viewBox. */
  size?: number;
  fontSize?: number;
  spin?: boolean;
  className?: string;
}

/** Texto en loop alrededor de un círculo, decorativo. */
export function CircularText({ text, id, size = 460, fontSize = 22, spin = true, className = '' }: CircularTextProps) {
  const c = size / 2;
  const r = c - fontSize - 14;
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
          fill: 'var(--color-cream)',
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
