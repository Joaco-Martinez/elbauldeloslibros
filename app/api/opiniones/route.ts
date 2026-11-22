import { NextResponse } from 'next/server';
import { orderStore } from '@/lib/orderStore';
import { feedbackStore, type BookReview } from '@/lib/reviews';
import { safeEqual } from '@/lib/tokenCompare';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const stars = (v: unknown) => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 5 ? (v as number) : 0);

/** Guarda la opinión de un comprador. Solo con el link de su pedido, ya entregado, y una sola vez. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const order = await orderStore.get(str(body.orderId, 40));
  const token = str(body.token, 64);
  if (!order || !token || !safeEqual(token, order.token)) return NextResponse.json({ error: 'No encontramos tu pedido.' }, { status: 404 });
  if (order.status !== 'entregado') return NextResponse.json({ error: 'Vas a poder opinar cuando recibas tu pedido.' }, { status: 409 });
  if (order.reviewedAt || (await feedbackStore.get(order.id))) {
    return NextResponse.json({ error: 'Ya dejaste tu opinión de este pedido. ¡Gracias!' }, { status: 409 });
  }

  const raw = (body.store ?? {}) as Record<string, unknown>;
  const storeRating = stars(raw.rating);
  if (!storeRating) return NextResponse.json({ error: 'Elegí cuántas estrellas le das a la tienda.' }, { status: 400 });

  // Solo libros de este pedido; los que no puntuó se omiten.
  const sentBooks = Array.isArray(body.books) ? (body.books as Record<string, unknown>[]) : [];
  const books: BookReview[] = order.lines.flatMap((l) => {
    const r = sentBooks.find((b) => b?.bookId === l.id);
    const rating = stars(r?.rating);
    return rating ? [{ bookId: l.id, title: l.title, rating, text: str(r?.text, 1000), status: 'pendiente' as const }] : [];
  });

  await feedbackStore.save({
    orderId: order.id,
    createdAt: new Date().toISOString(),
    nombre: order.customer.nombre.split(' ')[0],
    ciudad: order.customer.ciudad,
    books,
    store: { rating: storeRating, text: str(raw.text, 1000), allowPublish: raw.allowPublish === true, status: 'pendiente' },
    suggestion: str(body.suggestion, 2000),
  });
  await orderStore.save({ ...order, reviewedAt: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
