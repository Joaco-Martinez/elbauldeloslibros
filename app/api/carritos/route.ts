import { NextResponse } from 'next/server';
import { getBook } from '@/data/books';
import { CART_ID_RE, cartStore } from '@/lib/abandonedCarts';
import { loadCatalog } from '@/lib/catalog';
import { maybeExpireUnpaidOrders } from '@/lib/expireOrders';
import { getOrigin } from '@/lib/origin';
import { MAX_QTY_PER_BOOK } from '@/lib/limits';
import type { LineInput } from '@/lib/pricing';
import { PROVINCIAS } from '@/lib/site';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Guarda el carrito de alguien que completó su email o celular en el checkout.
 * Si después confirma el pedido, se borra (ver /api/pedidos).
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const id = str(body.id, 36);
  if (!CART_ID_RE.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  await loadCatalog();
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const items: LineInput[] = rawItems.flatMap((i) => {
    const { id: bookId, qty } = (i ?? {}) as LineInput;
    return typeof bookId === 'string' && getBook(bookId) && Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY_PER_BOOK
      ? [{ id: bookId, qty }]
      : [];
  });

  const email = str(body.email, 160);
  const telefono = str(body.telefono, 40);
  const hasEmail = EMAIL_RE.test(email);
  const hasPhone = telefono.replace(/\D/g, '').length >= 10;

  // Sin carrito o sin forma de contactarlo, no se guarda nada (y si había algo, se borra).
  if (items.length === 0 || (!hasEmail && !hasPhone)) {
    await cartStore.remove(id);
    return NextResponse.json({ ok: true, saved: false });
  }

  // Hay alguien comprando: buen momento para liberar lo reservado sin pagar (como mucho cada 10 min).
  await maybeExpireUnpaidOrders(await getOrigin());

  const provincia = str(body.provincia, 60);
  const now = new Date().toISOString();
  const prev = await cartStore.get(id);
  await cartStore.save({
    id,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    items,
    nombre: str(body.nombre, 120),
    email: hasEmail ? email : '',
    telefono: hasPhone ? telefono : '',
    provincia: (PROVINCIAS as readonly string[]).includes(provincia) ? provincia : '',
    ...(prev?.contactedAt ? { contactedAt: prev.contactedAt } : {}),
  });
  return NextResponse.json({ ok: true, saved: true });
}
