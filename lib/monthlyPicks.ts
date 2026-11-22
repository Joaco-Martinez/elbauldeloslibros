import { categories, type Book } from '@/data/books';
import { orderStore } from '@/lib/orderStore';
import type { OrderStatus } from '@/lib/orderTypes';

/*
 * "Los más vendidos del mes" en el Inicio.
 * 1. Primero, los libros más vendidos del mes (pedidos pagados), como mucho uno por género.
 * 2. Si faltan, se completa con una rotación mensual de géneros: cada mes cambia qué géneros y qué títulos salen.
 * Siempre solo libros con stock.
 */

/** Cuántos libros muestra la sección (una fila en compu). */
export const PICKS = 4;

/** Desde cuántos ejemplares vendidos en el mes la sección se puede llamar "Los más vendidos". */
const MIN_SALES_FOR_TITLE = 4;

const PAID: OrderStatus[] = ['pago_confirmado', 'preparando', 'enviado', 'entregado'];
const TZ = 'America/Argentina/Buenos_Aires';

/** Año y mes en Argentina (ej. "2026-11"). */
const monthKey = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(date);

/** "noviembre" */
export const monthName = (date = new Date()) => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, month: 'long' }).format(date);

export interface MonthlyPicks {
  books: Book[];
  /** true si hubo ventas suficientes en el mes como para decir "más vendidos" con verdad. */
  bySales: boolean;
  month: string;
  /** Mes siguiente ("diciembre"), para "cambian el 1° de diciembre". */
  nextMonth: string;
  /** Días que quedan del mes después de hoy (0 = hoy es el último día). */
  daysLeft: number;
}

/** Unidades por libro (null = sin controlar). Para elegir y para mostrar "Quedan 2". */
export type StockUnits = Record<string, number | null>;

/** Para ordenar por stock: sin controlar cuenta como 0 (no sabemos cuántos hay). */
const unitsOf = (stock: StockUnits, id: string) => stock[id] ?? 0;

export async function getMonthlyPicks(available: Book[], stock: StockUnits = {}, now = new Date()): Promise<MonthlyPicks> {
  const month = monthKey(now);

  // 1. Ventas del mes (ejemplares por libro).
  const sold = new Map<string, number>();
  try {
    for (const o of await orderStore.list(500)) {
      if (!PAID.includes(o.status) || monthKey(new Date(o.createdAt)) !== month) continue;
      for (const l of o.lines) sold.set(l.id, (sold.get(l.id) ?? 0) + l.qty);
    }
  } catch (err) {
    console.error('[más vendidos] No se pudieron leer los pedidos', err);
  }
  const totalSold = [...sold.values()].reduce((a, b) => a + b, 0);

  const picks: Book[] = [];
  const usedCategories = new Set<string>();
  const add = (b: Book) => {
    if (picks.length >= PICKS || picks.some((p) => p.id === b.id)) return;
    picks.push(b);
    usedCategories.add(b.category);
  };

  const bestSellers = available
    .filter((b) => (sold.get(b.id) ?? 0) > 0)
    .sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0));
  for (const b of bestSellers) if (!usedCategories.has(b.category)) add(b);

  // 2. Completa con un libro por género: el que más stock tiene (para mover lo que más hay).
  //    Cada mes la rotación cambia el orden de los géneros y, a igual stock, qué título sale.
  const [y, m] = month.split('-').map(Number);
  const seed = y * 12 + m;
  const order = categories.map((_, i) => categories[(i + seed) % categories.length]);
  for (const c of order) {
    if (usedCategories.has(c.id)) continue;
    const inCat = available.filter((b) => b.category === c.id);
    if (!inCat.length) continue;
    const rotated = inCat.map((_, i) => inCat[(i + seed) % inCat.length]);
    add(rotated.reduce((best, b) => (unitsOf(stock, b.id) > unitsOf(stock, best.id) ? b : best)));
  }
  // Si hay pocos géneros con stock, se completa con lo que haya (primero lo vendido, después lo de más stock).
  const byStock = [...available].sort((a, b) => unitsOf(stock, b.id) - unitsOf(stock, a.id));
  for (const b of [...bestSellers, ...byStock]) add(b);

  // Cuenta regresiva del mes (hora de Argentina).
  const today = Number(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, day: 'numeric' }).format(now));
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const nextMonth = monthName(new Date(Date.UTC(y, m, 15)));

  return { books: picks, bySales: totalSold >= MIN_SALES_FOR_TITLE, month: monthName(now), nextMonth, daysLeft: lastDay - today };
}
