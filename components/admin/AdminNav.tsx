import Link from 'next/link';
import { logout } from '@/app/admin/actions';

type Tab = 'pedidos' | 'carritos' | 'stock' | 'opiniones' | 'arrepentimientos';

/** Menú del panel: Pedidos / Carritos / Stock / Cerrar sesión. */
export function AdminNav({ current }: { current: Tab }) {
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
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <nav aria-label="Panel" className="flex flex-wrap gap-2">
        {tab('pedidos', 'Pedidos')}
        {tab('carritos', 'Carritos')}
        {tab('stock', 'Stock')}
        {tab('opiniones', 'Opiniones')}
        {tab('arrepentimientos', 'Arrepentimientos')}
      </nav>
      <form action={logout}>
        <button type="submit" className="text-[13px] font-bold underline underline-offset-2">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
