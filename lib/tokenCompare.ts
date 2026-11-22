import { createHash, timingSafeEqual } from 'node:crypto';

/** Compara secretos sin filtrar información por tiempo de respuesta. */
export function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
