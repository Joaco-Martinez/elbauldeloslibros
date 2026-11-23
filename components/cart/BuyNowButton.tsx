'use client';

import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';
import { useCart } from './CartProvider';

/**
 * "Comprar ahora": suma el libro al carrito (si todavía no está) y va directo al checkout.
 * Si ya está en el carrito, no suma otro: solo lleva al checkout.
 */
export function BuyNowButton({ bookId, className = '' }: { bookId: string; className?: string }) {
  const { add, qtyOf, maxFor } = useCart();
  const router = useRouter();

  return (
    <button
      type="button"
      className={`btn h-14 border-2 border-cream px-8 text-[16px] text-cream hover:bg-cream hover:text-brick md:h-[60px] md:text-[17px] ${className}`}
      style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
      onClick={() => {
        if (qtyOf(bookId) === 0 && maxFor(bookId) > 0) add(bookId);
        router.push('/checkout');
      }}
    >
      Comprar ahora
    </button>
  );
}
