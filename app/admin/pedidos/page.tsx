import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminNav } from '@/components/admin/AdminNav';
import { ExpireOnLoad } from '@/components/admin/ExpireOnLoad';
import { LoginForm } from '@/components/admin/LoginForm';
import { OrderRow } from '@/components/admin/OrderRow';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { adminEnabled, isAdmin } from '@/lib/adminAuth';
import { groupOrders, orderAlert, type Alert } from '@/lib/adminQueue';
import type { Order } from '@/lib/orderTypes';
import { orderStore } from '@/lib/orderStore';
import { withdrawalStore } from '@/lib/withdrawals';

export const metadata: Metadata = { title: 'Pedidos', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ entregados?: string }>;
}) {
  if (!adminEnabled()) {
    return (
      <Shell title="Panel.">
        <p className="lede mx-auto text-center">
          El panel está apagado. Para usarlo, agregá <code>ADMIN_PASSWORD</code> en <code>.env.local</code> y reiniciá el sitio.
        </p>
      </Shell>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Shell title="Panel.">
        <LoginForm />
      </Shell>
    );
  }

  const orders = await orderStore.list();
  const now = Date.now();
  const sections = groupOrders(orders, now);
  const alerts = new Map(orders.map((o) => [o.id, orderAlert(o, now)]));
  const late = sections[1].orders.filter((o) => !o.paidAfterExpiry && alerts.get(o.id)?.level === 'late').length;
  const paidLate = orders.filter((o) => o.paidAfterExpiry && o.status === 'cancelado').length;
  const unpaidSoon = sections[0].orders.filter((o) => alerts.get(o.id)?.level !== 'info').length;
  const showAllDone = (await searchParams).entregados === 'todos';
  const openWithdrawals = (await withdrawalStore.list()).filter((w) => !w.resolvedAt).length;

  return (
    <Shell title="Pedidos.">
      <ExpireOnLoad />
      <AdminNav current="pedidos" />

      {openWithdrawals > 0 && (
        <Link
          href="/admin/arrepentimientos"
          className="focus-ring mb-6 block rounded-card bg-brick px-5 py-4 text-[14px] font-bold text-cream hover:underline"
        >
          ⚠ {openWithdrawals === 1 ? '1 cliente pidió' : `${openWithdrawals} clientes pidieron`} el arrepentimiento: escribiles
          dentro de las 24 h hábiles →
        </Link>
      )}

      {orders.length === 0 ? (
        <p className="lede mt-8">Todavía no hay pedidos.</p>
      ) : (
        <>
          {/* Resumen arriba: cuántos hay en cada etapa (salta a la sección). */}
          <nav aria-label="Etapas" className="flex flex-wrap gap-2">
            {sections.slice(0, 4).map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="focus-ring inline-flex h-9 items-center gap-2 rounded-full border-2 border-forest px-4 text-[13px] font-bold hover:bg-beige"
              >
                {s.title}
                <span className="rounded-full bg-forest px-2 text-[12px] text-cream">{s.orders.length}</span>
              </a>
            ))}
          </nav>

          {(late > 0 || paidLate > 0 || unpaidSoon > 0) && (
            <div role="alert" className="mt-5 space-y-1 rounded-card bg-brick px-5 py-4 text-[14px] font-bold text-cream">
              {late > 0 && (
                <p>
                  ⚠ {late === 1 ? '1 pedido pagado lleva' : `${late} pedidos pagados llevan`} más de 1 día hábil sin despachar.
                </p>
              )}
              {paidLate > 0 && (
                <p>
                  ⚠ {paidLate === 1 ? '1 pedido se pagó' : `${paidLate} pedidos se pagaron`} después de vencer la reserva y no hay stock:
                  devolvé el pago o conseguí el libro.
                </p>
              )}
              {unpaidSoon > 0 && (
                <p>
                  {unpaidSoon === 1 ? '1 pedido sin pago se cancela' : `${unpaidSoon} pedidos sin pago se cancelan`} en menos de 12 h:
                  mandales un recordatorio.
                </p>
              )}
            </div>
          )}

          {sections.map((s) => {
            if (s.id === 'cancelados') {
              if (s.orders.length === 0) return null;
              return (
                <details key={s.id} id={s.id} className="mt-10">
                  <summary className="display t-category cursor-pointer text-rust">
                    {s.title} ({s.orders.length})
                  </summary>
                  <p className="mt-2 text-[13px] font-medium">{s.hint}</p>
                  <OrderList orders={s.orders} alerts={alerts} />
                </details>
              );
            }
            const limit = s.id === 'entregados' && !showAllDone ? DONE_PREVIEW : Infinity;
            const visible = s.orders.slice(0, limit);
            return (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="mt-10 scroll-mt-6">
                <h2 id={`${s.id}-title`} className="display t-category text-rust">
                  {s.title} <span className="text-ink">({s.orders.length})</span>
                </h2>
                <p className="mt-2 text-[13px] font-medium">{s.hint}</p>
                {s.orders.length === 0 ? (
                  <p className="mt-4 rounded-card bg-beige px-5 py-4 text-[14px] font-medium">Nada por acá.</p>
                ) : (
                  <OrderList orders={visible} alerts={alerts} />
                )}
                {visible.length < s.orders.length && (
                  <Link
                    href="/admin/pedidos?entregados=todos#entregados"
                    className="focus-ring mt-3 inline-block rounded-sm text-[13px] font-bold underline underline-offset-2"
                  >
                    Ver los {s.orders.length} entregados
                  </Link>
                )}
              </section>
            );
          })}
        </>
      )}
    </Shell>
  );
}

/** Entregados que se muestran sin tocar "ver todos". */
const DONE_PREVIEW = 10;

function OrderList({ orders, alerts }: { orders: Order[]; alerts: Map<string, Alert | null> }) {
  return (
    <ul className="mt-4 divide-y-2 divide-beige overflow-hidden rounded-card border-2 border-beige">
      {orders.map((o) => (
        <OrderRow key={o.id} order={o} alert={alerts.get(o.id) ?? null} />
      ))}
    </ul>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <PageHero id="admin-title" title={title} />
      <section aria-label="Contenido del panel" className="section-pad bg-cream">
        <div className="container-site">{children}</div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
