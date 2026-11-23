import { NextResponse, type NextRequest } from 'next/server';
import { getServiceStatus } from '@/lib/servicioWeb';

/**
 * Sitio suspendido por falta de pago del mantenimiento web (lib/servicioWeb.ts) → los visitantes ven /mantenimiento.
 * Siguen abiertos el panel (desde ahí se paga), el seguimiento de pedidos ya hechos, la vuelta de Mercado Pago
 * y las páginas legales (el botón de arrepentimiento es obligatorio). El navegador con sesión del panel ve todo.
 * Las rutas /api/* no pasan por acá: el webhook de Mercado Pago y el cron siguen funcionando.
 */
const ADMIN_COOKIE = 'bdl_admin';
const ALWAYS_OPEN = [
  '/admin',
  '/mantenimiento',
  '/pedido',
  '/checkout/gracias',
  '/arrepentimiento',
  '/cambios-y-devoluciones',
  '/terminos',
  '/privacidad',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const suspended = (await getServiceStatus())?.suspended ?? false;

  if (pathname === '/mantenimiento') {
    return suspended ? NextResponse.next() : NextResponse.redirect(new URL('/', req.url));
  }
  const open = ALWAYS_OPEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!suspended || open || req.cookies.has(ADMIN_COOKIE)) return NextResponse.next();

  // 503 + Retry-After: Google entiende que es temporal y no saca el sitio de los resultados.
  return NextResponse.rewrite(new URL('/mantenimiento', req.url), {
    status: 503,
    headers: { 'Retry-After': '3600' },
  });
}

export const config = {
  // Todo menos los archivos internos de Next, la API y los estáticos (imágenes, íconos, robots, sitemap...).
  matcher: ['/((?!_next/|api/|apple-icon|.*\\..*).*)'],
};
