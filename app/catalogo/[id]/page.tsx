import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { books, categories, editionsOf, getBook, getCategory, oneCardPerTitle, relatedBooks } from '@/data/books';
import { GenrePage, SORTS } from '@/components/catalogo/GenrePage';
import { getRazones } from '@/data/razones';
import { getStockMap, isAvailable } from '@/lib/stock';
import { BookHero } from '@/components/libro/BookHero';
import { BookReasons } from '@/components/libro/BookReasons';
import { BookReviews } from '@/components/libro/BookReviews';
import { RelatedBooks } from '@/components/libro/RelatedBooks';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { loadCatalog } from '@/lib/catalog';
import { bookReviews } from '@/lib/reviews';
import { getBookCover } from '@/lib/bookImage';
import { JsonLd, bookJsonLd, breadcrumbJsonLd, pageSeo } from '@/lib/seo';

type Params = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** /catalogo/<id> es la página de un libro o, si el id es de un género, la página de ese género. */
const findCategory = (id: string) => categories.find((c) => c.id === id);

// Los libros y géneros del código se arman de antemano; los cargados en el panel, en el momento.
export function generateStaticParams() {
  return [...books.map((b) => ({ id: b.id })), ...categories.map((c) => ({ id: c.id }))];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await loadCatalog();
  const { id } = await params;
  const genre = findCategory(id);
  if (genre) {
    const title = `Libros de ${genre.label}`;
    const description = `${genre.blurb ? `${genre.blurb} ` : ''}Libros nuevos de ${genre.label.toLowerCase()} con envío a toda la Argentina.`;
    return { title, description, ...pageSeo(`/catalogo/${genre.id}`, { title, description }) };
  }
  const book = getBook(id);
  if (!book) return {};
  const title = book.author ? `${book.title}, de ${book.author}` : book.title;
  const description = `${book.sinopsis} Libro nuevo con envío a toda la Argentina.`;
  const cover = getBookCover(book);
  return {
    title,
    description,
    ...pageSeo(`/catalogo/${book.id}`, {
      title,
      description,
      ...(cover ? { image: { url: cover.src, alt: `Tapa de ${book.title}` } } : {}),
    }),
  };
}

export default async function LibroPage({ params, searchParams }: Params) {
  await loadCatalog();
  const { id } = await params;
  const stock = await getStockMap();

  const genre = findCategory(id);
  if (genre) {
    const raw = (await searchParams).orden;
    const sort = SORTS.find((s) => s.id === raw)?.id ?? 'recomendados';
    return <GenrePage category={genre} available={books.filter((b) => isAvailable(stock[b.id]))} stock={stock} sort={sort} />;
  }

  const book = getBook(id);
  if (!book) notFound();

  // Sin stock: la página no existe hasta que se carguen unidades en el panel.
  const units = stock[book.id];
  if (!isAvailable(units)) notFound();
  const inStock = books.filter((b) => isAvailable(stock[b.id]));
  // Ediciones del mismo título con stock (tapa blanda / tapa dura): selector en la página.
  const editions = editionsOf(book, inStock);
  // "Seguí leyendo": sin las otras ediciones de este libro, y una tarjeta por título.
  const available = oneCardPerTitle(inStock.filter((b) => !book.grupo || b.grupo !== book.grupo));

  const reasons = getRazones(book.id);
  const { reviews, average } = await bookReviews(book.id);
  const reviewsBlock = <BookReviews reviews={reviews} average={average} />;
  const hasReviews = reviews.length > 0;

  return (
    <>
      <JsonLd
        data={[
          bookJsonLd(book, reviews, average),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: 'Catálogo', path: '/catalogo' },
            { name: getCategory(book.category).label, path: `/catalogo/${book.category}` },
            { name: book.title, path: `/catalogo/${book.id}` },
          ]),
        ]}
      />
      <BookHero
        book={book}
        category={getCategory(book.category)}
        next={reasons || hasReviews ? 'cream' : 'orange'}
        units={units ?? null}
        editions={editions.length > 1 ? editions : undefined}
        rating={average !== null ? { average, count: reviews.length } : undefined}
      />
      {reasons ? (
        <BookReasons title={book.title} reasons={reasons}>
          {reviewsBlock}
        </BookReasons>
      ) : (
        hasReviews && (
          <>
            <section className="section-pad bg-cream">
              <div className="container-site">{reviewsBlock}</div>
            </section>
            <WaveDivider top="cream" bottom="orange" />
          </>
        )
      )}
      <RelatedBooks books={relatedBooks(book, 4, available)} stock={stock} />
    </>
  );
}
