import { isAdmin } from '@/lib/adminAuth';
import { customerStatusEmail } from '@/lib/emails';
import { orderStore } from '@/lib/orderStore';
import { getOrigin } from '@/lib/origin';

/** Vista previa del mail que recibe el cliente con el estado actual (solo admin). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response('No autorizado', { status: 401 });
  const order = await orderStore.get(decodeURIComponent((await params).id));
  if (!order) return new Response('No encontrado', { status: 404 });
  const lastNote = [...order.history].reverse().find((e) => e.status === order.status)?.note;
  const mail = customerStatusEmail(order, await getOrigin(), lastNote);
  return new Response(mail.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}
