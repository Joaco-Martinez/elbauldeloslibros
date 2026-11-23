import { NextResponse } from 'next/server';
import { getMpOrder, getPayment, verifyWebhookSignature } from '@/lib/mercadopago';
import { recordMpPayment, syncMpOrder } from '@/lib/mpSync';
import { orderStore } from '@/lib/orderStore';

/**
 * Aviso de Mercado Pago. Cuando un pago queda acreditado, el pedido pasa solo a "Pago confirmado"
 * y el cliente recibe el mail. El estado siempre se consulta a la API de Mercado Pago (no se confía en el aviso).
 * - type "order": API de Orders (pedidos nuevos).
 * - type "payment": API de Preferences (pedidos viejos).
 * En Mercado Pago se configura en Tus integraciones → Webhooks, con el evento "Order (Mercado Pago)".
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: { type?: string; data?: { id?: string | number } } = {};
  try {
    body = await request.json();
  } catch {
    // Algunos avisos llegan solo por query string.
  }

  const type = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const dataId = String(body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');
  if ((type !== 'order' && type !== 'payment') || !dataId) return NextResponse.json({ ok: true });

  if (!verifyWebhookSignature(request, dataId)) {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 });
  }

  const origin = process.env.SITE_URL?.trim().replace(/\/$/, '') || url.origin;

  if (type === 'order') {
    const mp = await getMpOrder(dataId);
    if (!mp?.external_reference) return NextResponse.json({ ok: true });
    const order = await orderStore.get(mp.external_reference);
    // Solo si la orden de Mercado Pago es la de este pedido.
    if (!order || (order.mpOrderId && order.mpOrderId !== mp.id)) return NextResponse.json({ ok: true });
    await syncMpOrder({ ...order, mpOrderId: mp.id }, origin);
    return NextResponse.json({ ok: true });
  }

  const payment = await getPayment(dataId);
  if (!payment?.external_reference || payment.status !== 'approved') return NextResponse.json({ ok: true });
  const order = await orderStore.get(payment.external_reference);
  if (order && !order.mpPaymentId) await recordMpPayment(order, String(payment.id), origin);
  return NextResponse.json({ ok: true });
}
