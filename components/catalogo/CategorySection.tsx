import type { Book, Category } from '@/data/books';
import { ProductCard } from '@/components/ui/ProductCard';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { lowStockBadge } from '@/lib/stockBadge';
import { bgTone } from '@/lib/tokens';

interface CategorySectionProps {
  category: Category;
  books: Book[];
  background: 'cream' | 'orange';
  /** Unidades por libro, para el "¡Quedan X!". */
  stock?: Record<string, number | null>;
}

const STYLES = {
  cream: { title: 'text-rust', blurb: 'text-ink' },
  // Crema sobre naranja da 2.1:1; verde bosque da 5.8:1.
  orange: { title: 'text-forest', blurb: 'text-forest' },
} as const;

export function CategorySection({ category, books, background, stock = {} }: CategorySectionProps) {
  const s = STYLES[background];
  const headingId = `${category.id}-title`;

  return (
    <section id={category.id} aria-labelledby={headingId} className={`section-pad ${bgTone[background]}`}>
      <div className="container-site">
        <SectionHeading
          id={headingId}
          as="h3"
          size="t-category"
          title={category.label}
          titleClassName={s.title}
          subtitle={category.blurb}
          subtitleClassName={s.blurb}
        />
        <Reveal className="mt-7 md:mt-9">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
            {books.map((book) => (
              <li key={book.id}>
                <ProductCard book={book} surface={background} badge={lowStockBadge(stock[book.id])} />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
