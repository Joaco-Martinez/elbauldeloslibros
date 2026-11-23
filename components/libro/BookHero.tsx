import Link from 'next/link';
import { fullTitle, type Book, type Category } from '@/data/books';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { BuyNowButton } from '@/components/cart/BuyNowButton';
import { BookImage } from '@/components/ui/BookImage';
import { Attention } from '@/components/ui/Attention';
import { StarRating } from '@/components/ui/StarRating';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { formatPrice } from '@/lib/formatPrice';
import { bgTone, toneVar, type Tone } from '@/lib/tokens';
import { Book3D } from '@/components/ui/Book3D';
import { bookRatio } from '@/lib/bookImage';
import { getMomentos } from '@/data/momentos';
import { computeTotals } from '@/lib/pricing';
import { BuyBar } from './BuyBar';
import { FormatSeal } from './FormatSeal';
import type { CSSProperties } from 'react';

interface BookHeroProps {
  book: Book;
  category: Category;
  /** Color de la sección siguiente (para la onda). */
  next?: 'cream' | 'orange';
  /** Unidades en stock (null = sin controlar). Con 3 o menos se muestra "¡Quedan solo X!". */
  units?: number | null;
  /** Promedio de reseñas aprobadas (si hay). */
  rating?: { average: number; count: number };
  /** Otras ediciones con stock del mismo título (incluye esta), si hay más de una. */
  editions?: Book[];
}

const LOW_STOCK = 3;

/** El panel no puede ser del mismo color que el fondo del hero. */
const panelTone = (card: Tone): Tone => (card === 'brick' || card === 'rust' ? 'mustard' : card);

export function BookHero({ book, category, next = 'orange', units = null, rating, editions }: BookHeroProps) {
  const lowStock = units !== null && units > 0 && units <= LOW_STOCK;
  const ratio = bookRatio(book);
  const momentos = getMomentos(book.id);
  const transferPrice = computeTotals([{ id: book.id, qty: 1 }], 'transferencia').total;
  return (
    <>
      <section aria-labelledby="libro-title" className="bg-brick text-cream">
        <div className="container-site pb-12 pt-2 md:pb-14 md:pt-4 lg:pb-16">
          <nav aria-label="Estás en" className="text-[13px] font-medium">
            {/* Celular: solo volver a la categoría. Desde tablet: ruta completa. */}
            <Link
              href={`/catalogo#${category.id}`}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm font-bold underline-offset-4 hover:underline md:hidden"
              style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
            >
              <span aria-hidden="true">←</span> {category.label}
            </Link>
            <ol className="hidden flex-wrap items-center gap-x-2 gap-y-1 md:flex">
              <li>
                <Link href="/catalogo" className="focus-ring rounded-sm underline-offset-4 hover:underline">
                  Catálogo
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/catalogo#${category.id}`} className="focus-ring rounded-sm underline-offset-4 hover:underline">
                  {category.label}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="font-bold">
                {book.title}
              </li>
            </ol>
          </nav>

          {/* minmax(0, 1fr): la columna nunca crece más que la pantalla, aunque algo de adentro sea ancho. */}
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-y-10 md:grid-cols-12 md:items-center md:gap-x-6 lg:mt-10">
            {/* Libro grande sobre panel de color, como las tarjetas pero en tamaño ficha */}
            <div className="relative min-w-0 md:col-span-6 lg:col-span-5">
              <div
                className={`relative flex aspect-square items-end md:aspect-[4/5] justify-center rounded-[22px] px-[22%] pb-[17%] pt-[15%] md:rounded-[28px] ${bgTone[panelTone(book.colorDeTarjeta)]}`}
              >
                <div className="relative h-full" style={{ aspectRatio: `${ratio}` }}>
                  <span className="contact-shadow !-bottom-3 !h-6 !w-[115%]" aria-hidden="true" />
                  <Book3D
                    spineColor={toneVar(book.colorDePortada)}
                    ratio={ratio}
                    hard={book.formato === 'Tapa dura'}
                    className="relative z-10 h-full"
                  >
                    <BookImage
                      book={book}
                      priority
                      flat
                      sizes="(min-width: 1024px) 300px, (min-width: 768px) 30vw, 60vw"
                      className="h-full w-full"
                    />
                  </Book3D>
                </div>
              </div>
              <Sticker variant="sun" size={56} rotate={-12} className="-left-3 -top-4" />
              <Sticker variant="checker" size={52} rotate={10} className="-right-1 bottom-[10%] md:-right-3" delay={1.4} />
              {/* Sello con el formato (tapa blanda / tapa dura). */}
              {book.formato ? (
                <FormatSeal formato={book.formato} className="-right-3 -top-6 md:-right-5 md:-top-7" />
              ) : (
                <Sticker variant="flower" size={26} rotate={6} className="right-[14%] -top-2" delay={2.2} />
              )}
            </div>

            <div className="min-w-0 md:col-span-6 lg:col-span-6 lg:col-start-7">
              {/* En celular ya figura en el "← categoría" de arriba. */}
              <p className="hidden text-[13px] font-bold md:block">{category.label}</p>
              <h1 id="libro-title" className="display t-book md:mt-3">
                {book.title}.
              </h1>
              {(book.author || book.formato) && (
                <p className="mt-4 text-[16px] font-medium">
                  {book.author && `de ${book.author}`}
                  {book.author && book.formato && ' · '}
                  {book.formato}
                </p>
              )}
              {rating && (
                <a
                  href="#resenas"
                  className="focus-ring mt-3 inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-[13px] font-bold text-forest"
                  style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
                >
                  <StarRating value={rating.average} size={15} />
                  {String(rating.average).replace('.', ',')} · {rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'}
                </a>
              )}
              {editions && (
                <nav aria-label="Ediciones" className="mt-6">
                  <p className="text-[13px] font-bold">Elegí la edición:</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {editions.map((e) => {
                      const current = e.id === book.id;
                      return (
                        <li key={e.id}>
                          <Link
                            href={`/catalogo/${e.id}`}
                            scroll={false}
                            aria-current={current ? 'page' : undefined}
                            className={`focus-ring flex flex-col rounded-[14px] border-2 px-4 py-2 leading-tight ${
                              current ? 'border-cream bg-cream text-forest' : 'border-cream hover:bg-cream hover:text-forest'
                            }`}
                            style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
                          >
                            <span className="text-[14px] font-bold">{e.formato ?? 'Otra edición'}</span>
                            <span className="text-[12px] font-medium">{formatPrice(e.precioTransferencia)} transf.</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              )}
              {/* El precio grande es siempre el de transferencia (igual que en las tarjetas); el de Mercado Pago va abajo, más chico. */}
              <div className="relative mt-6 inline-flex -rotate-1 items-center gap-4 rounded-[18px] bg-forest py-3 pl-5 pr-4 text-cream md:gap-5 md:py-3.5 md:pl-6 md:pr-5">
                <div>
                  <p className="display text-[clamp(2.2rem,3.8vw,3.2rem)] text-mustard">{formatPrice(transferPrice)}</p>
                  <p className="mt-1 text-[13px] font-bold md:text-[14px]">con transferencia</p>
                </div>
                <Attention className="rounded-full bg-mustard px-3 py-1.5 text-[13px] font-bold uppercase leading-none text-forest md:text-[14px]">
                  10% off
                </Attention>
                <Sticker variant="flower" size={24} rotate={12} className="-right-2 -top-2.5" delay={1.1} />
              </div>
              <p className="mt-3 text-[15px] font-bold md:text-[16px]">{formatPrice(book.price)} con Mercado Pago</p>
              <p className="lede mt-5 !max-w-[44ch]">{book.sinopsis}</p>
              {momentos.length > 0 && (
                <div className="mt-6">
                  <p className="text-[13px] font-bold">Para tu momento:</p>
                  <ul className="mt-2 flex flex-wrap gap-2" aria-label="Momentos para los que es ideal este libro">
                    {momentos.map((m) => (
                      <li
                        key={m.id}
                        className="inline-flex h-8 items-center rounded-full bg-forest px-3.5 text-[13px] font-bold text-cream"
                      >
                        {m.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {lowStock && (
                <Attention as="p" delay={600} className="mt-7 flex items-center gap-2 text-[15px] font-bold">
                  <Sticker variant="flower" size={18} inline plain float={false} />
                  {units === 1 ? '¡Queda solo 1 ejemplar!' : `¡Quedan solo ${units} ejemplares!`}
                </Attention>
              )}
              <div id="comprar" className={`${lowStock ? 'mt-4' : 'mt-8'} flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6`}>
                {/* Sin stickers encima de los botones (se confunden con el botón y tapan el texto). */}
                <AddToCartButton bookId={book.id} className="w-full sm:w-auto" />
                <BuyNowButton bookId={book.id} className="w-full sm:w-auto" />
              </div>
              <ul className="mt-8 grid w-full max-w-[460px] grid-cols-3 divide-x-[1.5px] divide-cream rounded-[18px] border-[1.5px] border-cream">
                {(
                  [
                    { variant: 'sun', top: 'Libro', bottom: 'nuevo' },
                    { variant: 'pinwheel', top: 'Envío a', bottom: 'todo el país' },
                    { variant: 'checker', top: 'Sale el', bottom: 'mismo día' },
                  ] as const
                ).map((item) => (
                  <li key={item.bottom} className="flex flex-col items-center gap-1.5 px-2 py-3 text-center md:py-3.5">
                    <Sticker variant={item.variant} size={26} inline float={false} />
                    <span className="text-[12px] font-bold leading-tight md:text-[13px]">
                      {item.top}
                      <br />
                      {item.bottom}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <BuyBar
        bookId={book.id}
        title={fullTitle(book)}
        price={formatPrice(book.price)}
        transferPrice={formatPrice(transferPrice)}
        watchId="comprar"
      />
      <WaveDivider top="brick" band="mustard" bottom={next} variant={2} />
    </>
  );
}
