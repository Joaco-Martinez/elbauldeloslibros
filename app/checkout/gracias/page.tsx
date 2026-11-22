import type { Metadata } from 'next';
import { ClearCartOnMount } from '@/components/cart/ClearCartOnMount';
import { PageHero } from '@/components/checkout/PageHero';
import { SocialLinks } from '@/components/layout/SocialLinks';
import { Button } from '@/components/ui/Button';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { getMpOrder, isMpOrderPending } from '@/lib/mercadopago';
import { syncMpOrder } from '@/lib/mpSync';
import { orderStore } from '@/lib/orderStore';
import { getOrigin } from '@/lib/origin';

export const metadata: Metadata = {
  title: 'Estado del pago',
  robots: { index: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

type Result = 'approved' | 'pending' | 'failed';

/**
 * Mercado Pago vuelve acá (?pedido=BDL-…). El resultado se consulta a Mercado Pago, no se confía en la dirección:
 * si el pago está acreditado, el pedido pasa a "Pago confirmado" acá mismo (sin esperar el aviso automático).
 */
async function resolve(params: Record<string, string | string[] | undefined>): Promise<{ result: Result; orderId: string }> {
  const orderId = first(params.pedido) || first(params.external_reference);
  const fromUrl = first(params.collection_status) || first(params.status);
  const guess: Result = fromUrl === 'approved' ? 'approved' : fromUrl === 'pending' || fromUrl === 'in_process' ? 'pending' : 'failed';

  const order = orderId ? await orderStore.get(orderId) : null;
  if (!order || order.method !== 'mercadopago') return { result: guess, orderId };

  const synced = await syncMpOrder(order, await getOrigin(), false).catch(() => order);
  if (synced.mpPaymentId && synced.status !== 'cancelado') return { result: 'approved', orderId };
  if (synced.status !== 'recibido' && synced.status !== 'cancelado') return { result: 'approved', orderId };
  if (synced.mpOrderId) {
    const mp = await getMpOrder(synced.mpOrderId).catch(() => null);
    // Efectivo (Rapipago / Pago Fácil) o pago en revisión: se acredita después.
    if (mp && isMpOrderPending(mp) && guess === 'pending') return { result: 'pending', orderId };
  }
  return { result: guess === 'approved' ? 'pending' : guess, orderId };
}

export default async function GraciasPage({ searchParams }: { searchParams: SearchParams }) {
  const { result, orderId } = await resolve(await searchParams);
  const approved = result === 'approved';
  const pending = result === 'pending';

  const title = approved ? '¡Pago aprobado!' : pending ? 'Pago en proceso.' : 'El pago no se completó.';
  const text = approved
    ? 'Ya estamos preparando tu pedido. Te escribimos por mail para coordinar el envío.'
    : pending
      ? 'Mercado Pago todavía está procesando el pago. Cuando se acredite, te avisamos por mail. Te reservamos los libros por 24 h.'
      : 'No se cobró nada. Tu carrito sigue guardado: podés intentar de nuevo o elegir transferencia con 10% off.';

  return (
    <>
      {(approved || pending) && <ClearCartOnMount />}
      <PageHero id="gracias-title" title={title}>
        {orderId && <p className="font-bold">Pedido {orderId}</p>}
      </PageHero>
      <section aria-label="Próximos pasos" className="section-pad bg-cream">
        <div className="container-site flex flex-col items-center text-center">
          <p className="lede">{text}</p>
          {(approved || pending) && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-[14px] font-bold">Mientras llega, seguinos:</p>
              <SocialLinks size="md" withHandle className="justify-center" />
            </div>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {approved || pending ? (
              <Button href="/catalogo" variant="rust">
                Seguir mirando
              </Button>
            ) : (
              <>
                <Button href="/checkout" variant="rust">
                  Volver a intentar
                </Button>
                <Button href="/catalogo" variant="outline" className="text-ink">
                  Ver el catálogo
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
