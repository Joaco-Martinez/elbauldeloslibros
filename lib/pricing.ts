import { getBook, type Book } from '@/data/books';

export type PaymentMethod = 'transferencia' | 'mercadopago';

/** Descuento por pagar con transferencia (para los textos "10% off"; el cálculo usa el precio con transferencia de cada libro). */
export const TRANSFER_DISCOUNT = 0.1;

export interface LineInput {
  id: string;
  qty: number;
}

export interface PricedLine {
  book: Book;
  qty: number;
  subtotal: number;
}

export interface Totals {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  /** Costo del envío (0 si es retiro / Uber o todavía no se sabe la provincia). */
  shipping: number;
  total: number;
}

/**
 * Calcula el pedido a partir del catálogo (nunca de precios que mande el navegador).
 * Se usa igual en el cliente (para mostrar) y en el servidor (para cobrar).
 * El 10% de la transferencia se aplica solo a los libros, no al envío.
 */
export function computeTotals(items: LineInput[], method: PaymentMethod, shipping = 0): Totals {
  const lines = items.flatMap((item) => {
    const book = getBook(item.id);
    return book ? [{ book, qty: item.qty, subtotal: book.price * item.qty }] : [];
  });
  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  // Con transferencia cada libro queda en su precio con transferencia (≈ 10% menos que el de lista).
  const discount =
    method === 'transferencia' ? lines.reduce((sum, l) => sum + (l.book.price - l.book.precioTransferencia) * l.qty, 0) : 0;
  return { lines, subtotal, discount, shipping, total: subtotal - discount + shipping };
}

export const bookCount = (items: LineInput[]) => items.reduce((n, i) => n + i.qty, 0);
