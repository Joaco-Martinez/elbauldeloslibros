import type { Delivery } from '@/lib/delivery';
import type { PaymentMethod } from '@/lib/pricing';

export type OrderStatus = 'recibido' | 'pago_confirmado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado';

export interface Customer {
  nombre: string;
  email: string;
  telefono: string;
  calle: string;
  pisoDepto: string;
  ciudad: string;
  provincia: string;
  cp: string;
  notas: string;
}

/** Copia del libro al momento de comprar (si después cambia el precio, el pedido no cambia). */
export interface OrderLine {
  id: string;
  title: string;
  author?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderEvent {
  status: OrderStatus;
  /** ISO */
  at: string;
  note?: string;
}

export interface Shipping {
  carrier?: string;
  tracking?: string;
  /** Fecha estimada de entrega, YYYY-MM-DD (hora de Argentina). */
  eta?: string;
}

export interface Order {
  id: string;
  /** Clave secreta para ver el seguimiento sin iniciar sesión. */
  token: string;
  createdAt: string;
  updatedAt: string;
  method: PaymentMethod;
  /** Forma de entrega. Pedidos viejos sin este dato = 'envio'. */
  delivery?: Delivery;
  customer: Customer;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  /** Costo de envío cobrado (Correo Argentino). Pedidos viejos sin este dato = 0. */
  shippingCost?: number;
  total: number;
  status: OrderStatus;
  history: OrderEvent[];
  shipping: Shipping;
  mpPaymentId?: string;
  /** Id de la orden en Mercado Pago (API de Orders). */
  mpOrderId?: string;
  /** Link de pago de Mercado Pago (para reenviarlo si el cliente no terminó de pagar). */
  mpInitPoint?: string;
  /** Cuándo se le pidió la opinión (mail "¿Cómo te fue?"). */
  reviewRequestedAt?: string;
  /** Cuándo dejó su opinión. */
  reviewedAt?: string;
  /** Se canceló solo porque pasaron 24 h sin el pago (ISO). */
  expiredAt?: string;
  /** Mercado Pago acreditó el pago después de vencer y ya no había stock: hay que devolverlo o conseguir el libro. */
  paidAfterExpiry?: boolean;
  /** Cuándo el cliente subió el comprobante de transferencia desde la web (ISO). Ver lib/receipts.ts. */
  receiptAt?: string;
  /** Unidades que este pedido descontó del stock (se devuelven si se cancela). */
  stockReserved?: { id: string; qty: number }[];
}
