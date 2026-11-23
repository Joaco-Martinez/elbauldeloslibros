import Link from 'next/link';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

/** Cada palabra lleva a su sección del catálogo (antes era solo decorativa y parecía un menú que no andaba). */
const GENRES: { label: string; id: string }[] = [
  { label: 'Desarrollo personal', id: 'desarrollo' },
  { label: 'Finanzas', id: 'finanzas' },
  { label: 'Negocios', id: 'finanzas' },
  { label: 'Filosofía', id: 'filosofia' },
  { label: 'Espiritualidad', id: 'espiritualidad' },
  { label: 'Romance', id: 'romance' },
  { label: 'Thriller', id: 'thriller' },
];

function Row({ hidden }: { hidden?: boolean }) {
  // Se repite dos veces para cubrir pantallas anchas. Solo la primera vuelta se puede recorrer con el teclado
  // (las copias son para que la franja no se corte).
  const items = [...GENRES, ...GENRES];
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((genre, i) => {
        const copy = hidden || i >= GENRES.length;
        return (
          <li key={`${genre.label}-${i}`} className="flex items-center" aria-hidden={copy || undefined}>
            <Link
              href={`/catalogo#${genre.id}`}
              tabIndex={copy ? -1 : undefined}
              className="display t-marquee focus-ring whitespace-nowrap rounded-md px-4 decoration-mustard decoration-4 underline-offset-8 hover:underline md:px-6"
              style={{ '--ring': 'var(--color-cream)' } as React.CSSProperties}
            >
              {genre.label}
            </Link>
            <Sticker variant="sun" size={30} inline plain float={false} />
          </li>
        );
      })}
    </ul>
  );
}

export function Marquee() {
  return (
    <>
      <nav aria-label="Géneros que vendemos" className="overflow-hidden bg-forest py-5 text-cream md:py-6">
        <div className="marquee-track flex w-max">
          <Row />
          <Row hidden />
        </div>
      </nav>
      <WaveDivider top="forest" bottom="orange" variant={1} />
    </>
  );
}
