import { randomBytes } from 'node:crypto';
import { fullTitle, getBook } from '@/data/books';
import { isCordobaCapital, isLocalDelivery, shippingModeOf, type Delivery } from '@/lib/delivery';
import { MAX_QTY_PER_BOOK } from '@/lib/limits';
import type { Customer, Order, OrderStatus, Shipping } from '@/lib/orderTypes';
import { bookCount, computeTotals, type LineInput, type PaymentMethod } from '@/lib/pricing';
import { shippingCost } from '@/lib/shipping';
import { PROVINCIAS } from '@/lib/site';

export type { Customer, Order } from '@/lib/orderTypes';

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const FIELDS: { key: keyof Customer; label: string; required: boolean; max: number }[] = [
  { key: 'nombre', label: 'Nombre y apellido', required: true, max: 120 },
  { key: 'email', label: 'Email', required: true, max: 160 },
  { key: 'telefono', label: 'Teléfono', required: true, max: 40 },
  { key: 'calle', label: 'Calle y número', required: true, max: 160 },
  { key: 'pisoDepto', label: 'Piso / depto', required: false, max: 40 },
  { key: 'ciudad', label: 'Localidad', required: true, max: 120 },
  { key: 'provincia', label: 'Provincia', required: true, max: 60 },
  { key: 'cp', label: 'Código postal', required: true, max: 12 },
  { key: 'notas', label: 'Notas', required: false, max: 500 },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valida lo que manda el navegador. Los precios se recalculan después, desde el catálogo. */
export function parseOrderRequest(
  body: unknown,
): Result<{ items: LineInput[]; customer: Customer; method: PaymentMethod; delivery: Delivery }> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Pedido inválido.' };
  const { items, customer, method, delivery: rawDelivery } = body as Record<string, unknown>;

  if (method !== 'transferencia' && method !== 'mercadopago') return { ok: false, error: 'Elegí un medio de pago.' };
  const delivery: Delivery =
    rawDelivery === 'retiro' || rawDelivery === 'uber' || rawDelivery === 'sucursal' ? rawDelivery : 'envio';

  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return { ok: false, error: 'El carrito está vacío.' };
  const cleanItems: LineInput[] = [];
  for (const item of items) {
    const id = (item as LineInput)?.id;
    const qty = (item as LineInput)?.qty;
    if (typeof id !== 'string' || !getBook(id)) return { ok: false, error: 'Hay un libro que ya no está en el catálogo.' };
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_BOOK) return { ok: false, error: 'Revisá las cantidades.' };
    cleanItems.push({ id, qty });
  }

  if (!customer || typeof customer !== 'object') return { ok: false, error: 'Completá tus datos.' };
  const raw = customer as Record<string, unknown>;
  const clean = {} as Customer;
  for (const f of FIELDS) {
    const value = typeof raw[f.key] === 'string' ? (raw[f.key] as string).trim() : '';
    // Para retirar en persona o en sucursal no hace falta la calle.
    const required = f.required && !((delivery === 'retiro' || delivery === 'sucursal') && f.key === 'calle');
    if (required && !value) return { ok: false, error: `Completá: ${f.label}.` };
    if (value.length > f.max) return { ok: false, error: `${f.label} es demasiado largo.` };
    clean[f.key] = value;
  }
  if (!EMAIL_RE.test(clean.email)) return { ok: false, error: 'Revisá el email.' };
  // Celular argentino: código de área (sin 0) + número (sin 15) = 10 dígitos. Ej.: "351 5550000".
  const phone = /^([1-9]\d{1,3}) (\d{6,8})$/.exec(clean.telefono);
  if (!phone || phone[1].length + phone[2].length !== 10) {
    return { ok: false, error: 'Revisá el celular: código de área sin 0 y número sin 15 (entre los dos suman 10 números).' };
  }
  if (!(PROVINCIAS as readonly string[]).includes(clean.provincia)) return { ok: false, error: 'Elegí una provincia.' };
  const capital = isCordobaCapital(clean.provincia, clean.ciudad, clean.cp);
  if (isLocalDelivery(delivery) && !capital) {
    return { ok: false, error: 'El retiro y el Uber Moto son solo para Córdoba Capital.' };
  }
  if (!isLocalDelivery(delivery) && capital) {
    return { ok: false, error: 'En Córdoba Capital elegí retiro o Uber Moto.' };
  }
  if (delivery === 'retiro') clean.calle = '';

  return { ok: true, data: { items: cleanItems, customer: clean, method, delivery } };
}

/** Costo de envío según provincia, modalidad y cantidad de libros (siempre calculado en el servidor). */
export function orderShippingCost(items: LineInput[], provincia: string, delivery: Delivery) {
  const mode = shippingModeOf(delivery);
  return mode ? (shippingCost(provincia, mode, bookCount(items)) ?? 0) : 0;
}

export function createOrder(items: LineInput[], customer: Customer, method: PaymentMethod, delivery: Delivery = 'envio'): Order {
  const shippingTotal = orderShippingCost(items, customer.provincia, delivery);
  const totals = computeTotals(items, method, shippingTotal);
  const now = new Date().toISOString();
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(2).toString('hex').toUpperCase();
  return {
    id: `BDL-${stamp}-${rand}`,
    token: randomBytes(16).toString('hex'),
    createdAt: now,
    updatedAt: now,
    method,
    delivery,
    customer,
    lines: totals.lines.map((l) => ({
      id: l.book.id,
      title: fullTitle(l.book), // "Título (tapa dura)" si tiene formato
      author: l.book.author,
      qty: l.qty,
      unitPrice: l.book.price,
      subtotal: l.subtotal,
    })),
    subtotal: totals.subtotal,
    discount: totals.discount,
    shippingCost: totals.shipping,
    total: totals.total,
    status: 'recibido',
    history: [{ status: 'recibido', at: now }],
    shipping: {},
  };
}

/** Aplica un cambio de estado y/o datos de envío. Registra el movimiento en el historial. */
export function applyStatusChange(
  order: Order,
  change: { status: OrderStatus; note?: string; shipping?: Shipping },
): { order: Order; statusChanged: boolean } {
  const now = new Date().toISOString();
  const statusChanged = change.status !== order.status;
  const note = change.note?.trim() || undefined;
  const shipping: Shipping = { ...order.shipping, ...change.shipping };
  const history = statusChanged || note ? [...order.history, { status: change.status, at: now, ...(note ? { note } : {}) }] : order.history;
  return {
    order: { ...order, status: change.status, shipping, history, updatedAt: now },
    statusChanged,
  };
}
