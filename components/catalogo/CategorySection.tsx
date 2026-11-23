import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Book, Category } from '@/data/books';
import { ProductCard } from '@/components/ui/ProductCard';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { lowStockBadge } from '@/lib/stockBadge';
import { bgTone, isDarkTone } from '@/lib/tokens';

interface CategorySectionProps {
  category: Category;
  books: Book[];
  /** Unidades por libro, para el "¡Quedan X!". */
  stock?: Record<string, number | null>;
  /** Cuántas tarjetas mostrar; si hay más, aparece "Ver los N de …". Sin límite: todas. */
  limit?: number;
}

/**
 * Sección de un género en el catálogo: el fondo es el color del género (el que se elige en Panel → Secciones)
 * y las tarjetas son claras, así la tapa es la protagonista.
 */
export function CategorySection({ category, books, stock = {}, limit }: CategorySectionProps) {
  const headingId = `${category.id}-title`;
  const dark = isDarkTone(category.tone);
  const shown = limit ? books.slice(0, limit) : books;
  const more = books.length - shown.length;

  return (
    <section id={category.id} aria-labelledby={headingId} className={`section-pad ${bgTone[category.tone]}`}>
      <div className="container-site">
        <SectionHeading
          id={headingId}
          as="h3"
          size="t-category"
          title={category.label}
          titleClassName={dark ? 'text-cream' : 'text-forest'}
          subtitle={category.blurb}
          subtitleClassName={dark ? 'text-cream' : 'text-ink'}
          action={
            more > 0 ? (
              <Link
                href={`/catalogo/${category.id}`}
                className={`focus-ring rounded-sm text-[14px] font-bold underline decoration-2 underline-offset-4 ${dark ? 'text-cream' : 'text-forest'}`}
                style={{ '--ring': dark ? 'var(--color-cream)' : 'var(--color-forest)' } as CSSProperties}
              >
                Ver los {books.length} →
              </Link>
            ) : undefined
          }
        />
        <Reveal className="mt-7 md:mt-9">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
            {shown.map((book) => (
              <li key={book.id}>
                <ProductCard book={book} showGenre={false} badge={lowStockBadge(stock[book.id])} />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
