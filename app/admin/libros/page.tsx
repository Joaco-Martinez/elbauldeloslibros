import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { books, categories, getBook } from '@/data/books';
import { isAdmin } from '@/lib/adminAuth';
import { getBookCover } from '@/lib/bookImage';
import { formatPrice } from '@/lib/formatPrice';
import { getStockMap } from '@/lib/stock';

export const metadata: Metadata = { title: 'Libros', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const ORIGEN = {
  panel: { label: 'Agregado por vos', className: 'bg-mustard text-forest' },
  editado: { label: 'Editado', className: 'bg-beige text-ink' },
  codigo: null,
} as const;

function stockText(units: number | null | undefined) {
  if (units === null || units === undefined) return 'Sin controlar';
  if (units === 0) return 'Agotado · no se muestra';
  return units === 1 ? '1 ejemplar' : `${units} ejemplares`;
}

export default async function AdminLibrosPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect('/admin/pedidos');

  const stock = await getStockMap(); // también suma al catálogo los libros del panel
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === 'string' ? (sp[k] as string) : undefined);
  const listo = one('listo');
  const borrado = one('borrado');
  const restaurado = one('restaurado');
  const saved = listo ? getBook(listo) : undefined;

  return (
    <>
      <PageHero id="libros-title" title="Libros." />
      <section aria-label="Libros del catálogo" className="section-pad bg-cream">
        <div className="container-site">
          <AdminNav current="libros" />

          {saved && (
            <p role="status" className="mb-6 rounded-[10px] bg-forest px-4 py-3 text-[14px] font-bold text-cream">
              Listo: guardamos “{saved.title}”.{' '}
              {stock[saved.id] === 0 ? (
                'Tiene 0 ejemplares, así que todavía no se ve en la web.'
              ) : (
                <Link href={`/catalogo/${saved.id}`} className="underline underline-offset-2">
                  Ver cómo quedó en la tienda
                </Link>
              )}
            </p>
          )}
          {borrado && (
            <p role="status" className="mb-6 rounded-[10px] bg-ink px-4 py-3 text-[14px] font-bold text-cream">
              Libro borrado del catálogo.
            </p>
          )}
          {restaurado && (
            <p role="status" className="mb-6 rounded-[10px] bg-ink px-4 py-3 text-[14px] font-bold text-cream">
              Volvió a sus datos originales.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[60ch] text-[13px] font-medium leading-[1.5]">
              Acá agregás libros nuevos y cambiás título, precio, sinopsis o foto. Las cantidades se cargan en{' '}
              <Link href="/admin/stock" className="font-bold underline underline-offset-2">
                Stock
              </Link>
              .
            </p>
            <Link href="/admin/libros/nuevo" className="btn h-12 bg-brick px-6 text-[15px] text-cream">
              + Agregar libro
            </Link>
          </div>

          {categories.map((c) => {
            const list = books.filter((b) => b.category === c.id);
            if (list.length === 0) return null;
            return (
              <div key={c.id} className="mt-10">
                <h2 className="display t-category text-rust">{c.label}</h2>
                <ul className="mt-4 divide-y-2 divide-beige rounded-card border-2 border-beige">
                  {list.map((b) => {
                    const cover = getBookCover(b)?.src;
                    const origen = ORIGEN[b.origen];
                    return (
                      <li key={b.id} className="flex items-center gap-4 px-4 py-4 md:px-5">
                        <div className="relative h-[68px] w-12 shrink-0 overflow-hidden rounded-[4px] bg-beige">
                          {cover && <Image src={cover} alt="" fill sizes="48px" className="object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold">{b.title}</p>
                          <p className="truncate text-[12px] font-medium">
                            {b.author ? `${b.author} · ` : ''}
                            {formatPrice(b.precioTransferencia)} transferencia · {formatPrice(b.price)} Mercado Pago
                          </p>
                          <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                            <span className="rounded-full border-[1.5px] border-ink px-2 py-[1px]">{stockText(stock[b.id])}</span>
                            {b.formato && <span className="rounded-full bg-forest px-2.5 py-0.5 text-cream">{b.formato}</span>}
                            {origen && <span className={`rounded-full px-2.5 py-0.5 ${origen.className}`}>{origen.label}</span>}
                          </p>
                        </div>
                        <Link
                          href={`/admin/libros/${b.id}`}
                          className="btn h-9 shrink-0 border-[1.5px] border-ink px-4 text-[13px]"
                          aria-label={`Editar ${b.title}`}
                        >
                          Editar
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
