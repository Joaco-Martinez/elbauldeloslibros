/**
 * Mantenimiento web del sitio (sistema de cobranza de mensualidades): si hay un pago pendiente y si el
 * sitio está suspendido por falta de pago. Lo usan el middleware, el aviso del panel y /admin/servicio-web.
 * Sin las variables configuradas o si la API no responde, el sitio nunca se suspende.
 * Sin imports de Node: corre también en el middleware.
 */
const API = process.env.NEXT_PUBLIC_MENSUALIDADES_API_URL?.replace(/\/$/, '');
const TOKEN = process.env.NEXT_PUBLIC_MENSUALIDADES_SITE_TOKEN;
const CACHE_MS = 5 * 60_000;

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export interface ServiceCharge {
  id: string;
  month: number;
  year: number;
  status: 'PENDING_PAYMENT' | 'PENDING_CONFIRMATION' | 'REJECTED';
  amountARS: string;
  dueDate: string;
  suspendFrom: string;
}

export interface ServiceStatus {
  suspended: boolean;
  payUrl: string;
  project: { name: string };
  charges: ServiceCharge[];
}

let cached: { status: ServiceStatus | null; at: number } | null = null;

export async function getServiceStatus(): Promise<ServiceStatus | null> {
  if (!API || !TOKEN) return null;
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.status;
  try {
    const res = await fetch(`${API}/site/${TOKEN}/status`, {
      next: { revalidate: CACHE_MS / 1000 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const status = (await res.json()) as ServiceStatus;
    cached = { status, at: Date.now() };
    return status;
  } catch {
    // Si cobranza no responde, se usa el último estado conocido (o ninguno: el sitio sigue online).
    return cached?.status ?? null;
  }
}

/** Cobros que faltan pagar (los informados quedan en revisión y no cuentan). */
export const owedCharges = (status: ServiceStatus | null): ServiceCharge[] =>
  status?.charges.filter((c) => c.status === 'PENDING_PAYMENT' || c.status === 'REJECTED') ?? [];

export const chargePeriod = (c: ServiceCharge) => `${MONTHS[c.month - 1]} ${c.year}`;

export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' });

/** Por qué no se pudo consultar el estado: se muestra en /admin/servicio-web para revisar las variables. */
export async function diagnoseService(): Promise<string> {
  if (!API || !TOKEN) {
    return 'Faltan NEXT_PUBLIC_MENSUALIDADES_API_URL y NEXT_PUBLIC_MENSUALIDADES_SITE_TOKEN en Vercel (se copian desde cobranza → Proyectos → Sitio). Después de cargarlas hay que hacer un Redeploy.';
  }
  try {
    const res = await fetch(`${API}/site/${TOKEN}/status`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (res.ok) return 'La conexión con cobranza funciona. Recargá la página.';
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    if (res.status === 404 && body?.message === 'Proyecto no encontrado') {
      return 'El token no corresponde a ningún proyecto de cobranza. Copialo de nuevo desde Proyectos → Sitio y hacé un Redeploy.';
    }
    if (res.status === 404) {
      return `${API} no parece ser la API de cobranza (tiene que terminar en /api). Revisá NEXT_PUBLIC_MENSUALIDADES_API_URL y hacé un Redeploy.`;
    }
    return `Cobranza respondió con un error (${res.status}). Probá de nuevo en un rato.`;
  } catch {
    return `No se pudo conectar con ${API}. Revisá NEXT_PUBLIC_MENSUALIDADES_API_URL o probá de nuevo en un rato.`;
  }
}
