import { revalidatePath } from 'next/cache';
import { cartIdForOrder, cartStore } from '@/lib/abandonedCarts';
import { sendStatusEmail } from '@/lib/notify';
import { orderStore } from '@/lib/orderStore';
import { applyStatusChange } from '@/lib/orders';
import type { Order } from '@/lib/orderTypes';
import { releaseStock } from '@/lib/stock';

/** Cuánto se guardan los libros de un pedido sin pagar. Pasado esto, se cancela solo y vuelven al stock. */
export const PAYMENT_HOLD_MS = 24 * 3_600_000;

/** Hasta cuándo está reservado (ISO). */
export const holdUntil = (order: Pick<Order, 'createdAt'>) => new Date(Date.parse(order.createdAt) + PAYMENT_HOLD_MS).toISOString();

let running: Promise<number> | null = null;
let lastRun = 0;

/**
 * Cancela los pedidos sin pagar con más de 24 h: devuelve el stock y le avisa al cliente
 * (con un link para volver a armar el pedido). Devuelve cuántos venció.
 * Solo se llama desde rutas del servidor (no desde páginas), porque refresca el catálogo.
 */
export function expireUnpaidOrders(origin: string, now = Date.now()): Promise<number> {
  // Un solo recorrido a la vez (dos avisos juntos no devuelven el stock dos veces).
  running ??= run(origin, now).finally(() => {
    running = null;
    lastRun = Date.now();
  });
  return running;
}

/** Igual, pero como mucho una vez cada 10 minutos (para llamarlo en cada pedido o checkout sin costo). */
export function maybeExpireUnpaidOrders(origin: string) {
  if (Date.now() - lastRun < 10 * 60_000) return Promise.resolve(0);
  return expireUnpaidOrders(origin).catch((err) => {
    console.error('[vencimientos] No se pudo revisar los pedidos sin pagar', err);
    return 0;
  });
}

async function run(origin: string, now: number) {
  const orders = await orderStore.list(500);
  const stale = orders.filter((o) => o.status === 'recibido' && now - Date.parse(o.createdAt) >= PAYMENT_HOLD_MS);
  let expired = 0;
  for (const listed of stale) {
    // Se vuelve a leer por si justo se pagó o lo movieron desde el panel.
    const order = await orderStore.get(listed.id);
    if (!order || order.status !== 'recibido') continue;
    const { order: updated } = applyStatusChange(order, {
      status: 'cancelado',
      note: 'Pasaron 24 h sin el pago: se canceló solo y los libros volvieron al stock.',
    });
    updated.expiredAt = new Date(now).toISOString();
    await releaseStock(order.stockReserved);
    updated.stockReserved = [];
    await orderStore.save(updated);
    expired += 1;
    await sendStatusEmail(updated, origin);

    // Pasa a "Carritos" para que le puedas escribir y levantar la venta.
    const c = order.customer;
    await cartStore
      .save({
        id: cartIdForOrder(order.id),
        createdAt: order.createdAt,
        // Fecha del pedido: así aparece de inmediato en la lista (ya pasaron más de 2 h).
        updatedAt: order.createdAt,
        items: order.lines.map((l) => ({ id: l.id, qty: l.qty })),
        nombre: c.nombre,
        email: c.email,
        telefono: c.telefono,
        provincia: c.provincia,
        fromOrderId: order.id,
      })
      .catch((err) => console.error('[vencimientos] No se pudo pasar a carritos', order.id, err));
  }
  if (expired > 0) {
    revalidatePath('/', 'layout');
    console.info(`[vencimientos] ${expired} pedido(s) sin pagar cancelado(s); stock devuelto.`);
  }
  return expired;
}
