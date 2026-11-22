/** Estrellas de solo lectura (ej. 4 de 5). Admite medias: 4,5 pinta la quinta a la mitad. */
export function StarRating({ value, size = 16, className = '' }: { value: number; size?: number; className?: string }) {
  const label = `${String(value).replace('.', ',')} de 5 estrellas`;
  return (
    <span role="img" aria-label={label} className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <svg key={n} aria-hidden="true" viewBox="0 0 24 24" width={size} height={size}>
            <defs>
              <linearGradient id={`star-${n}-${Math.round(fill * 100)}`}>
                <stop offset={`${fill * 100}%`} stopColor="var(--color-mustard)" />
                <stop offset={`${fill * 100}%`} stopColor="var(--color-beige)" />
              </linearGradient>
            </defs>
            <path
              fill={`url(#star-${n}-${Math.round(fill * 100)})`}
              stroke="var(--color-forest)"
              strokeWidth="1.2"
              d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
            />
          </svg>
        );
      })}
    </span>
  );
}
