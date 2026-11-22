import { isDarkTone, toneVar, type Tone } from '@/lib/tokens';

export interface BookCoverProps {
  title: string;
  author?: string;
  color: Tone;
  accent?: Tone;
  /** Relación ancho / alto. */
  ratio?: number;
  /** Mostrar textos (en libros muy chicos se pueden ocultar). */
  showText?: boolean;
  /** Sin el canto de páginas dibujado (para el libro 3D, que tiene canto real). */
  flat?: boolean;
  className?: string;
}

/**
 * Portada ilustrada de placeholder: lomo más oscuro, canto de páginas cream,
 * textura de tela y banda ondulada. El ancho lo define el contenedor.
 * Reemplazable por <Image> sin tocar ProductCard.
 */
export function BookCover({
  title,
  author,
  color,
  accent = 'mustard',
  ratio = 0.68,
  showText = true,
  flat = false,
  className = '',
}: BookCoverProps) {
  const fg = isDarkTone(color) ? 'var(--color-cream)' : 'var(--color-forest)';

  return (
    <div
      role="img"
      aria-label={`Portada de ${title}${author ? `, de ${author}` : ''}`}
      className={`book-cover relative ${className}`}
      style={{ aspectRatio: `${ratio}` }}
    >
      {/* Canto de páginas */}
      {!flat && (
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-x-[5%] translate-y-[2%] rounded-[3px] bg-cream"
        style={{ boxShadow: 'inset -2px 0 0 color-mix(in srgb, var(--color-cream) 80%, var(--color-leather))' }}
      />
      )}
      {/* Tapa */}
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-[3px]"
        style={{ backgroundColor: toneVar(color) }}
      >
        <span
          className="absolute inset-y-0 left-0 w-[9%]"
          style={{ backgroundColor: `color-mix(in srgb, ${toneVar(color)} 78%, #000)` }}
        />
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          className="absolute left-[9%] right-0 top-[60%] h-[13%] w-[91%]"
          focusable="false"
        >
          <path d="M0,8 C15,1 28,1 42,7 C58,14 72,14 86,7 C92,4 96,4 100,5 L100,20 L0,20 Z" style={{ fill: toneVar(accent) }} />
        </svg>
        <span
          className="absolute left-[9%] right-0 top-[73%] h-[5%]"
          style={{ backgroundColor: toneVar(accent) }}
        />
        <span className="book-noise absolute inset-0" />
      </span>
      {showText && (
        <span aria-hidden="true" className="absolute inset-0 rounded-[3px]" style={{ color: fg }}>
          <span className="display absolute left-[18%] right-[8%] top-[11%] block text-[15cqw] leading-[0.92] [overflow-wrap:anywhere]">
            {title}
          </span>
          {author && (
            <span className="absolute bottom-[7%] left-[18%] right-[8%] block truncate font-body text-[7cqw] font-medium">
              {author}
            </span>
          )}
        </span>
      )}
    </div>
  );
}
