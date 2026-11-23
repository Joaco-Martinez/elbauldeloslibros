'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { applyCustomCatalog, getBook, type CustomCatalog } from '@/data/books';
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
  /** Cuántos ejemplares de un libro se pueden tener en el carrito (el stock, como mucho MAX_QTY). */
  maxFor: (id: string) => number;
  /** Cuántos ejemplares de un libro hay en el carrito. */
  qtyOf: (id: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

/** Stock por libro que manda el servidor (null = sin controlar). Lo actualiza el CartProvider. */
let stockLimits: Record<string, number | null> = {};

/** Tope por libro: el stock disponible (si está cargado), y nunca más de MAX_QTY. 0 = agotado. */
const maxFor = (id: string) => {
  const units = stockLimits[id];
  return typeof units === 'number' ? Math.max(0, Math.min(MAX_QTY, units)) : MAX_QTY;
};

const clampQty = (id: string, qty: number) => Math.max(1, Math.min(maxFor(id), Math.round(qty)));

/** Ajusta el carrito al stock: baja las cantidades de más y saca los libros agotados. */
const fitToStock = (list: CartItem[]) =>
  list.filter((i) => maxFor(i.id) > 0).map((i) => (i.qty > maxFor(i.id) ? { ...i, qty: maxFor(i.id) } : i));

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i): i is CartItem => typeof i?.id === 'string' && typeof i?.qty === 'number' && !!getBook(i.id))
      .map((i) => ({ id: i.id, qty: clampQty(i.id, i.qty) }));
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
        return getBook(id) && Number.isFinite(n) && n >= 1 ? [{ id, qty: clampQty(id, n) }] : [];
      });
    return items.length > 0 ? items : null;
  } catch {
    return null;
  }
}

export function CartProvider({
  children,
  images,
  customCatalog,
  stock,
}: {
  children: ReactNode;
  images: Record<string, BookCoverImage | null>;
  /** Libros y secciones cargados en el panel: se suman al catálogo del navegador antes de que se dibuje el carrito. */
  customCatalog: CustomCatalog;
  /** Unidades por libro (null = sin controlar): el carrito no deja pasar del stock. */
  stock: Record<string, number | null>;
}) {
  applyCustomCatalog(customCatalog);
  stockLimits = stock;
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  // El carrito vive en el navegador de cada visitante (se lee después de montar para evitar desajustes SSR).
  // Si llega con un link de "te guardamos el carrito" (?c=libro:2,otro:1), ese carrito reemplaza al guardado.
  useEffect(() => {
    const fromLink = readCartLink();
    setItems(fitToStock(fromLink ?? readStorage()));
    setHydrated(true);
  }, []);

  // Si el stock cambió mientras navega (ej. alguien compró el último), el carrito se acomoda.
  useEffect(() => {
    setItems((prev) => {
      const next = fitToStock(prev);
      return next.length === prev.length && next.every((i, k) => i.qty === prev[k].qty) ? prev : next;
    });
  }, [stock]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sin almacenamiento (modo privado, etc.): el carrito sigue funcionando en memoria.
    }
  }, [items, hydrated]);

  const add = useCallback((id: string, qty = 1) => {
    if (!getBook(id) || maxFor(id) === 0) return;
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) return prev.map((i) => (i.id === id ? { ...i, qty: clampQty(id, i.qty + qty) } : i));
      return [...prev, { id, qty: clampQty(id, qty) }];
    });
  }, []);

  /** Suma o resta sobre la cantidad actual (seguro ante clics rápidos). */
  const changeQty = useCallback((id: string, delta: number) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: clampQty(id, i.qty + delta) } : i)));
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
    const qtyOf = (id: string) => items.find((i) => i.id === id)?.qty ?? 0;
    return { items, ready: hydrated, count, total, add, changeQty, remove, clear, isOpen, open, close, images, maxFor, qtyOf };
    // `stock` cambia el tope de cada libro: se recalcula para que los botones se actualicen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, hydrated, add, changeQty, remove, clear, isOpen, open, close, images, stock]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart tiene que usarse dentro de <CartProvider>');
  return ctx;
}
