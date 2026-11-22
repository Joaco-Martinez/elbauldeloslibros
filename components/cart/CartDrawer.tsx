'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, type CSSProperties } from 'react';
import { getBook } from '@/data/books';
import { Attention } from '@/components/ui/Attention';
import { BookCover } from '@/components/ui/BookCover';
import { Button } from '@/components/ui/Button';
import { Sticker } from '@/components/ui/Sticker';
import { formatPrice } from '@/lib/formatPrice';
import { SHIPPING_FROM } from '@/lib/shipping';
import { bgTone } from '@/lib/tokens';
import { useDialog } from '@/lib/useDialog';
import { MAX_QTY, useCart } from './CartProvider';

export function CartDrawer() {
  const { isOpen, close, items, count, total, changeQty, remove, images } = useCart();
  const transferTotal = items.reduce((sum, i) => sum + (getBook(i.id)?.precioTransferencia ?? 0) * i.qty, 0);
  const savings = total - transferTotal;
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(isOpen, close, panelRef);

  if (!isOpen) return null;

  const lines = items.flatMap((item) => {
    const book = getBook(item.id);
    return book ? [{ ...item, book }] : [];
  });

  return (
    <div className="fixed inset-0 z-50">
      {/* Fondo: cierra al tocar afuera */}
      <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-[rgba(11,46,26,0.55)]" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrito-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-cream text-ink"
        style={{ '--ring': 'var(--color-forest)' } as CSSProperties}
      >
        <div className="relative flex items-start justify-between gap-4 px-5 pb-2 pt-5 md:px-7 md:pt-7">
          <div>
            <h2 id="carrito-title" className="display text-[2.75rem] text-rust md:text-[3.25rem]">
              Tu carrito.
            </h2>
            <p className="mt-2 text-[13px] font-medium" aria-live="polite">
              {count === 0 ? 'Todavía no agregaste libros.' : `${count} ${count === 1 ? 'libro' : 'libros'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar carrito"
            className="focus-ring -mr-1.5 grid h-10 w-10 shrink-0 place-items-center rounded-full"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <Sticker variant="sun" size={40} rotate={-10} className="right-16 top-6" />
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-start px-5 pt-6 md:px-7">
            <p className="lede">Elegí algo del catálogo y aparece acá.</p>
            <Button href="/catalogo" variant="rust" className="mt-6" onClick={close}>
              Ver el catálogo
            </Button>
          </div>
        ) : (
          <>
            <ul className="mt-4 flex-1 overflow-y-auto px-5 md:px-7">
              {lines.map(({ id, qty, book }) => {
                const cover = images[id];
                return (
                  <li key={id} className="flex gap-4 border-b-2 border-beige py-4 last:border-b-0">
                    <div className={`flex w-[76px] shrink-0 items-center justify-center rounded-[12px] p-2.5 ${bgTone[book.colorDeTarjeta === 'cream' ? 'beige' : book.colorDeTarjeta]}`}>
                      <div className="relative w-full" style={{ aspectRatio: `${cover?.ratio ?? 0.68}` }}>
                        {cover ? (
                          <Image src={cover.src} alt="" fill sizes="60px" className="rounded-[2px] object-cover" />
                        ) : (
                          <BookCover title={book.title} color={book.colorDePortada} accent={book.colorDeDetalle} showText={false} className="w-full" />
                        )}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        href={`/catalogo/${id}`}
                        onClick={close}
                        className="focus-ring rounded-sm text-[14px] font-bold leading-snug hover:underline"
                      >
                        {book.title}
                      </Link>
                      {book.author && <p className="mt-0.5 truncate text-[12px] font-medium">{book.author}</p>}

                      <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                        <div className="flex h-8 items-center rounded-full border-[1.5px] border-ink">
                          <button
                            type="button"
                            onClick={() => changeQty(id, -1)}
                            disabled={qty <= 1}
                            aria-label={`Quitar un ejemplar de ${book.title}`}
                            className="focus-ring grid h-full w-8 place-items-center rounded-full text-[16px] font-bold disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="min-w-[1.5rem] text-center text-[13px] font-bold" aria-label={`Cantidad: ${qty}`}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeQty(id, 1)}
                            disabled={qty >= MAX_QTY}
                            aria-label={`Agregar un ejemplar de ${book.title}`}
                            className="focus-ring grid h-full w-8 place-items-center rounded-full text-[16px] font-bold disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-[14px] font-bold">{formatPrice(book.price * qty)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(id)}
                        className="focus-ring mt-2 self-start rounded-sm text-[12px] font-medium underline underline-offset-2"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t-2 border-beige px-5 pb-6 pt-5 md:px-7">
              {/* El precio con transferencia primero: es el que más convence. */}
              <div className="rounded-[16px] bg-forest px-4 py-3 text-cream">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-[13px] font-bold leading-tight">
                    Pagando con
                    <br />
                    transferencia
                  </span>
                  <span className="display text-[2rem] leading-none text-mustard">{formatPrice(transferTotal)}</span>
                </div>
                {savings > 0 && (
                  <Attention className="mt-2 rounded-full bg-mustard px-2.5 py-1 text-[12px] font-bold leading-none text-forest">
                    Ahorrás {formatPrice(savings)}
                  </Attention>
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4 px-1 text-[13px] font-medium">
                <span>Con Mercado Pago</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
              <p className="mt-2 px-1 text-[12px] font-medium">
                Más el envío por Correo Argentino (desde {formatPrice(SHIPPING_FROM)}). En Córdoba Capital, retiro o Uber Moto.
              </p>
              <Button href="/checkout" variant="gold" className="mt-4 h-14 w-full text-[16px]" onClick={close}>
                Finalizar compra
              </Button>
              <button type="button" onClick={close} className="focus-ring mt-3 block w-full rounded-sm text-center text-[13px] font-bold underline underline-offset-2">
                Seguir mirando
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
