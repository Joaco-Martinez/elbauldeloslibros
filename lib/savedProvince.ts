/** Provincia elegida en el carrito (para calcular el envío): se recuerda y el checkout la completa sola. */
const KEY = 'bdl-provincia';

export function readSavedProvince(): string {
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveProvince(provincia: string) {
  try {
    if (provincia) window.localStorage.setItem(KEY, provincia);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Sin almacenamiento (modo privado): no pasa nada, solo no se recuerda.
  }
}
