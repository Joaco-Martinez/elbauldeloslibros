import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { Book } from '@/data/books';
import { bookRatio } from '@/lib/bookImage';
import { formatPrice } from '@/lib/formatPrice';
import { bgTone, isDarkTone, type Tone } from '@/lib/tokens';
import { Attention } from './Attention';
import { BookImage } from './BookImage';

interface ProductCardProps {
  book: Book;
  /** Color del fondo de la sección: si coincide con la tarjeta, se usa una alternativa. */
  surface?: Tone;
  /** Etiqueta arriba a la izquierda (ej. "¡Quedan 2!"). */
  badge?: string;
  /** Fuerza un color de tarjeta (para que todas las de una sección sean iguales). */
  tone?: Tone;
}

const ALTERNATIVE: Partial<Record<Tone, Tone>> = { cream: 'beige', mustard: 'cream', forest: 'brick', brick: 'forest' };

export function ProductCard({ book, surface, badge, tone }: ProductCardProps) {
  const own = tone ?? book.colorDeTarjeta;
  const card = own === surface ? (ALTERNATIVE[surface] ?? 'cream') : own;
  const dark = isDarkTone(card);
  const text = dark ? 'text-cream' : 'text-ink';

  return (
    <Link
      href={`/catalogo/${book.id}`}
      className={`product-card focus-ring group flex h-full flex-col rounded-card ${bgTone[card]} ${text}`}
      style={{ '--ring': dark ? 'var(--color-cream)' : 'var(--color-forest)' } as CSSProperties}
      aria-label={`${book.title}${book.author ? `, de ${book.author}` : ''}. ${formatPrice(book.precioTransferencia)} con transferencia, ${formatPrice(book.price)} con Mercado Pago${badge ? `. ${badge}` : ''}`}
    >
      {/* La zona del libro tiene su propia proporción: el texto de abajo nunca achica la tapa. */}
      <div className="relative flex aspect-[5/6] items-end justify-center pb-[9%] pt-[13%]">
        {badge && (
          <Attention
            className={`absolute left-2 top-2 z-20 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none md:left-3 md:top-3 md:text-[12px] ${
              card === 'brick' || card === 'rust' ? 'bg-mustard text-forest' : 'bg-brick text-cream'
            }`}
          >
            {badge}
          </Attention>
        )}
        <div className="card-book relative h-full" style={{ aspectRatio: `${bookRatio(book)}` }}>
          <BookImage
            book={book}
            sizes="(min-width: 1024px) 160px, (min-width: 768px) 30vw, 45vw"
            className="relative z-10 h-full"
          />
          <span className="contact-shadow" aria-hidden="true" />
        </div>
      </div>
      {/* Título (hasta 2 renglones en celular), autor, y abajo el precio con transferencia bien a la vista. */}
      <div className="flex flex-1 flex-col px-3 pb-3 md:px-3.5 md:pb-3.5">
        <p className="line-clamp-2 text-[12px] font-bold leading-tight md:line-clamp-1 md:text-[13px]">{book.title}</p>
        {book.author && <p className="mt-0.5 truncate text-[11px] font-medium leading-tight">{book.author}</p>}
        {/* mt-auto: el precio queda abajo de todo, alineado en toda la fila aunque el título ocupe 1 o 2 renglones. */}
        <div className="mt-auto pt-2">
          <p className="leading-tight">
            <span className="text-[15px] font-bold md:text-[16px]">{formatPrice(book.precioTransferencia)}</span>
            <span className="block text-[11px] font-bold sm:ml-1.5 sm:inline">con transferencia</span>
          </p>
          <p className="mt-0.5 text-[10.5px] font-medium leading-tight opacity-90 md:text-[11px]">
            {formatPrice(book.price)} con Mercado Pago
          </p>
        </div>
      </div>
    </Link>
  );
}
