'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useCart } from './CartProvider';

interface AddToCartButtonProps {
  bookId: string;
  /** 'hero': grande, dorado y con salto de atención. 'bar': compacto, para la barra fija. */
  size?: 'hero' | 'bar';
  className?: string;
}

/** Agrega el libro, confirma con "¡Agregado!" y abre el carrito. */
export function AddToCartButton({ bookId, size = 'hero', className = '' }: AddToCartButtonProps) {
  const { add, open } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sizing =
    size === 'hero'
      ? 'cta-nudge h-14 px-8 text-[16px] md:h-[60px] md:px-10 md:text-[17px]'
      : 'h-11 px-5 text-[14px]';

  return (
    <button
      type="button"
      className={`btn bg-mustard text-forest ${sizing} ${className}`}
      style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
      onClick={() => {
        add(bookId);
        setAdded(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setAdded(false), 1800);
        open();
      }}
    >
      <span aria-live="polite">{added ? '¡Agregado!' : 'Agregar al carrito'}</span>
    </button>
  );
}
