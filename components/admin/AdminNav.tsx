import Link from 'next/link';
import { logout } from '@/app/admin/actions';
import { chargePeriod, formatDay, getServiceStatus, owedCharges } from '@/lib/servicioWeb';

type Tab = 'pedidos' | 'carritos' | 'libros' | 'secciones' | 'stock' | 'opiniones' | 'arrepentimientos' | 'servicio-web';

/** Menú del panel: Pedidos / Carritos / Libros / Secciones / Stock / … / Cerrar sesión, con el aviso de pago del servicio web. */
export async function AdminNav({ current }: { current: Tab }) {
  const status = await getServiceStatus();
  const owed = owedCharges(status);
  const tab = (key: Tab, label: string) => (
    <Link
      href={`/admin/${key}`}
      aria-current={current === key ? 'page' : undefined}
      className={`btn h-9 px-4 text-[13px] ${current === key ? 'bg-forest text-cream' : 'border-[1.5px] border-ink text-ink'}`}
    >
      {label}
    </Link>
  );
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Panel" className="flex flex-wrap gap-2">
          {tab('pedidos', 'Pedidos')}
          {tab('carritos', 'Carritos')}
          {tab('libros', 'Libros')}
          {tab('secciones', 'Secciones')}
          {tab('stock', 'Stock')}
          {tab('opiniones', 'Opiniones')}
          {tab('arrepentimientos', 'Arrepentimientos')}
          {status && tab('servicio-web', 'Servicio web')}
        </nav>
        <form action={logout}>
          <button type="submit" className="text-[13px] font-bold underline underline-offset-2">
            Cerrar sesión
          </button>
        </form>
      </div>
      {status && owed.length > 0 && current !== 'servicio-web' && (
        <Link
          href="/admin/servicio-web"
          className={`focus-ring mb-6 block rounded-card px-5 py-4 text-[14px] font-bold hover:underline ${
            status.suspended ? 'bg-brick text-cream' : 'bg-mustard text-forest'
          }`}
        >
          {status.suspended
            ? '⚠ La tienda está en mantenimiento por falta de pago del servicio web: los clientes no la pueden ver. Pagar ahora →'
            : `⚠ Pago pendiente del mantenimiento web (${chargePeriod(owed[0])}). Si no se paga, la tienda pasa a mantenimiento el ${formatDay(owed[0].suspendFrom)}. Pagar ahora →`}
        </Link>
      )}
    </>
  );
}
