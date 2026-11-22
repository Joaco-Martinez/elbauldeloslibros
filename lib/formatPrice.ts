const formatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/** 18900 → "$ 18.900" */
export function formatPrice(value: number): string {
  return formatter.format(value);
}
