'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getBook } from '@/data/books';
import type { BookCoverImage } from '@/lib/bookImage';

import { MAX_QTY_PER_BOOK } from '@/lib/limits';

export const MAX_QTY = MAX_QTY_PER_BOOK;
const STORAGE_KEY = 'bdl-carrito-v1';

export interface CartItem {
  id: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  /** true cuando ya se leyó el carrito guardado (evita mostrar 'vacío' un instante). */
  ready: boolean;
  /** Cantidad total de ejemplares. */
  count: number;
  /** Total en pesos. */
  total: number;
  add: (id: string, qty?: number) => void;
  changeQty: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Fotos de los libros (resueltas en el servidor), por id. */
  images: Record<string, BookCoverImage | null>;
}

const CartContext = createContext<CartContextValue | null>(null);

const clampQty = (qty: number) => Math.max(1, Math.min(MAX_QTY, Math.round(qty)));

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i): i is CartItem => typeof i?.id === 'string' && typeof i?.qty === 'number' && !!getBook(i.id))
      .map((i) => ({ id: i.id, qty: clampQty(i.qty) }));
  } catch {
    return [];
  }
}

/** Lee ?c=libro:2,otro:1 de la dirección y lo saca (para que recargar no lo vuelva a aplicar). */
function readCartLink(): CartItem[] | null {
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('c');
    if (!raw) return null;
    url.searchParams.delete('c');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    const items = raw
      .split(',')
      .slice(0, 50)
      .flatMap((part) => {
        const [id, qty] = part.split(':');
        const n = Number(qty);
        return getBook(id) && Number.isFinite(n) && n >= 1 ? [{ id, qty: clampQty(n) }] : [];
      });
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export function CartProvider({ children, images }: { children: ReactNode; images: Record<string, BookCoverImage | null> }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  // El carrito vive en el navegador de cada visitante (se lee después de montar para evitar desajustes SSR).
  // Si llega con un link de "te guardamos el carrito" (?c=libro:2,otro:1), ese carrito reemplaza al guardado.
  useEffect(() => {
    const fromLink = readCartLink();
    setItems(fromLink ?? readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin almacenamiento (modo privado, etc.): el carrito sigue funcionando en memoria.
    }
  }, [items, hydrated]);

  const add = useCallback((id: string, qty = 1) => {
    if (!getBook(id)) return;
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) return prev.map((i) => (i.id === id ? { ...i, qty: clampQty(i.qty + qty) } : i));
      return [...prev, { id, qty: clampQty(qty) }];
    });
  }, []);

  /** Suma o resta sobre la cantidad actual (seguro ante clics rápidos). */
  const changeQty = useCallback((id: string, delta: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: clampQty(i.qty + delta) } : i)));
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const open = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    window.setTimeout(() => returnFocus.current?.focus(), 0);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const total = items.reduce((sum, i) => sum + (getBook(i.id)?.price ?? 0) * i.qty, 0);
    return { items, ready: hydrated, count, total, add, changeQty, remove, clear, isOpen, open, close, images };
  }, [items, hydrated, add, changeQty, remove, clear, isOpen, open, close, images]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart tiene que usarse dentro de <CartProvider>');
  return ctx;
}
