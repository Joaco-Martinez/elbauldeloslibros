import type { Category } from '@/data/books';
import { FilterChip } from '@/components/ui/FilterChip';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';
import type { Tone } from '@/lib/tokens';

interface CatalogHeroProps {
  /** Solo los géneros que tienen libros con stock. */
  categories: Category[];
  /** Color de la sección que viene abajo (para la onda). */
  next?: Tone;
  /** Página de un género: título y texto de ese género, y su botón marcado. */
  current?: Category;
}

/** Arriba del catálogo y de cada género: título y botones para ir a cada género (cada uno tiene su página). */
export function CatalogHero({ categories, next = 'cream', current }: CatalogHeroProps) {
  return (
    <>
      <section aria-labelledby="catalogo-title" className="bg-brick text-cream">
        <div className="container-site relative flex flex-col items-center pb-12 pt-10 text-center md:min-h-[300px] md:justify-center md:pb-14 md:pt-10">
          <div className="relative">
            <h1 id="catalogo-title" className="display t-h1-catalog">
              {current ? `${current.label}.` : 'El catálogo.'}
            </h1>
            <Sticker variant="sun" size={52} rotate={-12} className="-left-8 -top-8 md:-left-16 md:-top-4" />
            <Sticker variant="checker" size={52} rotate={12} className="-right-6 -top-8 md:-right-16 md:-top-2" delay={1.3} />
          </div>
          <p className="mt-4 max-w-[48ch] text-[14px] font-medium leading-[1.45] md:text-[15px]">
            {current
              ? current.blurb || 'Libros nuevos, listos para viajar hasta tu casa.'
              : 'Desarrollo personal, finanzas, filosofía y novelas para no soltar, listos para viajar hasta tu casa.'}
          </p>
          <nav aria-label="Géneros" className="mt-6 w-full max-w-[460px] md:max-w-none">
            {/* Celular: grilla pareja de 2 columnas. Desde tablet: una fila centrada. */}
            <ul className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-center">
              <li className="flex">
                <FilterChip href="/catalogo" label="Todos" active={!current} />
              </li>
              {categories.map((c) => (
                <li key={c.id} className="flex">
                  <FilterChip href={`/catalogo/${c.id}`} label={c.label} active={current?.id === c.id} />
                </li>
              ))}
            </ul>
          </nav>
          <Sticker variant="pinwheel" size={44} rotate={10} className="bottom-2 right-[16%] hidden md:block" delay={2.2} />
        </div>
      </section>
      <WaveDivider top="brick" band="mustard" bottom={next} variant={1} />
    </>
  );
}
