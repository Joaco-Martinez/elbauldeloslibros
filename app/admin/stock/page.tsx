import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { StockRow } from '@/components/admin/StockRow';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { books, categories } from '@/data/books';
import { isAdmin } from '@/lib/adminAuth';
import { getBookCover } from '@/lib/bookImage';
import { formatPrice } from '@/lib/formatPrice';
import { getStockMap } from '@/lib/stock';

export const metadata: Metadata = { title: 'Stock', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminStockPage() {
  if (!(await isAdmin())) redirect('/admin/pedidos');

  const stock = await getStockMap();
  const values = books.map((b) => stock[b.id]);
  const count = {
    enStock: values.filter((u) => u !== null && u > 3).length,
    ultimas: values.filter((u) => u !== null && u > 0 && u <= 3).length,
    agotados: values.filter((u) => u === 0).length,
    sinControlar: values.filter((u) => u === null).length,
  };

  return (
    <>
      <PageHero id="stock-title" title="Stock." />
      <section aria-label="Stock por libro" className="section-pad bg-cream">
        <div className="container-site">
          <AdminNav current="stock" />

          <ul className="flex flex-wrap gap-2 text-[13px] font-bold" aria-label="Resumen">
            <li className="rounded-full bg-forest px-3 py-1 text-cream">{count.enStock} en stock</li>
            <li className="rounded-full bg-mustard px-3 py-1 text-forest">{count.ultimas} con últimas unidades</li>
            <li className="rounded-full bg-ink px-3 py-1 text-cream">{count.agotados} agotados</li>
            <li className="rounded-full bg-beige px-3 py-1 text-ink">{count.sinControlar} sin controlar</li>
          </ul>
          <p className="mt-4 max-w-[70ch] text-[13px] font-medium leading-[1.5]">
            Con <strong>0 unidades</strong> el libro desaparece de la web, y vuelve cuando le cargás stock. Cada venta descuenta
            sola, y si cancelás un pedido, las unidades vuelven. Los libros <strong>sin controlar</strong> se venden sin límite
            hasta que les cargues una cantidad.
          </p>

          {categories.map((c) => {
            const list = books.filter((b) => b.category === c.id);
            if (list.length === 0) return null;
            return (
              <div key={c.id} className="mt-10">
                <h2 className="display t-category text-rust">{c.label}</h2>
                <ul className="mt-4 divide-y-2 divide-beige rounded-card border-2 border-beige">
                  {list.map((b) => (
                    <StockRow
                      key={`${b.id}-${stock[b.id]}`}
                      id={b.id}
                      title={b.title}
                      author={b.author}
                      price={formatPrice(b.price)}
                      units={stock[b.id]}
                      cover={getBookCover(b)?.src}
                    />
                  ))}
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
