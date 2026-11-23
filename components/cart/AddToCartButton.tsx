'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useCart } from './CartProvider';

interface AddToCartButtonProps {
  bookId: string;
  /** 'hero': grande, dorado y con salto de atención. 'bar': compacto, para la barra fija. */
  size?: 'hero' | 'bar';
  className?: string;
}

/**
 * Agrega el libro, confirma con "¡Agregado!" y abre el carrito.
 * Si ya están en el carrito todos los ejemplares que hay en stock, no suma más: lo avisa y abre el carrito.
 */
export function AddToCartButton({ bookId, size = 'hero', className = '' }: AddToCartButtonProps) {
  const { add, open, maxFor, qtyOf, ready } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  // Solo después de leer el carrito guardado (si no, en el servidor y en el navegador se vería distinto).
  const max = maxFor(bookId);
  const full = ready && qtyOf(bookId) >= max;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sizing =
    size === 'hero'
      ? `${full ? '' : 'cta-nudge'} h-14 px-8 text-[16px] md:h-[60px] md:px-10 md:text-[17px]`
      : 'h-11 px-5 text-[14px]';

  const label = added
    ? '¡Agregado!'
    : full
      ? size === 'bar'
        ? 'Ya está en tu carrito'
        : max === 1
          ? 'Ya tenés el último en tu carrito'
          : `Ya tenés los ${max} en tu carrito`
      : 'Agregar al carrito';

  return (
    <button
      type="button"
      className={`btn ${full && !added ? 'border-2 border-mustard text-mustard' : 'bg-mustard text-forest'} ${sizing} ${className}`}
      style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
      onClick={() => {
        if (!full) {
          add(bookId);
          setAdded(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setAdded(false), 1800);
        }
        open();
      }}
    >
      <span aria-live="polite">{label}</span>
    </button>
  );
}
