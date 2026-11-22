import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/checkout/PageHero';
import { OrderSummary } from '@/components/pedido/OrderSummary';
import { ReceiptButton } from '@/components/pedido/ReceiptButton';
import { Timeline } from '@/components/pedido/Timeline';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { Button } from '@/components/ui/Button';
import { EXPIRED_DETAIL, FLOW, etaInfo, statusHeadline, stepIndex } from '@/lib/orderStatus';
import { orderStore } from '@/lib/orderStore';
import { restoreCartUrl } from '@/lib/receipt';
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/site';
import { safeEqual } from '@/lib/tokenCompare';

export const metadata: Metadata = {
  title: 'Seguimiento de tu pedido',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PedidoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const t = (await searchParams).t;
  const token = Array.isArray(t) ? t[0] : t;

  const order = await orderStore.get(decodeURIComponent(id));
  // Sin la clave del link, se comporta como si el pedido no existiera.
  if (!order || !token || !safeEqual(token, order.token)) notFound();

  const eta = etaInfo(order);
  const step = stepIndex(order.status);
  const needsReceipt = order.method === 'transferencia' && order.status === 'recibido';

  return (
    <>
      <PageHero id="pedido-title" title={statusHeadline(order)}>
        <p className="font-bold">
          Pedido {order.id}
          {step >= 0 && ` · Paso ${step + 1} de ${FLOW.length}`}
        </p>
      </PageHero>
      <section aria-label="Estado del pedido" className="section-pad bg-cream">
        <div className="container-site grid gap-y-12 lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-7">
            {eta && (
              <p className="mb-8 rounded-card bg-mustard px-5 py-4 text-[17px] font-bold text-forest">{eta.label}</p>
            )}
            <h2 className="display t-category mb-6 text-rust">Así viene.</h2>
            <Timeline order={order} />
            {order.status === 'cancelado' && order.expiredAt && (
              <div className="mt-8 rounded-card bg-beige p-5 md:p-6">
                <p className="text-[15px] font-bold">¿Lo querés igual?</p>
                <p className="mt-1 text-[14px] font-medium leading-[1.45]">{EXPIRED_DETAIL}</p>
                <Button href={restoreCartUrl('', order.lines)} variant="gold" className="mt-4">
                  Volver a armar mi pedido
                </Button>
              </div>
            )}
            {needsReceipt && (
              <div className="mt-8">
                <ReceiptButton orderId={order.id} total={order.total} />
              </div>
            )}
            <p className="mt-10 text-[14px] font-medium">
              ¿Dudas?{' '}
              <a
                href={whatsappUrl(`Hola! Te escribo por el pedido ${order.id}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring rounded-sm font-bold underline underline-offset-2"
              >
                Escribinos por WhatsApp al {WHATSAPP_DISPLAY}
              </a>
              .
            </p>
          </div>
          <aside className="lg:col-span-5">
            <OrderSummary order={order} />
          </aside>
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
