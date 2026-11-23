import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { books, getBook, getCategory, relatedBooks } from '@/data/books';
import { getRazones } from '@/data/razones';
import { getStockMap, isAvailable } from '@/lib/stock';
import { BookHero } from '@/components/libro/BookHero';
import { BookReasons } from '@/components/libro/BookReasons';
import { BookReviews } from '@/components/libro/BookReviews';
import { RelatedBooks } from '@/components/libro/RelatedBooks';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { bookReviews } from '@/lib/reviews';
import { getBookCover } from '@/lib/bookImage';
import { JsonLd, bookJsonLd, breadcrumbJsonLd, pageSeo } from '@/lib/seo';

type Params = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return books.map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const book = getBook((await params).id);
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

export default async function LibroPage({ params }: Params) {
  const book = getBook((await params).id);
  if (!book) notFound();

  // Sin stock: la página no existe hasta que se carguen unidades en el panel.
  const stock = await getStockMap();
  const units = stock[book.id];
  if (!isAvailable(units)) notFound();
  const available = books.filter((b) => isAvailable(stock[b.id]));

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
            { name: book.title, path: `/catalogo/${book.id}` },
          ]),
        ]}
      />
      <BookHero
        book={book}
        category={getCategory(book.category)}
        next={reasons || hasReviews ? 'cream' : 'orange'}
        units={units ?? null}
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
