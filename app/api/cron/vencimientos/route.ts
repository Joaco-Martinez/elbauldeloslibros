import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/adminAuth';
import { expireUnpaidOrders } from '@/lib/expireOrders';
import { getOrigin } from '@/lib/origin';
import { sendDueReviewRequests } from '@/lib/reviewRequests';
import { safeEqual } from '@/lib/tokenCompare';

/**
 * Cancela los pedidos sin pagar con más de 24 h y devuelve el stock.
 * Lo llaman: el panel al abrirse (con tu sesión) y, ya publicado, un cron cada hora
 * con el encabezado "Authorization: Bearer <CRON_SECRET>".
 */
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') ?? '';
  const byCron = Boolean(secret) && safeEqual(auth, `Bearer ${secret}`);
  if (!byCron && !(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const origin = await getOrigin();
  const expired = await expireUnpaidOrders(origin);
  // De paso: mails "¿Cómo te fue?" a los entregados hace 3 días.
  const reviewRequests = await sendDueReviewRequests(origin).catch((err) => {
    console.error('[opiniones] No se pudieron mandar los pedidos de opinión', err);
    return 0;
  });
  return NextResponse.json({ ok: true, expired, reviewRequests });
}

export const GET = handle;
export const POST = handle;
