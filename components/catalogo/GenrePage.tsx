import Link from 'next/link';
import type { CSSProperties } from 'react';
import { booksInCategory, categories, oneCardPerTitle, type Book, type Category } from '@/data/books';
import { CatalogHero } from '@/components/catalogo/CatalogHero';
import { ProductCard } from '@/components/ui/ProductCard';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { JsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { bgTone, isDarkTone } from '@/lib/tokens';

export const SORTS = [
  { id: 'recomendados', label: 'Recomendados' },
  { id: 'menor-precio', label: 'Menor precio' },
  { id: 'mayor-precio', label: 'Mayor precio' },
  { id: 'a-z', label: 'A–Z' },
] as const;
export type SortId = (typeof SORTS)[number]['id'];

function sortBooks(list: Book[], sort: SortId) {
  const copy = [...list];
  if (sort === 'menor-precio') copy.sort((a, b) => a.precioTransferencia - b.precioTransferencia);
  if (sort === 'mayor-precio') copy.sort((a, b) => b.precioTransferencia - a.precioTransferencia);
  if (sort === 'a-z') copy.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  return copy;
}

interface GenrePageProps {
  category: Category;
  /** Libros con stock (de todos los géneros). */
  available: Book[];
  stock: Record<string, number | null>;
  sort: SortId;
}

/** /catalogo/<género>: todos los libros de ese género, con orden (el orden va en la dirección, así se puede compartir). */
export function GenrePage({ category, available, stock, sort }: GenrePageProps) {
  const withStock = categories.filter((c) => booksInCategory(c.id, available).length > 0);
  const list = sortBooks(oneCardPerTitle(booksInCategory(category.id, available)), sort);
  const dark = isDarkTone(category.tone);
  const ink = dark ? 'text-cream' : 'text-forest';

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Catálogo', path: '/catalogo' },
          { name: category.label, path: `/catalogo/${category.id}` },
        ])}
      />
      <CatalogHero categories={withStock} current={category} next={category.tone} />
      <section aria-label={`Libros de ${category.label}`} className={`section-pad ${bgTone[category.tone]}`}>
        <div className="container-site">
          <div className={`flex flex-wrap items-center justify-between gap-3 ${ink}`}>
            <p className="text-[14px] font-bold">
              {list.length === 1 ? '1 libro' : `${list.length} libros`}
            </p>
            <nav aria-label="Ordenar" className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
              <span>Ordenar:</span>
              {SORTS.map((s) => (
                <Link
                  key={s.id}
                  href={s.id === 'recomendados' ? `/catalogo/${category.id}` : `/catalogo/${category.id}?orden=${s.id}`}
                  scroll={false}
                  aria-current={sort === s.id ? 'true' : undefined}
                  className={`focus-ring inline-flex h-11 items-center rounded-full border-[1.5px] px-3.5 md:h-9 ${
                    dark ? 'border-cream' : 'border-forest'
                  } ${sort === s.id ? (dark ? 'bg-cream text-ink' : 'bg-forest text-cream') : ''}`}
                  style={{ '--ring': dark ? 'var(--color-cream)' : 'var(--color-forest)' } as CSSProperties}
                >
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>
          {list.length > 0 ? (
            <ul className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
              {list.map((book) => (
                <li key={book.id}>
                  {/* Sin "¡Quedan X!" acá (igual que en el catálogo): con casi todo en 1 ejemplar aparecería en todas. */}
                  <ProductCard book={book} showGenre={false} />
                </li>
              ))}
            </ul>
          ) : (
            <p className={`mt-7 text-[15px] font-medium ${ink}`}>
              Por ahora no hay libros de este género.{' '}
              <Link href="/catalogo" className="font-bold underline underline-offset-2">
                Ver todo el catálogo
              </Link>
            </p>
          )}
        </div>
      </section>
      <WaveDivider top={category.tone} bottom="forest" variant={2} />
    </>
  );
}
