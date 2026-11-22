import type { CSSProperties } from 'react';

interface FilterChipProps {
  href: string;
  label: string;
}

/** Pastilla outline cream sobre rust; hover rellena en cream con texto rust. */
export function FilterChip({ href, label }: FilterChipProps) {
  return (
    <a
      href={href}
      className="btn h-9 w-full border-[1.5px] border-cream px-3 text-[12px] text-cream hover:bg-cream hover:text-brick md:h-[30px] md:w-auto md:px-3.5"
      style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
    >
      {label}
    </a>
  );
}
