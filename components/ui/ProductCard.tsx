import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getCategory, type Book } from '@/data/books';
import { bookRatio } from '@/lib/bookImage';
import { formatPrice } from '@/lib/formatPrice';
import { bgTone, type Tone } from '@/lib/tokens';
import { Attention } from './Attention';
import { BookImage } from './BookImage';

interface ProductCardProps {
  book: Book;
  /** Color del fondo de la sección (se mantiene por compatibilidad; la tarjeta siempre es clara). */
  surface?: Tone;
  /** Etiqueta arriba a la izquierda (ej. "¡Quedan 2!"). */
  badge?: string;
  /** Muestra el género abajo del título (en el catálogo no hace falta: la sección ya lo dice). */
  showGenre?: boolean;
}

/** ["Tapa blanda", "Tapa dura"] → "Tapa blanda y tapa dura" */
function editionsText(list: string[]) {
  const [first, ...rest] = list;
  if (!rest.length) return first;
  return `${[first, ...rest.slice(0, -1).map((s) => s.toLowerCase())].join(', ')} y ${rest[rest.length - 1].toLowerCase()}`;
}

/**
 * Tarjeta de libro: fondo claro y parejo para que la tapa sea la protagonista.
 * El color del género va en la sección (catálogo) y en una franja arriba de la tarjeta.
 */
export function ProductCard({ book, badge, showGenre = true }: ProductCardProps) {
  const category = getCategory(book.category);
  // Tapa blanda y tapa dura del mismo título: una tarjeta con "Desde" (la página tiene el selector).
  const multi = (book.ediciones?.length ?? 0) > 1;

  return (
    <Link
      href={`/catalogo/${book.id}`}
      className="product-card focus-ring group flex h-full flex-col overflow-hidden rounded-card bg-cream text-ink shadow-[0_2px_0_rgb(0_0_0/0.08)]"
      style={{ '--ring': 'var(--color-forest)' } as CSSProperties}
      aria-label={`${book.title}${book.author ? `, de ${book.author}` : ''}${multi ? `. ${editionsText(book.ediciones!)}` : ''}. ${multi ? 'Desde ' : ''}${formatPrice(book.precioTransferencia)} con transferencia, ${formatPrice(book.price)} con Mercado Pago${badge ? `. ${badge}` : ''}`}
    >
      {/* Franja con el color del género. */}
      <span aria-hidden="true" className={`block h-1.5 shrink-0 ${bgTone[category.tone]}`} />
      {/* La zona del libro tiene su propia proporción: el texto de abajo nunca achica la tapa. Tapa más grande que antes. */}
      <div className="relative flex aspect-[5/6] items-end justify-center pb-[8%] pt-[9%]">
        {badge && (
          <Attention className="absolute left-2 top-2 z-20 rounded-full bg-brick px-2.5 py-1 text-[11px] font-bold leading-none text-cream md:left-3 md:top-3 md:text-[12px]">
            {badge}
          </Attention>
        )}
        <div className="card-book relative h-full" style={{ aspectRatio: `${bookRatio(book)}` }}>
          <BookImage
            book={book}
            sizes="(min-width: 1024px) 180px, (min-width: 768px) 30vw, 45vw"
            className="relative z-10 h-full"
          />
          <span className="contact-shadow" aria-hidden="true" />
        </div>
      </div>
      {/* Título (hasta 2 renglones), autor, y abajo el precio con transferencia bien a la vista. */}
      <div className="flex flex-1 flex-col border-t border-beige px-3 pb-3 pt-2.5 md:px-3.5 md:pb-3.5">
        {showGenre && (
          <p className="mb-1 flex items-center gap-1.5 truncate text-[11px] font-bold leading-tight">
            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${bgTone[category.tone]}`} />
            {category.label}
          </p>
        )}
        <p className="line-clamp-2 text-[13px] font-bold leading-tight md:text-[14px]">{book.title}</p>
        {book.author && <p className="mt-0.5 truncate text-[11.5px] font-medium leading-tight md:text-[12px]">{book.author}</p>}
        {multi ? (
          <p className="mt-1 truncate text-[11px] font-bold leading-tight">{editionsText(book.ediciones!)}</p>
        ) : (
          book.formato === 'Tapa dura' && <p className="mt-1 truncate text-[11px] font-bold leading-tight">Tapa dura</p>
        )}
        {/* mt-auto: el precio queda abajo de todo, alineado en toda la fila aunque el título ocupe 1 o 2 renglones. */}
        <div className="mt-auto pt-2">
          <p className="leading-tight">
            {multi && <span className="mr-1 text-[11px] font-bold">Desde</span>}
            <span className="text-[16px] font-bold text-brick md:text-[17px]">{formatPrice(book.precioTransferencia)}</span>
            <span className="block text-[11px] font-bold sm:ml-1.5 sm:inline">con transferencia</span>
          </p>
          <p className="mt-0.5 text-[11px] font-medium leading-tight">{formatPrice(book.price)} con Mercado Pago</p>
        </div>
      </div>
    </Link>
  );
}
