import type { ShippingMode } from '@/lib/shipping';

/**
 * Formas de recibir el pedido.
 * - 'envio': Correo Argentino a domicilio (se llama así por los pedidos viejos).
 * - 'sucursal': Correo Argentino a sucursal.
 * - 'retiro' y 'uber': solo Córdoba Capital.
 */
export type Delivery = 'envio' | 'sucursal' | 'retiro' | 'uber';

export const DELIVERY_LABEL: Record<Delivery, string> = {
  envio: 'Envío a domicilio',
  sucursal: 'Envío a sucursal',
  retiro: 'Retiro en persona',
  uber: 'Uber Moto',
};

/** Lo que se muestra en la línea "Envío" del resumen cuando no hay costo calculado. */
export const DELIVERY_SUMMARY: Record<Delivery, string> = {
  envio: 'Correo Argentino a domicilio',
  sucursal: 'Correo Argentino a sucursal',
  retiro: 'Retiro · lo coordinamos por WhatsApp',
  uber: 'Uber Moto · lo coordinamos por WhatsApp',
};

export const DELIVERY_DETAIL: Record<Delivery, string> = {
  envio: 'Correo Argentino te lo lleva a tu casa.',
  sucursal: 'Lo retirás en la sucursal de Correo Argentino que elijas. Es la opción más económica.',
  retiro: 'Sin costo. Te escribimos por WhatsApp para acordar dónde y cuándo.',
  uber: 'Hasta donde estés. Coordinamos por WhatsApp; el viaje lo pagás vos.',
};

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const CAPITAL_NAMES = ['cordoba', 'cordoba capital', 'ciudad de cordoba', 'cordoba ciudad', 'cba', 'cba capital', 'capital'];

/**
 * Córdoba Capital: provincia Córdoba y localidad "Córdoba".
 * Si no escribieron la localidad todavía, se usa el código postal (5000–5024).
 * Si escribieron otra localidad (ej. Potrero de Garay), no es Capital aunque el CP diga 5000.
 */
export function isCordobaCapital(provincia: string, ciudad: string, cp: string) {
  if (provincia !== 'Córdoba') return false;
  const city = normalize(ciudad);
  if (city) return CAPITAL_NAMES.includes(city);
  const digits = cp.replace(/\D/g, '');
  if (digits.length < 4) return false;
  const n = Number(digits.slice(0, 4));
  return n >= 5000 && n <= 5024;
}

export const isLocalDelivery = (d: Delivery) => d === 'retiro' || d === 'uber';

/** Modalidad de Correo Argentino para un pedido con envío, o null si es retiro / Uber. */
export function shippingModeOf(d: Delivery): ShippingMode | null {
  if (d === 'envio') return 'domicilio';
  if (d === 'sucursal') return 'sucursal';
  return null;
}
