import { headers } from 'next/headers';

/** URL pública del sitio (para links en mails y Mercado Pago). */
export async function getOrigin(): Promise<string> {
  const fromEnv = process.env.SITE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
