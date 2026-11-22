import { NextResponse } from 'next/server';
import { notifyWithdrawal } from '@/lib/notify';
import { orderStore } from '@/lib/orderStore';
import { applyStatusChange } from '@/lib/orders';
import { newWithdrawalCode, withdrawalStore } from '@/lib/withdrawals';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Freno simple a envíos repetidos (por instancia del servidor).
const recent = new Map<string, number[]>();
function tooMany(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > 5;
}

/**
 * Botón de arrepentimiento: sin registrarse, con nombre y email alcanza.
 * Devuelve el código en el momento (y por mail cuando Resend está configurado).
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (tooMany(ip)) return NextResponse.json({ error: 'Recibimos varios pedidos seguidos. Esperá unos minutos o escribinos por WhatsApp.' }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 });
  }

  const nombre = str(body.nombre, 120);
  const email = str(body.email, 160);
  const telefono = str(body.telefono, 40);
  const pedido = str(body.pedido, 40).toUpperCase();
  const motivo = str(body.motivo, 1000);
  if (!nombre) return NextResponse.json({ error: 'Completá tu nombre.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Revisá el email: ahí te mandamos la constancia.' }, { status: 400 });

  // Si el número de pedido existe y es del mismo email, se vincula y queda anotado en el pedido.
  const order = pedido ? await orderStore.get(pedido) : null;
  const matches = order && order.customer.email.toLowerCase() === email.toLowerCase();

  const code = newWithdrawalCode();
  const withdrawal = {
    code,
    createdAt: new Date().toISOString(),
    nombre,
    email,
    telefono,
    pedido,
    ...(matches ? { orderId: order.id } : {}),
    motivo,
  };
  await withdrawalStore.save(withdrawal);

  if (matches) {
    const { order: updated } = applyStatusChange(order, {
      status: order.status,
      note: `El cliente pidió el arrepentimiento (código ${code}). Coordinar la devolución y reintegrar lo pagado.`,
    });
    await orderStore.save(updated);
  }

  const mail = await notifyWithdrawal(withdrawal);
  return NextResponse.json({ code, emailSent: mail === 'sent' });
}
