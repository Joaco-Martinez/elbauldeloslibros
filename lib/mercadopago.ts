import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Order } from '@/lib/orderTypes';

/*
 * Mercado Pago · Checkout Pro con la API de Orders (POST /v1/orders).
 * El cliente paga en la página de Mercado Pago y vuelve a /checkout/gracias.
 * Necesita MP_ACCESS_TOKEN en .env.local / Vercel (nunca en el código).
 * https://www.mercadopago.com.ar/developers/es/docs/checkout-pro-orders/overview
 */

const API = 'https://api.mercadopago.com';

type CheckoutResult = { ok: true; checkoutUrl: string; mpOrderId: string } | { ok: false; error: string };

/** Montos como los pide la API de Orders: texto con dos decimales ("15000.00"). */
const money = (n: number) => n.toFixed(2);

/** Crea la orden de pago y devuelve el link de Mercado Pago. */
export async function createCheckout(order: Order, origin: string): Promise<CheckoutResult> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return { ok: false, error: 'El pago con Mercado Pago todavía no está habilitado. Probá con transferencia.' };

  const backUrl = `${origin}/checkout/gracias?pedido=${encodeURIComponent(order.id)}`;
  const isPublic = origin.startsWith('https://');
  const items = [
    ...order.lines.map((l) => ({
      external_code: l.id,
      title: l.title,
      ...(l.author ? { description: `de ${l.author}` } : {}),
      // Las fotos solo sirven si la página es pública (Mercado Pago no ve tu compu).
      ...(isPublic ? { picture_url: `${origin}/images/libros/${l.id}.jpg` } : {}),
      quantity: l.qty,
      unit_price: money(l.unitPrice),
    })),
    ...(order.shippingCost ? [{ external_code: 'envio', title: 'Envío Correo Argentino', quantity: 1, unit_price: money(order.shippingCost) }] : []),
  ];
  // Tiene que coincidir con la suma de los ítems (con Mercado Pago no hay descuento).
  const itemsTotal = items.reduce((s, i) => s + Number(i.unit_price) * i.quantity, 0);
  if (Math.round(itemsTotal) !== order.total) {
    console.error('[mercadopago] El total no coincide con los ítems', order.id, itemsTotal, order.total);
    return { ok: false, error: 'No pudimos iniciar el pago con Mercado Pago. Probá con transferencia.' };
  }

  const [firstName, ...rest] = order.customer.nombre.split(' ');
  const body = {
    type: 'online',
    processing_mode: 'manual',
    external_reference: order.id,
    description: `Pedido ${order.id} · El Baul de los Libros`,
    total_amount: money(order.total),
    // La reserva dura 24 h: después de eso la orden vence (igual que en lib/expireOrders.ts).
    expiration_time: 'P1D',
    payer: { email: order.customer.email, first_name: firstName, ...(rest.length ? { last_name: rest.join(' ') } : {}) },
    items,
    config: {
      statement_descriptor: 'BAUL LIBROS',
      online: {
        success_url: backUrl,
        pending_url: backUrl,
        failure_url: backUrl,
        // Mercado Pago solo vuelve solo a direcciones públicas https.
        ...(isPublic ? { auto_return: 'approved' } : {}),
      },
    },
  };

  try {
    const res = await fetch(`${API}/v1/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order.id,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('[mercadopago] Error al crear la orden', res.status, await res.text());
      return { ok: false, error: 'No pudimos iniciar el pago con Mercado Pago. Probá de nuevo en un rato.' };
    }
    const data = (await res.json()) as { id?: string; checkout_url?: string };
    if (!data.checkout_url || !data.id) return { ok: false, error: 'Mercado Pago no devolvió el link de pago.' };
    return { ok: true, checkoutUrl: data.checkout_url, mpOrderId: data.id };
  } catch (err) {
    console.error('[mercadopago] Sin conexión', err);
    return { ok: false, error: 'No pudimos conectar con Mercado Pago. Probá de nuevo en un rato.' };
  }
}

export interface MpOrder {
  id: string;
  status: string;
  status_detail?: string;
  external_reference?: string;
  total_paid_amount?: string;
  transactions?: { payments?: { id: string; status?: string; status_detail?: string }[] };
}

/** Consulta una orden directamente a Mercado Pago (fuente confiable, no lo que mande el aviso). */
export async function getMpOrder(mpOrderId: string): Promise<MpOrder | null> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}/v1/orders/${encodeURIComponent(mpOrderId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('[mercadopago] No se pudo consultar la orden', mpOrderId, res.status);
    return null;
  }
  return (await res.json()) as MpOrder;
}

/** Pagada y acreditada. */
export function isMpOrderPaid(o: MpOrder) {
  if (o.status === 'processed' && o.status_detail === 'accredited') return true;
  return (o.transactions?.payments ?? []).some((p) => p.status === 'processed' && p.status_detail === 'accredited');
}

/** Todavía puede pagarse (efectivo pendiente, en revisión). */
export function isMpOrderPending(o: MpOrder) {
  return ['created', 'processing', 'action_required'].includes(o.status);
}

/** Pedidos viejos (API de Preferences): consulta un pago suelto. */
export async function getPayment(paymentId: string) {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return null;
  const res = await fetch(`${API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('[mercadopago] No se pudo consultar el pago', paymentId, res.status);
    return null;
  }
  return (await res.json()) as { id: number; status: string; external_reference?: string; transaction_amount?: number };
}

/**
 * Verifica la firma del aviso (x-signature) si MP_WEBHOOK_SECRET está configurado.
 * https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyWebhookSignature(request: Request, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;
  const signature = request.headers.get('x-signature') ?? '';
  const requestId = request.headers.get('x-request-id') ?? '';
  const parts = Object.fromEntries(signature.split(',').map((p) => p.trim().split('=') as [string, string]));
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
