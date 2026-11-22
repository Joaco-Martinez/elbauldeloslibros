import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/checkout/PageHero';
import { OpinionForm } from '@/components/pedido/OpinionForm';
import { BookImage } from '@/components/ui/BookImage';
import { Button } from '@/components/ui/Button';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { getBook } from '@/data/books';
import { orderStore } from '@/lib/orderStore';
import { feedbackStore } from '@/lib/reviews';
import { safeEqual } from '@/lib/tokenCompare';

export const metadata: Metadata = { title: 'Contanos cómo te fue', robots: { index: false } };
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Opinión del comprador: se llega desde el mail "¿Cómo te fue?" (link con la clave del pedido). */
export default async function OpinionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const t = (await searchParams).t;
  const token = Array.isArray(t) ? t[0] : t;
  const order = await orderStore.get(decodeURIComponent(id));
  if (!order || !token || !safeEqual(token, order.token)) notFound();

  const already = Boolean(order.reviewedAt || (await feedbackStore.get(order.id)));
  const delivered = order.status === 'entregado';
  const name = order.customer.nombre.split(' ')[0];

  const books = order.lines.flatMap((l) => {
    const book = getBook(l.id);
    return book
      ? [{ id: l.id, title: l.title, cover: <BookImage book={book} flat sizes="80px" className="w-full" /> }]
      : [];
  });

  return (
    <>
      <PageHero id="opinion-title" title={already ? '¡Gracias!' : `${name}, ¿cómo te fue?`}>
        <p className="font-bold">Pedido {order.id}</p>
      </PageHero>
      <section aria-label="Tu opinión" className="section-pad bg-cream">
        <div className="container-site mx-auto max-w-[720px]">
          {already ? (
            <div className="text-center">
              <p className="lede mx-auto">Ya recibimos tu opinión de este pedido. Gracias por ayudarnos a mejorar.</p>
              <Button href="/catalogo" variant="rust" className="mt-6">
                Ver el catálogo
              </Button>
            </div>
          ) : !delivered ? (
            <div className="text-center">
              <p className="lede mx-auto">Vas a poder contarnos cómo te fue cuando tengas tu pedido en las manos.</p>
              <Button href={`/pedido/${encodeURIComponent(order.id)}?t=${token}`} variant="rust" className="mt-6">
                Ver cómo viene mi pedido
              </Button>
            </div>
          ) : (
            <>
              <p className="lede mb-10 !max-w-[52ch]">
                Te lleva un minuto. Contanos qué te parecieron los libros y cómo fue comprar acá: con eso hacemos una tienda
                mejor para vos y para los próximos lectores.
              </p>
              <OpinionForm orderId={order.id} token={token} books={books} />
            </>
          )}
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
