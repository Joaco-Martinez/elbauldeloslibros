import { formatPrice } from '@/lib/formatPrice';
import { whatsappUrl } from '@/lib/site';

/** Link de WhatsApp con el mensaje del comprobante ya escrito (número de pedido + monto). */
export const receiptWhatsappUrl = (orderId: string, total: number) =>
  whatsappUrl(
    `Hola! Te mando el comprobante de la transferencia del pedido ${orderId} por ${formatPrice(total)}.`,
  );

/** Link que le vuelve a llenar el carrito al cliente: /checkout?c=libro:2,otro:1 */
export const restoreCartUrl = (origin: string, items: { id: string; qty: number }[]) =>
  `${origin}/checkout?c=${items.map((i) => `${encodeURIComponent(i.id)}:${i.qty}`).join(',')}`;

/** Link a la página para dejar la opinión del pedido. */
export const opinionUrl = (origin: string, orderId: string, token: string) =>
  `${origin}/pedido/${encodeURIComponent(orderId)}/opinion?t=${token}`;

/** Link a la página de seguimiento del pedido. */
export const trackingUrl = (origin: string, orderId: string, token: string) =>
  `${origin}/pedido/${encodeURIComponent(orderId)}?t=${token}`;
