import { revalidatePath } from 'next/cache';
import { getMpOrder, isMpOrderPaid } from '@/lib/mercadopago';
import { sendStatusEmail } from '@/lib/notify';
import { orderStore } from '@/lib/orderStore';
import { applyStatusChange } from '@/lib/orders';
import type { Order } from '@/lib/orderTypes';
import { reserveStock } from '@/lib/stock';

/**
 * Registra un pago aprobado de Mercado Pago en el pedido (lo usan el aviso automático y la página de "¡Gracias!").
 * - Pedido esperando pago → "Pago confirmado" + mail al cliente.
 * - Pedido que se canceló solo por la reserva de 24 h → si hay stock, sigue adelante; si no, queda marcado para resolverlo.
 * `canRevalidate`: false cuando se llama mientras se arma una página (ahí Next no deja refrescar el catálogo).
 */
export async function recordMpPayment(order: Order, paymentRef: string, origin: string, canRevalidate = true): Promise<Order> {
  if (order.status === 'recibido') {
    const { order: updated } = applyStatusChange(order, { status: 'pago_confirmado', note: 'Pago acreditado en Mercado Pago.' });
    updated.mpPaymentId = paymentRef;
    await orderStore.save(updated);
    await sendStatusEmail(updated, origin);
    return updated;
  }

  if (order.status === 'cancelado' && order.expiredAt && !order.mpPaymentId) {
    const reservation = await reserveStock(order.lines);
    if (reservation.ok) {
      const { order: updated } = applyStatusChange(order, {
        status: 'pago_confirmado',
        note: 'Pago acreditado en Mercado Pago después de vencer la reserva. Había stock: se volvió a reservar.',
      });
      updated.mpPaymentId = paymentRef;
      updated.stockReserved = reservation.reserved;
      updated.expiredAt = undefined;
      await orderStore.save(updated);
      if (canRevalidate) revalidatePath('/', 'layout');
      await sendStatusEmail(updated, origin);
      return updated;
    }
    const { order: updated } = applyStatusChange(order, {
      status: 'cancelado',
      note: `⚠ Mercado Pago acreditó el pago después de vencer la reserva y ya no hay stock (${reservation.error}). Devolvé el pago o conseguí el libro.`,
    });
    updated.mpPaymentId = paymentRef;
    updated.paidAfterExpiry = true;
    await orderStore.save(updated);
    return updated;
  }

  return order;
}

/** Consulta la orden en Mercado Pago y, si está pagada, la registra. Devuelve el pedido actualizado. */
export async function syncMpOrder(order: Order, origin: string, canRevalidate = true): Promise<Order> {
  if (!order.mpOrderId || order.mpPaymentId) return order;
  const mp = await getMpOrder(order.mpOrderId);
  if (!mp || !isMpOrderPaid(mp)) return order;
  const paymentRef = mp.transactions?.payments?.[0]?.id ?? mp.id;
  return recordMpPayment(order, String(paymentRef), origin, canRevalidate);
}
