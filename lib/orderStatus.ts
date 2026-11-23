import type { Order, OrderStatus } from '@/lib/orderTypes';

/** Recorrido normal de un pedido (la línea de tiempo). */
export const FLOW = ['recibido', 'pago_confirmado', 'preparando', 'enviado', 'entregado'] as const satisfies readonly OrderStatus[];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recibido: 'Pedido recibido',
  pago_confirmado: 'Pago confirmado',
  preparando: 'Preparando tu pedido',
  enviado: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Pedido cancelado',
};

/** Título del mail / encabezado según el estado actual. */
export const STATUS_HEADLINE: Record<OrderStatus, string> = {
  recibido: '¡Recibimos tu pedido!',
  pago_confirmado: 'Tu pago está confirmado.',
  preparando: 'Estamos preparando tu pedido.',
  enviado: '¡Tu pedido está en camino!',
  entregado: '¡Tu pedido llegó!',
  cancelado: 'Tu pedido fue cancelado.',
};

export const stepIndex = (status: OrderStatus) => (FLOW as readonly OrderStatus[]).indexOf(status);

type OrderLike = Pick<Order, 'method' | 'shipping' | 'delivery'> & Partial<Pick<Order, 'expiredAt'>>;

/** Texto para un pedido que se canceló solo por falta de pago. */
export const EXPIRED_DETAIL =
  'Pasaron 24 h y no recibimos el pago, así que liberamos los libros para que otra persona los pueda comprar. Si todavía los querés, volvé a hacer tu pedido: te dejamos el carrito armado.';

/** Nombre del paso según cómo se entrega (el retiro no está "en camino"). */
export function stepLabel(status: OrderStatus, order: Pick<Order, 'delivery'>): string {
  if (order.delivery === 'retiro') {
    if (status === 'enviado') return 'Listo para retirar';
    if (status === 'entregado') return 'Retirado';
  }
  return STATUS_LABEL[status];
}

export function statusHeadline(order: Pick<Order, 'status' | 'delivery'> & Partial<Pick<Order, 'expiredAt'>>): string {
  if (order.status === 'cancelado' && order.expiredAt) return 'Tu reserva venció.';
  if (order.delivery === 'retiro') {
    if (order.status === 'enviado') return '¡Tu pedido está listo para retirar!';
    if (order.status === 'entregado') return '¡Ya retiraste tu pedido!';
  }
  return STATUS_HEADLINE[order.status];
}

/** Texto de cada paso, adaptado al pedido. */
export function stepDetail(status: OrderStatus, order: OrderLike): string {
  switch (status) {
    case 'recibido': {
      const pay =
        order.method === 'transferencia'
          ? 'Para avanzar, subí el comprobante de la transferencia desde esta página (o mandalo por WhatsApp). Te reservamos los libros por 24 h.'
          : 'Estamos esperando la confirmación de Mercado Pago. Te reservamos los libros por 24 h.';
      if (order.delivery === 'retiro') return `${pay} Después te escribimos para coordinar el retiro.`;
      if (order.delivery === 'uber') return `${pay} Después te escribimos para coordinar el Uber Moto.`;
      return pay;
    }
    case 'pago_confirmado':
      return 'Ya registramos tu pago.';
    case 'preparando':
      return 'Revisamos cada ejemplar y lo envolvemos a mano.';
    case 'enviado': {
      if (order.delivery === 'retiro') return 'Ya podés pasar a buscarlo. Coordinamos día y lugar por WhatsApp.';
      if (order.delivery === 'uber') return 'Va en Uber Moto hacia tu dirección.';
      const { carrier, tracking } = order.shipping;
      if (carrier && tracking) return `Lo despachamos por ${carrier}. Número de seguimiento: ${tracking}.`;
      if (carrier) return `Lo despachamos por ${carrier}.`;
      if (tracking) return `Número de seguimiento: ${tracking}.`;
      return 'Ya salió hacia tu casa.';
    }
    case 'entregado':
      return '¡Que lo disfrutes!';
    case 'cancelado':
      return order.expiredAt ? EXPIRED_DETAIL : 'Si tenés dudas, escribinos por WhatsApp.';
  }
}

// ---------------------------------------------------------------------------
// Fechas (siempre en hora de Argentina)
// ---------------------------------------------------------------------------
const TZ = 'America/Argentina/Buenos_Aires';

/** Hoy en Argentina, YYYY-MM-DD. */
export const todayAR = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

const toUTC = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const isValidYMD = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(toUTC(v));

/** "jueves 26 de noviembre" */
export const formatLongDate = (ymd: string) =>
  new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(toUTC(ymd)));

/** "20 nov 2026, 14:05" */
export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: TZ }).format(new Date(iso));

/** Cuánto falta para que llegue (o para retirarlo). null si no hay fecha estimada o ya terminó. */
export function etaInfo(order: Pick<Order, 'status' | 'shipping' | 'delivery'>, today = todayAR()) {
  const eta = order.shipping.eta;
  if (!eta || !isValidYMD(eta) || order.status === 'entregado' || order.status === 'cancelado') return null;
  const days = Math.round((toUTC(eta) - toUTC(today)) / 86_400_000);
  const date = formatLongDate(eta);
  if (order.delivery === 'retiro') {
    if (days <= 0) return { days, date, label: 'Ya lo podés retirar.' };
    if (days === 1) return { days, date, label: `Lo podés retirar desde mañana, ${date}.` };
    return { days, date, label: `Lo podés retirar desde el ${date}: faltan ${days} días.` };
  }
  if (days < 0) return { days, date, label: `Estaba previsto para el ${date}. Te escribimos con novedades.` };
  if (days === 0) return { days, date, label: 'Llega hoy.' };
  if (days === 1) return { days, date, label: `Llega mañana, ${date}.` };
  return { days, date, label: `Llega aprox. el ${date}: faltan ${days} días.` };
}
