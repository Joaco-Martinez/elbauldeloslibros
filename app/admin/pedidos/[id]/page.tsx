import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { LabelData } from '@/components/admin/LabelData';
import { StatusForm } from '@/components/admin/StatusForm';
import { STATUS_BADGE } from '@/components/admin/styles';
import { PageHero } from '@/components/checkout/PageHero';
import { OrderSummary } from '@/components/pedido/OrderSummary';
import { Timeline } from '@/components/pedido/Timeline';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { isAdmin } from '@/lib/adminAuth';
import { requestReviewByEmail } from '@/app/admin/actions';
import { customerWhatsappUrl, orderAlert, paymentReminderText } from '@/lib/adminQueue';
import { getOrigin } from '@/lib/origin';
import { opinionUrl } from '@/lib/receipt';
import { REVIEW_AFTER_DAYS } from '@/lib/reviewRequests';
import { etaInfo, formatDateTime, stepLabel } from '@/lib/orderStatus';
import { orderStore } from '@/lib/orderStore';

export const metadata: Metadata = { title: 'Pedido', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect('/admin/pedidos');

  const id = decodeURIComponent((await params).id);
  const order = await orderStore.get(id);
  if (!order) notFound();

  const eta = etaInfo(order);
  const alert = orderAlert(order);
  const origin = await getOrigin();
  const reviewWhatsapp =
    order.status === 'entregado' && !order.reviewedAt
      ? customerWhatsappUrl(
          order.customer.telefono,
          `¡Hola ${order.customer.nombre.split(' ')[0]}! Te escribimos de El Baul de los Libros. ¿Cómo te fue con tu pedido? Nos encantaría que nos cuentes qué te parecieron los libros y qué mejorarías de la tienda: te lleva un minuto. ${opinionUrl(origin, order.id, order.token)}`,
        )
      : null;
  const reminder = order.status === 'recibido' ? customerWhatsappUrl(order.customer.telefono, paymentReminderText(order)) : null;
  const trackingPath = `/pedido/${encodeURIComponent(order.id)}?t=${order.token}`;

  return (
    <>
      <PageHero id="pedido-admin-title" title={order.id}>
        <span className={`inline-block rounded-full px-3 py-1 text-[13px] font-bold ${STATUS_BADGE[order.status]}`}>
          {stepLabel(order.status, order)}
        </span>
      </PageHero>
      <section aria-label="Detalle del pedido" className="section-pad bg-cream">
        <div className="container-site">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-bold">
            <Link href="/admin/pedidos" className="focus-ring rounded-sm underline underline-offset-2">
              ← Todos los pedidos
            </Link>
            <a href={trackingPath} target="_blank" rel="noopener noreferrer" className="focus-ring rounded-sm underline underline-offset-2">
              Ver como el cliente
            </a>
            <a
              href={`/admin/pedidos/${encodeURIComponent(order.id)}/mail`}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded-sm underline underline-offset-2"
            >
              Vista previa del mail
            </a>
          </div>

          {(alert || reminder) && (
            <div
              className={`mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-card px-5 py-4 text-[14px] font-bold ${
                alert?.level === 'late' ? 'bg-brick text-cream' : alert?.level === 'warn' ? 'bg-mustard text-forest' : 'bg-beige text-ink'
              }`}
            >
              {alert && (
                <p>
                  {alert.level === 'late' && '⚠ '}
                  {alert.text}
                </p>
              )}
              {reminder && (
                <a
                  href={reminder}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn h-10 border-[1.5px] border-current px-4 text-[13px]"
                >
                  Recordarle el pago por WhatsApp
                </a>
              )}
            </div>
          )}

          {order.status === 'entregado' && (
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-card bg-beige px-5 py-4 text-[14px]">
              {order.reviewedAt ? (
                <p className="font-bold">
                  ★ Ya dejó su opinión ({formatDateTime(order.reviewedAt)}).{' '}
                  <Link href="/admin/opiniones" className="underline underline-offset-2">
                    Ver opiniones
                  </Link>
                </p>
              ) : (
                <>
                  <p className="font-bold">
                    {order.reviewRequestedAt
                      ? `Le pedimos su opinión el ${formatDateTime(order.reviewRequestedAt)}.`
                      : `El mail "¿Cómo te fue?" sale solo ${REVIEW_AFTER_DAYS} días después de entregado.`}
                  </p>
                  {reviewWhatsapp && (
                    <a href={reviewWhatsapp} target="_blank" rel="noopener noreferrer" className="btn h-10 bg-forest px-4 text-[13px] text-cream">
                      Pedir reseña por WhatsApp
                    </a>
                  )}
                  <form action={requestReviewByEmail}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className="btn h-10 border-[1.5px] border-ink px-4 text-[13px]">
                      Mandar el mail ahora
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          <div className="mt-8 grid gap-y-10 lg:grid-cols-12 lg:gap-x-6">
            <div className="space-y-10 lg:col-span-7">
              <StatusForm order={order} />

              <div>
                <h2 className="display t-category mb-6 text-rust">Línea de tiempo.</h2>
                {eta && <p className="mb-6 rounded-card bg-mustard px-5 py-3 text-[15px] font-bold text-forest">{eta.label}</p>}
                <Timeline order={order} />
              </div>

              <div>
                <h2 className="display t-category mb-4 text-rust">Movimientos.</h2>
                <ol className="space-y-3">
                  {[...order.history].reverse().map((e, i) => (
                    <li key={`${e.at}-${i}`} className="rounded-[14px] bg-beige px-4 py-3 text-[13px]">
                      <span className="font-bold">{stepLabel(e.status, order)}</span> · {formatDateTime(e.at)}
                      {e.note && <p className="mt-1 font-medium">{e.note}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <aside className="space-y-8 lg:col-span-5">
              <OrderSummary order={order} showContact />
              <LabelData order={order} />
            </aside>
          </div>
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
