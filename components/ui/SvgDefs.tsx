/** Definiciones SVG compartidas (patrón a cuadros de las pegatinas). */
export function SvgDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute" focusable="false">
      <defs>
        <pattern id="bdl-checker" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(12)">
          <rect width="12" height="12" style={{ fill: 'var(--color-cream)' }} />
          <rect width="6" height="6" style={{ fill: 'var(--color-rust)' }} />
          <rect x="6" y="6" width="6" height="6" style={{ fill: 'var(--color-rust)' }} />
        </pattern>
      </defs>
    </svg>
  );
}
