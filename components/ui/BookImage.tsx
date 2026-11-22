import Image from 'next/image';
import type { Book } from '@/data/books';
import { getBookCover } from '@/lib/bookImage';
import { BookCover } from './BookCover';

interface BookImageProps {
  book: Book;
  sizes: string;
  priority?: boolean;
  flat?: boolean;
  className?: string;
}

/**
 * Foto del libro si existe en /public/images/libros/<id>.*, con su proporción real;
 * si no, la portada ilustrada.
 */
export function BookImage({ book, sizes, priority = false, flat = false, className = '' }: BookImageProps) {
  const cover = getBookCover(book);

  if (!cover) {
    return (
      <BookCover
        title={book.title}
        author={book.author}
        color={book.colorDePortada}
        accent={book.colorDeDetalle}
        flat={flat}
        className={className}
      />
    );
  }

  return (
    <div className={`relative ${className}`} style={{ aspectRatio: `${cover.ratio}` }}>
      <Image
        src={cover.src}
        alt={`Tapa de ${book.title}${book.author ? `, de ${book.author}` : ''}`}
        fill
        sizes={sizes}
        priority={priority}
        className="rounded-[2px] object-cover"
      />
    </div>
  );
}
