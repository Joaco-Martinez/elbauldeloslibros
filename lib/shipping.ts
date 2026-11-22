/**
 * Costo de envío por Correo Argentino (PAQ.AR Clásico) saliendo de Córdoba Capital.
 *
 * Precios cotizados en MiCorreo (noviembre 2026) y redondeados para arriba a $ 100.
 * Cuando cambien las tarifas, actualizá solo la tabla RATES.
 * Cuando llegue la API de Correo Argentino, esto se reemplaza por la cotización automática.
 */

export type ShippingZone = 'general' | 'intermedia' | 'lejana';
export type ShippingMode = 'sucursal' | 'domicilio';

/** Paquete chico (1–2 libros, hasta 1 kg) y grande (3–5 libros, hasta 3 kg). */
const RATES: Record<ShippingZone, Record<ShippingMode, { kg1: number; kg3: number }>> = {
  // Cotizado: Río Cuarto y Santa Fe / Rosario.
  general: { sucursal: { kg1: 7500, kg3: 9700 }, domicilio: { kg1: 11400, kg3: 12300 } },
  // Cotizado: Neuquén y Salta.
  intermedia: { sucursal: { kg1: 8200, kg3: 11000 }, domicilio: { kg1: 12400, kg3: 13900 } },
  // Cotizado: Río Gallegos.
  lejana: { sucursal: { kg1: 8600, kg3: 12500 }, domicilio: { kg1: 12400, kg3: 14800 } },
};

/** El envío más barato (para "desde $ X"). */
export const SHIPPING_FROM = Math.min(...Object.values(RATES).map((z) => z.sucursal.kg1));

/**
 * Zona de cada provincia. Las que no cotizamos van en la zona más cara posible,
 * así ningún envío queda cobrado de menos. Si al despachar ves que una sale más barata, cambiala acá.
 */
const ZONES: Record<string, ShippingZone> = {
  Córdoba: 'general',
  'Santa Fe': 'general',
  'Entre Ríos': 'general',
  'San Luis': 'general',
  'Santiago del Estero': 'general',
  'La Rioja': 'general',
  Catamarca: 'general',
  Tucumán: 'general',
  // CABA cotiza igual que Rosario, pero se cobra como intermedia (decisión del negocio: deja margen).
  'Ciudad Autónoma de Buenos Aires': 'intermedia',
  'Buenos Aires': 'intermedia',
  Mendoza: 'intermedia',
  'San Juan': 'intermedia',
  'La Pampa': 'intermedia',
  Salta: 'intermedia',
  Jujuy: 'intermedia',
  Chaco: 'intermedia',
  Formosa: 'intermedia',
  Corrientes: 'intermedia',
  Misiones: 'intermedia',
  Neuquén: 'intermedia',
  'Río Negro': 'intermedia',
  Chubut: 'lejana',
  'Santa Cruz': 'lejana',
  'Tierra del Fuego': 'lejana',
};

/** Libros por caja grande. Más que esto se manda en varias cajas. */
const BOOKS_PER_BOX = 5;

export const SHIPPING_ETA: Record<ShippingZone, string> = {
  general: '2 a 5 días hábiles',
  intermedia: '3 a 6 días hábiles',
  lejana: '4 a 8 días hábiles',
};

export function shippingZone(provincia: string): ShippingZone | null {
  return ZONES[provincia] ?? null;
}

/** Cajas que hacen falta: de a 5 libros; la última es chica si lleva 1 o 2. */
export function packagesFor(bookCount: number): ('kg1' | 'kg3')[] {
  const boxes: ('kg1' | 'kg3')[] = [];
  let left = Math.max(0, bookCount);
  while (left > 0) {
    const inBox = Math.min(left, BOOKS_PER_BOX);
    boxes.push(inBox <= 2 ? 'kg1' : 'kg3');
    left -= inBox;
  }
  return boxes;
}

/** Peso aproximado para la etiqueta (≈ 0,45 kg por libro + 0,1 kg de caja). */
export function estimatedWeightKg(bookCount: number) {
  return Math.round((bookCount * 0.45 + 0.1 * packagesFor(bookCount).length) * 10) / 10;
}

/** Costo del envío o null si la provincia no está en la tabla. */
export function shippingCost(provincia: string, mode: ShippingMode, bookCount: number): number | null {
  const zone = shippingZone(provincia);
  if (!zone || bookCount < 1) return null;
  return packagesFor(bookCount).reduce((sum, box) => sum + RATES[zone][mode][box], 0);
}
