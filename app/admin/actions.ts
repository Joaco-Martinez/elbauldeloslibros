'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CART_ID_RE, cartStore } from '@/lib/abandonedCarts';
import { WITHDRAWAL_CODE_RE, withdrawalStore } from '@/lib/withdrawals';
import { checkPassword, endSession, isAdmin, startSession } from '@/lib/adminAuth';
import { sendReviewRequest, sendStatusEmail } from '@/lib/notify';
import { feedbackStore, type ReviewStatus } from '@/lib/reviews';
import { isValidYMD } from '@/lib/orderStatus';
import { orderStore } from '@/lib/orderStore';
import { applyStatusChange } from '@/lib/orders';
import type { OrderStatus } from '@/lib/orderTypes';
import { getOrigin } from '@/lib/origin';
import { adjustStock, releaseStock, reserveStock, setStock } from '@/lib/stock';
import { getBook } from '@/data/books';

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

// Freno simple a intentos de contraseña (por instancia del servidor).
let failedAttempts = 0;
let lockedUntil = 0;

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (Date.now() < lockedUntil) return { error: 'Demasiados intentos. Esperá un minuto.' };
  const password = String(form.get('password') ?? '');
  if (!checkPassword(password)) {
    failedAttempts += 1;
    if (failedAttempts >= 5) {
      lockedUntil = Date.now() + 60_000;
      failedAttempts = 0;
    }
    return { error: 'Contraseña incorrecta.' };
  }
  failedAttempts = 0;
  await startSession();
  redirect('/admin/pedidos');
}

export async function logout() {
  await endSession();
  redirect('/admin/pedidos');
}

const STATUSES: OrderStatus[] = ['recibido', 'pago_confirmado', 'preparando', 'enviado', 'entregado', 'cancelado'];

export async function updateOrder(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { error: 'Tu sesión venció. Volvé a entrar.' };

  const id = String(form.get('id') ?? '');
  const status = String(form.get('status') ?? '') as OrderStatus;
  const note = String(form.get('note') ?? '').slice(0, 500);
  const carrier = String(form.get('carrier') ?? '').trim().slice(0, 80);
  const tracking = String(form.get('tracking') ?? '').trim().slice(0, 80);
  const eta = String(form.get('eta') ?? '').trim();
  const notify = form.get('notify') === 'on';

  if (!STATUSES.includes(status)) return { error: 'Estado inválido.' };
  if (eta && !isValidYMD(eta)) return { error: 'Fecha estimada inválida.' };

  const order = await orderStore.get(id);
  if (!order) return { error: 'No encontramos el pedido.' };

  const { order: updated, statusChanged } = applyStatusChange(order, {
    status,
    note,
    shipping: { carrier: carrier || undefined, tracking: tracking || undefined, eta: eta || undefined },
  });

  // Stock: cancelar devuelve las unidades; reactivar un pedido cancelado las vuelve a descontar.
  let stockChanged = false;
  if (status === 'cancelado' && order.status !== 'cancelado') {
    await releaseStock(order.stockReserved);
    updated.stockReserved = [];
    stockChanged = true;
  } else if (order.status === 'cancelado' && status !== 'cancelado') {
    const reservation = await reserveStock(order.lines);
    if (!reservation.ok) return { error: `No se puede reactivar: ${reservation.error}` };
    updated.stockReserved = reservation.reserved;
    stockChanged = true;
  }

  await orderStore.save(updated);
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath('/admin/pedidos');
  if (stockChanged) revalidatePath('/', 'layout');

  if (!notify) return { ok: true, message: 'Guardado. No se avisó al cliente.' };

  const mail = await sendStatusEmail(updated, await getOrigin(), note.trim() || undefined);
  const what = statusChanged ? 'Estado actualizado' : 'Datos guardados';
  if (mail === 'sent') return { ok: true, message: `${what} y mail enviado a ${updated.customer.email}.` };
  if (mail === 'skipped') return { ok: true, message: `${what}. El mail no salió porque falta configurar Resend (mirá la vista previa).` };
  return { ok: true, message: `${what}, pero el mail falló. Probá reenviarlo.` };
}

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

/** Botones − / + del panel de stock. */
export async function changeStock(form: FormData) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  const id = String(form.get('id') ?? '');
  const delta = Number(form.get('delta'));
  if (!getBook(id) || !Number.isInteger(delta) || Math.abs(delta) > 1000) return;
  await adjustStock(id, delta);
  revalidatePath('/', 'layout');
}

/** Campo "cargar cantidad exacta" del panel de stock. */
export async function saveStock(_prev: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) return { error: 'Tu sesión venció. Volvé a entrar.' };
  const id = String(form.get('id') ?? '');
  const raw = String(form.get('units') ?? '').trim();
  const units = Number(raw);
  if (!getBook(id)) return { error: 'Libro inexistente.' };
  if (raw === '' || !Number.isInteger(units) || units < 0 || units > 100000) return { error: 'Poné un número entero, 0 o más.' };
  await setStock(id, units);
  revalidatePath('/', 'layout');
  return { ok: true, message: units === 0 ? 'Guardado: agotado, no se muestra en la web.' : `Guardado: ${units} en stock.` };
}

// ---------------------------------------------------------------------------
// Carritos abandonados
// ---------------------------------------------------------------------------

/** Marca que ya le escribiste (o lo desmarca). */
export async function markCartContacted(form: FormData) {
  if (!(await isAdmin())) return;
  const id = String(form.get('id') ?? '');
  if (!CART_ID_RE.test(id)) return;
  const cart = await cartStore.get(id);
  if (!cart) return;
  const { contactedAt, ...rest } = cart;
  await cartStore.save(contactedAt ? rest : { ...rest, contactedAt: new Date().toISOString() });
  revalidatePath('/admin/carritos');
}

/** Lo saca de la lista (ya compró por otro lado, era una prueba, etc.). */
export async function discardCart(form: FormData) {
  if (!(await isAdmin())) return;
  const id = String(form.get('id') ?? '');
  if (!CART_ID_RE.test(id)) return;
  await cartStore.remove(id);
  revalidatePath('/admin/carritos');
}

// ---------------------------------------------------------------------------
// Arrepentimientos
// ---------------------------------------------------------------------------

/** Marca un arrepentimiento como resuelto (devolución hecha y dinero reintegrado), o lo vuelve a abrir. */
export async function toggleWithdrawalResolved(form: FormData) {
  if (!(await isAdmin())) return;
  const code = String(form.get('code') ?? '');
  if (!WITHDRAWAL_CODE_RE.test(code)) return;
  const w = await withdrawalStore.get(code);
  if (!w) return;
  const { resolvedAt, ...rest } = w;
  await withdrawalStore.save(resolvedAt ? rest : { ...rest, resolvedAt: new Date().toISOString() });
  revalidatePath('/admin/arrepentimientos');
  revalidatePath('/admin/pedidos');
}

// ---------------------------------------------------------------------------
// Opiniones
// ---------------------------------------------------------------------------

const REVIEW_STATUSES: ReviewStatus[] = ['pendiente', 'aprobada', 'rechazada'];

/** Aprueba o rechaza la reseña de un libro (aprobada = se publica en la página del libro). */
export async function setBookReviewStatus(form: FormData) {
  if (!(await isAdmin())) return;
  const orderId = String(form.get('orderId') ?? '');
  const bookId = String(form.get('bookId') ?? '');
  const status = String(form.get('status') ?? '') as ReviewStatus;
  if (!REVIEW_STATUSES.includes(status)) return;
  const f = await feedbackStore.get(orderId);
  if (!f) return;
  await feedbackStore.save({ ...f, books: f.books.map((b) => (b.bookId === bookId ? { ...b, status } : b)) });
  revalidatePath('/admin/opiniones');
  if (getBook(bookId)) revalidatePath(`/catalogo/${bookId}`);
}

/** Aprueba o rechaza la opinión de la tienda (solo se muestra si el cliente dio permiso). */
export async function setStoreReviewStatus(form: FormData) {
  if (!(await isAdmin())) return;
  const orderId = String(form.get('orderId') ?? '');
  const status = String(form.get('status') ?? '') as ReviewStatus;
  if (!REVIEW_STATUSES.includes(status)) return;
  const f = await feedbackStore.get(orderId);
  if (!f) return;
  await feedbackStore.save({ ...f, store: { ...f.store, status } });
  revalidatePath('/admin/opiniones');
  revalidatePath('/', 'layout');
}

/** Botón "Mandar mail ¿Cómo te fue?" del pedido. */
export async function requestReviewByEmail(form: FormData) {
  if (!(await isAdmin())) return;
  const order = await orderStore.get(String(form.get('id') ?? ''));
  if (!order || order.status !== 'entregado' || order.reviewedAt) return;
  const result = await sendReviewRequest(order, await getOrigin());
  if (result === 'sent') await orderStore.save({ ...order, reviewRequestedAt: new Date().toISOString() });
  revalidatePath(`/admin/pedidos/${order.id}`);
}
