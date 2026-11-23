import Link from 'next/link';
import type { CSSProperties } from 'react';

interface FilterChipProps {
  href: string;
  label: string;
  /** La página en la que estás (queda rellena). */
  active?: boolean;
}

/** Pastilla outline cream sobre rust; hover (o activa) rellena en cream con texto rust. Alto táctil de 44 px en celular. */
export function FilterChip({ href, label, active = false }: FilterChipProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`btn h-11 w-full border-[1.5px] border-cream px-3 text-[12px] md:h-[34px] md:w-auto md:px-3.5 ${
        active ? 'bg-cream text-brick' : 'text-cream hover:bg-cream hover:text-brick'
      }`}
      style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
    >
      {label}
    </Link>
  );
}
