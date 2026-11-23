import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { forgetCartsOf } from '@/lib/abandonedCarts';
import { loadCatalog } from '@/lib/catalog';
import { maybeExpireUnpaidOrders } from '@/lib/expireOrders';
import { createCheckout } from '@/lib/mercadopago';
import { notifyNewOrder } from '@/lib/notify';
import { orderStore } from '@/lib/orderStore';
import { createOrder, parseOrderRequest } from '@/lib/orders';
import { releaseStock, reserveStock } from '@/lib/stock';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  await loadCatalog(); // libros cargados en el panel (precios al día)
  const parsed = parseOrderRequest(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { items, customer, method, delivery } = parsed.data;
  const order = createOrder(items, customer, method, delivery);
  if (order.lines.length === 0 || order.total <= 0) {
    return NextResponse.json({ error: 'El carrito está vacío.' }, { status: 400 });
  }

  // Descontar stock antes de seguir: si no alcanza, no hay pedido.
  const reservation = await reserveStock(order.lines);
  if (!reservation.ok) return NextResponse.json({ error: reservation.error }, { status: 409 });
  order.stockReserved = reservation.reserved;

  const origin = process.env.SITE_URL?.replace(/\/$/, '') || new URL(request.url).origin;

  // Mercado Pago: si no se puede iniciar el pago, se devuelve el stock.
  let redirectUrl: string | undefined;
  if (method === 'mercadopago') {
    const checkout = await createCheckout(order, origin);
    if (!checkout.ok) {
      await releaseStock(order.stockReserved);
      return NextResponse.json({ error: checkout.error }, { status: 503 });
    }
    redirectUrl = checkout.checkoutUrl;
    order.mpInitPoint = checkout.checkoutUrl;
    order.mpOrderId = checkout.mpOrderId;
  }

  try {
    await orderStore.save(order);
  } catch (err) {
    console.error('[pedidos] No se pudo guardar el pedido', order.id, err);
    await releaseStock(order.stockReserved);
    return NextResponse.json({ error: 'No pudimos registrar el pedido. Probá de nuevo en un rato.' }, { status: 500 });
  }

  // Compró: sus carritos guardados (este checkout o uno anterior con el mismo email) ya no están abandonados.
  await forgetCartsOf((body as { draftId?: unknown }).draftId, order.customer.email).catch((err) =>
    console.error('[pedidos] No se pudo borrar el carrito', err),
  );

  // Si algún libro se quedó en 0, el sitio deja de mostrarlo.
  if (order.stockReserved.length > 0) revalidatePath('/', 'layout');

  const mail = await notifyNewOrder(order, origin);

  // De paso, libera lo que quedó reservado sin pagar más de 24 h (como mucho cada 10 min).
  await maybeExpireUnpaidOrders(origin);

  return NextResponse.json({
    orderId: order.id,
    token: order.token,
    subtotal: order.subtotal,
    discount: order.discount,
    total: order.total,
    emailSent: mail.customer === 'sent',
    ...(redirectUrl ? { redirectUrl } : {}),
  });
}
