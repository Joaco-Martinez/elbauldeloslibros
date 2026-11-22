/** Con esta cantidad o menos, la tarjeta muestra "¡Quedan X!". */
export const LOW_STOCK = 3;

/** Etiqueta de urgencia según el stock real (sin controlar o con más de 3: nada). */
export function lowStockBadge(units: number | null | undefined) {
  if (typeof units !== 'number' || units <= 0 || units > LOW_STOCK) return undefined;
  return units === 1 ? '¡Queda 1!' : `¡Quedan ${units}!`;
}
