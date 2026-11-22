'use client';

import { useEffect } from 'react';
import { useCart } from './CartProvider';

/** Vacía el carrito una vez que ya se cargó (pago aprobado o en proceso). */
export function ClearCartOnMount() {
  const { ready, clear } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
