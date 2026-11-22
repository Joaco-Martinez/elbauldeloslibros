import type { OrderStatus } from '@/lib/orderTypes';

export const adminInput =
  'h-11 w-full rounded-[12px] border-[1.5px] border-ink bg-cream px-3.5 text-[14px] font-medium text-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest';

/** Colores de la etiqueta de estado (todas con contraste AA). */
export const STATUS_BADGE: Record<OrderStatus, string> = {
  recibido: 'bg-mustard text-forest',
  pago_confirmado: 'bg-forest text-cream',
  preparando: 'bg-beige text-ink',
  enviado: 'bg-brick text-cream',
  entregado: 'bg-forest text-mustard',
  cancelado: 'bg-ink text-cream',
};
