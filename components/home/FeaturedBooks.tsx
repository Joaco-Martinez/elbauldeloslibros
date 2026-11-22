import { Attention } from '@/components/ui/Attention';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ui/ProductCard';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { getMonthlyPicks } from '@/lib/monthlyPicks';
import { getStockMap, isAvailable } from '@/lib/stock';
import { lowStockBadge } from '@/lib/stockBadge';
import { books as allBooks } from '@/data/books';

/** Con esta cantidad o menos en todos los elegidos, el subtítulo dice "Hay pocos ejemplares". */
const FEW_COPIES = 5;

/**
 * "Los más vendidos de <mes>": uno por género, elegidos por ventas del mes y, si faltan, por stock.
 * Mientras no haya ventas suficientes se llama "Elegidos de <mes>" (no dice "más vendidos" si no es cierto).
 * Urgencia, siempre con datos reales: días que quedan del mes y "¡Quedan X!" según el stock.
 */
export async function FeaturedBooks() {
  const stock = await getStockMap();
  const available = allBooks.filter((b) => isAvailable(stock[b.id]));
  const { books, bySales, month, nextMonth, daysLeft } = await getMonthlyPicks(available, stock);
  if (books.length === 0) return null;

  const title = bySales ? `Los más vendidos de ${month}.` : `Elegidos de ${month}.`;
  // "Pocos ejemplares" solo si es cierto: todos los elegidos tienen stock cargado y bajo.
  const fewCopies = books.every((b) => typeof stock[b.id] === 'number' && (stock[b.id] as number) <= FEW_COPIES);
  const few = fewCopies ? ' Hay pocos ejemplares de cada uno.' : '';
  const countdown =
    daysLeft === 0 ? `Último día de ${month}` : daysLeft === 1 ? `Queda 1 día de ${month}` : `Quedan ${daysLeft} días de ${month}`;
  const badgeFor = (id: string) => lowStockBadge(stock[id]);

  return (
    <>
      <section id="recomendados" aria-labelledby="del-mes" className="section-pad bg-orange">
        <div className="container-site">
          <Attention
            as="p"
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-forest px-3.5 py-1.5 text-[13px] font-bold text-cream md:text-[14px]"
          >
            <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-mustard" />
            {countdown}
          </Attention>
          <SectionHeading
            id="del-mes"
            title={title}
            titleClassName="text-forest"
            subtitle={
              bySales
                ? `Los que más se llevaron este mes, uno de cada género.${few} El 1° de ${nextMonth} cambian.`
                : `Un libro de cada género para este mes.${few} El 1° de ${nextMonth} cambian.`
            }
            subtitleClassName="text-forest"
            decoration={<Sticker variant="checker" size={44} rotate={-10} className="-right-1 -top-7 md:-right-12 md:-top-4" />}
            action={
              <Button href="/catalogo" variant="forest" size="sm">
                Ver todo
              </Button>
            }
          />
          <Reveal className="mt-8 md:mt-10">
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
              {books.map((book) => (
                <li key={book.id}>
                  <ProductCard book={book} badge={badgeFor(book.id)} />
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
      <WaveDivider top="orange" bottom="cream" />
    </>
  );
}
