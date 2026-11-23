import { CircularText } from '@/components/ui/CircularText';

/**
 * Sello redondo "TAPA DURA • TAPA DURA •" (texto girando) para la página del libro,
 * pegado a la esquina del panel. Mismo estilo que el círculo del inicio y los stickers.
 */
export function FormatSeal({
  formato,
  className = '',
}: {
  formato: string;
  className?: string;
}) {
  const label = formato.toUpperCase();
  // Se repite para dar la vuelta completa (con nbsp alrededor de los puntos, como en el inicio).
  const text = `${label}  •  ${label}  •  `;
  const hard = formato === 'Tapa dura';
  return (
    <div
      role="img"
      aria-label={`Edición: ${formato}`}
      className={`pointer-events-none absolute z-20 aspect-square w-[92px] -rotate-6 md:w-[108px] ${className}`}
    >
      <div className={`absolute inset-0 rounded-full border-[2.5px] border-forest bg-cream shadow-[0_6px_0_rgb(0_0_0/0.18)]`} />
      <div className="absolute inset-[7px] rounded-full border-[1.5px] border-dashed border-forest" />
      <CircularText
        id={`sello-${hard ? 'dura' : 'blanda'}`}
        text={text}
        size={120}
        fontSize={formato.length > 10 ? 11 : 13}
        inset={10}
        color="var(--color-forest)"
        className="absolute inset-0 h-full w-full"
      />
      {/* Centro: un libro que se abre y se cierra (la tapa gira sobre el lomo). Tapa dura: tapa con borde más grueso. */}
      <svg viewBox="0 0 40 40" aria-hidden="true" className="seal-book absolute inset-[30%] h-auto w-[40%]">
        {/* Contratapa (mitad derecha; asoma alrededor de la hoja) */}
        <rect x="20" y="9" width="17" height="24" rx="2" fill="var(--color-forest)" />
        {/* Hoja derecha */}
        <rect x="20" y="10.5" width="15" height="21" rx="1" fill="var(--color-cream)" />
        <path d="M23 15h9M23 18.5h9M23 22h9M23 25.5h6" stroke="var(--color-forest)" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
        {/* Tapa delantera: cerrada tapa la hoja derecha; abierta queda a la izquierda mostrando la otra hoja */}
        <g className="seal-book__cover">
          <rect x="3" y="9" width="17" height="24" rx="2" fill="var(--color-forest)" />
          <rect x="5" y="10.5" width="15" height="21" rx="1" fill="var(--color-cream)" />
          <path d="M8 15h9M8 18.5h9M8 22h9M8 25.5h6" stroke="var(--color-forest)" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
          <g className="seal-book__front">
            <rect x="3" y="9" width="17" height="24" rx="2" fill={hard ? 'var(--color-brick)' : 'var(--color-forest)'} />
            <rect
              x={hard ? 5.5 : 5}
              y={hard ? 11.5 : 11}
              width={hard ? 12 : 13}
              height={hard ? 19 : 20}
              rx="1"
              fill="none"
              stroke="var(--color-mustard)"
              strokeWidth={hard ? 1.6 : 1}
            />
          </g>
        </g>
        {/* Lomo */}
        <rect x="19" y="9" width="2" height="24" fill="var(--color-ink)" opacity=".35" />
      </svg>
    </div>
  );
}
