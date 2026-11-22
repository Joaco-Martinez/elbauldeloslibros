import { mailEnabled, sendReviewRequest } from '@/lib/notify';
import { orderStore } from '@/lib/orderStore';

/** Días después de "Entregado" para mandar el mail "¿Cómo te fue?". */
export const REVIEW_AFTER_DAYS = 3;
const DAY = 86_400_000;

/** Cuándo se marcó como entregado (último "entregado" del historial). */
const deliveredAt = (history: { status: string; at: string }[]) =>
  [...history].reverse().find((e) => e.status === 'entregado')?.at;

/**
 * Manda el mail "¿Cómo te fue?" a los pedidos entregados hace 3 días o más que todavía no lo recibieron.
 * Solo si los mails están configurados: si no, no marca nada (así sale cuando se configuren).
 * Lo llama el aviso automático (cron) y el panel al abrirse.
 */
export async function sendDueReviewRequests(origin: string, now = Date.now()) {
  if (!mailEnabled()) return 0;
  let sent = 0;
  for (const o of await orderStore.list(500)) {
    if (o.status !== 'entregado' || o.reviewRequestedAt || o.reviewedAt) continue;
    const at = deliveredAt(o.history);
    if (!at || now - Date.parse(at) < REVIEW_AFTER_DAYS * DAY) continue;
    const result = await sendReviewRequest(o, origin);
    if (result === 'sent') {
      await orderStore.save({ ...o, reviewRequestedAt: new Date(now).toISOString() });
      sent += 1;
    }
  }
  return sent;
}
