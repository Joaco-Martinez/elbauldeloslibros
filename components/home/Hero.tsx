import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getBook, type Book } from '@/data/books';
import { getStockMap, isAvailable } from '@/lib/stock';
import { BookImage } from '@/components/ui/BookImage';
import { Button } from '@/components/ui/Button';
import { CircularText } from '@/components/ui/CircularText';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

// Espacios "duros" ( ) alrededor de los puntos: el último espacio del círculo no se pierde
// y la unión "país • El Baul" queda igual que las demás.
const RING_TEXT = 'El Baul de los Libros • Envíos a todo el país • El Baul de los Libros • Envíos a todo el país • '.replace(
  / • /g,
  '  •  ',
);

/**
 * Los tres libros del círculo (izquierda, centro, derecha). Para cambiarlos, cambiá los ids.
 * Si alguno se queda sin stock, simplemente no aparece.
 */
const HERO_BOOKS: { id: string; className: string }[] = [
  { id: 'el-alquimista', className: 'z-10 w-[33%] -rotate-3' },
  { id: 'habitos-atomicos', className: 'z-20 w-[38%]' },
  { id: 'el-poder-del-ahora', className: 'z-10 w-[31%] rotate-3' },
];

async function HeroCircle() {
  const stock = await getStockMap();
  const heroBooks = HERO_BOOKS.flatMap(({ id, className }) => {
    const book = getBook(id);
    return book && isAvailable(stock[id]) ? [{ book, className }] : ([] as { book: Book; className: string }[]);
  });

  return (
    <div className="relative aspect-square w-[300px] md:w-[340px] lg:w-[460px]">
      <div className="absolute inset-0 rounded-full bg-forest" />
      <CircularText id="hero-ring" text={RING_TEXT} className="absolute inset-0 h-full w-full" />

      {/* Tres libros reales parados, agrupados como los frascos de la referencia.
          El grupo se centra en el círculo (por su alto real), apoyado sobre la misma base. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex w-[70%] translate-x-[1%] items-end justify-center -space-x-[4%]">
        <span className="contact-shadow !bottom-[-6%] !h-[12%] !w-[110%]" aria-hidden="true" />
        {heroBooks.map(({ book, className }) => (
          <Link
            key={book.id}
            href={`/catalogo/${book.id}`}
            className={`focus-ring group relative block rounded-[3px] transition-transform duration-300 hover:-translate-y-2 ${className}`}
            style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
            aria-label={`${book.title}${book.author ? `, de ${book.author}` : ''}`}
          >
            {/* Canto de páginas, como los libros del logo */}
            <span aria-hidden="true" className="absolute inset-0 translate-x-[6%] translate-y-[2%] rounded-[3px] bg-cream" />
            <BookImage book={book} priority sizes="(min-width: 1024px) 170px, 120px" className="relative w-full" />
          </Link>
        ))}
        </div>
      </div>

      <Sticker variant="sun" size={56} rotate={-12} className="-left-4 top-[6%] lg:-left-6" />
      <Sticker variant="checker" size={56} rotate={10} className="-right-2 top-[2%] lg:right-[2%]" delay={1.2} />
      <Sticker variant="pinwheel" size={48} rotate={-8} className="-right-3 bottom-[6%] lg:right-[1%]" delay={2.4} />
    </div>
  );
}

export function Hero() {
  return (
    <>
      <section aria-labelledby="hero-title" className="relative bg-brick text-cream">
        <div className="container-site grid items-center gap-y-12 pb-12 pt-6 md:grid-cols-12 md:gap-x-6 md:pb-14 md:pt-8 lg:min-h-[600px] lg:pb-16">
          <div className="md:col-span-6">
            <h1 id="hero-title" className="display t-hero">
              Abrí el
              <br />
              baúl.
            </h1>
            <p className="lede mt-5 md:mt-6">
              Libros nuevos, elegidos uno por uno y enviados a tu casa, en cualquier punto del país.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button href="/catalogo" variant="gold" className="h-12 px-6 text-[15px]">
                Ver el catálogo
              </Button>
              <Button href="/#recomendados" variant="outline" className="h-12 px-6 text-[15px] text-cream">
                Elegidos del mes
              </Button>
            </div>
            {/* Los tres motivos para comprar acá, a la vista desde el principio. */}
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-bold md:text-[14px]">
              {['10% off pagando con transferencia', 'Envíos a todo el país', 'Sale el mismo día'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden="true" className="grid h-5 w-5 place-items-center rounded-full bg-mustard text-[11px] text-forest">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center md:col-span-6 md:justify-end">
            <HeroCircle />
          </div>
        </div>
      </section>
      <WaveDivider top="brick" band="orange" bottom="forest" />
    </>
  );
}
