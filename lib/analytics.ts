import { fullTitle, getBook, getCategory } from '@/data/books';

/**
 * Medición: Google Analytics 4 y Meta Pixel (Facebook/Instagram).
 * Se activan solo si están cargadas NEXT_PUBLIC_GA_ID y/o NEXT_PUBLIC_META_PIXEL_ID (ver components/analytics/Analytics.tsx).
 * Sin esas variables, estas funciones no hacen nada.
 *
 * Eventos del embudo de compra (los nombres son los estándar de GA4; Meta usa los suyos):
 *   view_item → add_to_cart → begin_checkout → add_shipping_info → add_payment_info → purchase
 */

export interface AnalyticsItem {
  id: string;
  name: string;
  /** Precio de lista (Mercado Pago) por unidad. */
  price: number;
  quantity?: number;
  category?: string;
}

type Params = { value?: number; items: AnalyticsItem[]; [key: string]: unknown };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENT: Record<string, string | undefined> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
};

export function track(event: string, params: Params) {
  if (typeof window === 'undefined') return;
  const value = params.value ?? params.items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
  try {
    window.gtag?.('event', event, {
      currency: 'ARS',
      value,
      ...params,
      items: params.items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        item_category: i.category,
        price: i.price,
        quantity: i.quantity ?? 1,
      })),
    });
    const meta = META_EVENT[event];
    if (meta) {
      window.fbq?.('track', meta, {
        currency: 'ARS',
        value,
        content_type: 'product',
        content_ids: params.items.map((i) => i.id),
        num_items: params.items.reduce((n, i) => n + (i.quantity ?? 1), 0),
      });
    }
  } catch {
    // La medición nunca tiene que romper la compra.
  }
}

/** Ítems del carrito en el formato de medición (con título, precio y género de cada libro). */
export function analyticsItems(items: { id: string; qty: number }[]): AnalyticsItem[] {
  return items.flatMap((i) => {
    const book = getBook(i.id);
    return book
      ? [{ id: book.id, name: fullTitle(book), price: book.price, quantity: i.qty, category: getCategory(book.category).label }]
      : [];
  });
}
