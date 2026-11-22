import type { Book } from '@/data/books';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/ui/ProductCard';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { lowStockBadge } from '@/lib/stockBadge';

export function RelatedBooks({ books, stock = {} }: { books: Book[]; stock?: Record<string, number | null> }) {
  return (
    <>
      <section aria-labelledby="segui-leyendo" className="section-pad bg-orange">
        <div className="container-site">
          <SectionHeading
            id="segui-leyendo"
            title="Seguí leyendo."
            titleClassName="text-forest"
            subtitle={books.length > 0 ? 'Para el mismo momento que estás viviendo, o de temas parecidos.' : undefined}
            subtitleClassName="text-forest"
            decoration={<Sticker variant="checker" size={42} rotate={-10} className="-right-9 -top-3 md:-right-11" />}
            action={
              <Button href="/catalogo" variant="forest" size="sm">
                Ver todo
              </Button>
            }
          />
          {books.length === 0 ? (
            <p className="mt-4 max-w-[48ch] text-[15px] font-medium text-forest">
              Por ahora no tenemos otros títulos parecidos. Mirá el catálogo completo: seguro encontrás tu próxima lectura.
            </p>
          ) : (
            <Reveal className="mt-8 md:mt-10">
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-5">
                {books.map((book) => (
                  <li key={book.id}>
                    <ProductCard book={book} badge={lowStockBadge(stock[book.id])} />
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </section>
      <WaveDivider top="orange" bottom="forest" variant={1} />
    </>
  );
}
