import { formatPrice } from '@/lib/formatPrice';
import type { Order, OrderStatus } from '@/lib/orderTypes';
import { transferInfoComplete, transferRows } from '@/lib/site';

/*
 * Orden y alertas del panel de pedidos.
 *
 * Horario de trabajo para despachar: lunes a viernes todo el día, sábados hasta las 13 h,
 * domingos no se trabaja. (Feriados todavía no se descuentan.)
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Argentina no tiene horario de verano: siempre UTC−3. */
const AR_OFFSET = -3 * HOUR;
const SATURDAY_CUTOFF = 13 * HOUR;

/** Desde acá se avisa "despachalo hoy" (horas antes del vencimiento). */
const DISPATCH_WARNING = 8 * HOUR;
/** Sin pago: cuando quedan estas horas de reserva, sugerir el recordatorio. */
const UNPAID_REMIND_LEFT = 12 * HOUR;
/** Reserva de un pedido sin pagar (igual que en lib/expireOrders.ts). */
const PAYMENT_HOLD_MS = 24 * HOUR;

/** Día de la semana (0 = domingo) y hora del día, en hora de Argentina. */
const local = (ms: number) => {
  const d = new Date(ms + AR_OFFSET);
  return { dow: d.getUTCDay(), time: ms + AR_OFFSET - Math.floor((ms + AR_OFFSET) / DAY) * DAY, dayStart: Math.floor((ms + AR_OFFSET) / DAY) * DAY - AR_OFFSET };
};

/** ¿Cae fuera del horario? Domingo, o sábado después de las 13 h. */
const isClosed = (ms: number) => {
  const { dow, time } = local(ms);
  return dow === 0 || (dow === 6 && time >= SATURDAY_CUTOFF);
};

/** Siguiente lunes a las 00:00 (hora de Argentina). */
const nextMonday = (ms: number) => {
  const { dow, dayStart } = local(ms);
  return dayStart + ((8 - dow) % 7 || 7) * DAY;
};

/**
 * Vencimiento para despachar un pedido pagado: 1 día hábil.
 * - Pagado de lunes a sábado 13 h: 24 h después. Si eso cae el sábado después de las 13 h o
 *   el domingo, pasa al lunes a la misma hora (ej.: viernes 15 h → lunes 15 h).
 * - Pagado el sábado después de las 13 h o el domingo: cuenta desde el lunes, vence al terminar el lunes.
 */
export function dispatchDeadline(paidMs: number) {
  if (isClosed(paidMs)) return nextMonday(paidMs) + DAY;
  const due = paidMs + DAY;
  if (!isClosed(due)) return due;
  return nextMonday(due) + local(due).time;
}

const WEEKDAY = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/**
 * Cuándo vence, en palabras: "hoy antes de las 15:00", "mañana antes de las 10:30",
 * "el lunes antes de las 15:00". Si vence a medianoche: "hoy", "mañana", "el lunes" (en el día).
 */
function deadlineText(due: number, now: number) {
  const midnight = local(due).time === 0;
  // A medianoche, el día que cuenta es el anterior (vence "al terminar el lunes").
  const day = local(midnight ? due - 1 : due);
  const days = Math.round((day.dayStart - local(now).dayStart) / DAY);
  const dayWord = days === 0 ? 'hoy' : days === 1 ? 'mañana' : `el ${WEEKDAY[day.dow]}`;
  if (midnight) return `${dayWord} (en el día)`;
  const hh = new Date(due + AR_OFFSET).toISOString().slice(11, 16);
  return `${dayWord} antes de las ${hh}`;
}

/** Cuándo se confirmó el pago (primer "pago confirmado" del historial). */
export function paidAt(order: Order): string {
  return order.history.find((e) => e.status === 'pago_confirmado' || e.status === 'preparando')?.at ?? order.createdAt;
}

export type Alert = { level: 'late' | 'warn' | 'info'; text: string };

const hoursText = (ms: number) => {
  const h = Math.max(1, Math.round(ms / HOUR));
  return h === 1 ? '1 h' : `${h} h`;
};

const ageText = (ms: number) => {
  if (ms < HOUR) return 'hace menos de 1 h';
  if (ms < DAY) return `hace ${hoursText(ms)}`;
  const d = Math.floor(ms / DAY);
  return d === 1 ? 'hace 1 día' : `hace ${d} días`;
};

const isLocal = (o: Order) => o.delivery === 'retiro' || o.delivery === 'uber';

/** Alerta del pedido según su estado y cuánto tiempo pasó. null si está todo en tiempo. */
export function orderAlert(order: Order, now = Date.now()): Alert | null {
  if (order.paidAfterExpiry) {
    return { level: 'late', text: 'Pagó después de vencer la reserva y ya no había stock: devolvé el pago o conseguí el libro.' };
  }
  if (order.status === 'recibido') {
    const left = Date.parse(order.createdAt) + PAYMENT_HOLD_MS - now;
    if (left <= 0) return { level: 'late', text: 'Venció la reserva: se cancela solo y los libros vuelven al stock.' };
    if (left <= UNPAID_REMIND_LEFT) return { level: 'warn', text: `Sin pago. Se cancela solo en ${hoursText(left)}: mandale un recordatorio.` };
    return { level: 'info', text: `Esperando pago · si no paga, se cancela solo en ${hoursText(left)}` };
  }
  if (order.status === 'pago_confirmado' || order.status === 'preparando') {
    const verb = isLocal(order) ? 'Coordinar la entrega' : 'Despachar';
    const due = dispatchDeadline(Date.parse(paidAt(order)));
    if (now >= due) return { level: 'late', text: 'Atrasado: pasó más de 1 día hábil desde el pago.' };
    const level = due - now <= DISPATCH_WARNING ? 'warn' : 'info';
    return { level, text: `${verb} ${deadlineText(due, now)}.` };
  }
  return null;
}

export interface Section {
  id: string;
  title: string;
  hint: string;
  orders: Order[];
}

const byOldest = (a: Order, b: Order) => a.createdAt.localeCompare(b.createdAt);
const byNewest = (a: Order, b: Order) => b.updatedAt.localeCompare(a.updatedAt);
const ALERT_RANK = { late: 0, warn: 1, info: 2 } as const;

/** Pedidos agrupados en el orden de trabajo: primero lo que hay que cobrar, después despachar, etc. */
export function groupOrders(orders: Order[], now = Date.now()): Section[] {
  const pick = (...s: OrderStatus[]) => orders.filter((o) => s.includes(o.status));
  const urgentFirst = (list: Order[]) =>
    [...list].sort((a, b) => {
      const ra = ALERT_RANK[orderAlert(a, now)?.level ?? 'info'];
      const rb = ALERT_RANK[orderAlert(b, now)?.level ?? 'info'];
      return ra - rb || byOldest(a, b);
    });
  return [
    {
      id: 'esperando-pago',
      title: 'Esperando pago',
      hint: 'Transferencias sin comprobante y pagos de Mercado Pago sin confirmar. Si en 24 h no pagan, se cancelan solos y los libros vuelven al stock.',
      orders: urgentFirst(pick('recibido')),
    },
    {
      id: 'para-despachar',
      title: 'Para despachar',
      hint: 'Pagados. Tenés 1 día hábil para despacharlos (domingos no cuentan; sábados hasta las 13 h).',
      orders: urgentFirst([...pick('pago_confirmado', 'preparando'), ...orders.filter((o) => o.paidAfterExpiry && o.status === 'cancelado')]),
    },
    { id: 'en-camino', title: 'En camino', hint: 'Despachados, todavía no llegaron.', orders: pick('enviado').sort(byOldest) },
    { id: 'entregados', title: 'Entregados', hint: 'Pedidos terminados.', orders: pick('entregado').sort(byNewest) },
    {
      id: 'cancelados',
      title: 'Cancelados',
      hint: 'El stock ya se devolvió. Si alguien pagó tarde por transferencia, abrí el pedido y pasalo a "Pago confirmado": vuelve a reservar el stock.',
      orders: pick('cancelado')
        .filter((o) => !o.paidAfterExpiry)
        .sort(byNewest),
    },
  ];
}

// ---------------------------------------------------------------------------
// Recordatorio de pago por WhatsApp al cliente
// ---------------------------------------------------------------------------

/** wa.me del cliente a partir de "351 5550000" (código de área + número). null si no se puede armar. */
export function customerWhatsappUrl(telefono: string, text: string) {
  const digits = telefono.replace(/\D/g, '').replace(/^0+/, '').replace(/^54/, '');
  if (digits.length !== 10) return null;
  return `https://wa.me/549${digits}?text=${encodeURIComponent(text)}`;
}

export function paymentReminderText(order: Order, now = Date.now()) {
  const name = order.customer.nombre.split(' ')[0];
  const until = deadlineText(Date.parse(order.createdAt) + PAYMENT_HOLD_MS, now)
    .replace(' antes de las ', ' a las ')
    .replace(' (en el día)', ' a la medianoche');
  const intro = `¡Hola ${name}! Te escribimos de El Baul de los Libros por tu pedido ${order.id} de ${formatPrice(order.total)}. Te guardamos los libros hasta ${until}.`;
  if (order.method === 'transferencia') {
    const data = transferInfoComplete() ? ` Te dejo los datos: ${transferRows().map(([k, v]) => `${k}: ${v}`).join(' · ')}.` : '';
    return `${intro} Todavía no nos llegó el comprobante de la transferencia.${data} Cuando la hagas, mandanos el comprobante por acá y lo despachamos. ¿Te podemos ayudar con algo?`;
  }
  const link = order.mpInitPoint ? ` Si querés, podés terminar el pago acá: ${order.mpInitPoint}` : '';
  return `${intro} Vimos que el pago con Mercado Pago quedó sin completar.${link} También podés pagarlo por transferencia con 10% off. ¿Te podemos ayudar con algo?`;
}
