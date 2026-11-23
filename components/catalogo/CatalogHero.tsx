import type { Category } from '@/data/books';
import { FilterChip } from '@/components/ui/FilterChip';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

/** `categories`: solo las secciones que tienen libros con stock (los botones saltan a cada una). */
export function CatalogHero({ categories }: { categories: Category[] }) {
  return (
    <>
      <section aria-labelledby="catalogo-title" className="bg-brick text-cream">
        <div className="container-site relative flex flex-col items-center pb-12 pt-10 text-center md:min-h-[320px] md:justify-center md:pb-14 md:pt-10">
          <div className="relative">
            <h1 id="catalogo-title" className="display t-h1-catalog">
              El catálogo.
            </h1>
            <Sticker variant="sun" size={52} rotate={-12} className="-left-8 -top-8 md:-left-16 md:-top-4" />
            <Sticker variant="checker" size={52} rotate={12} className="-right-6 -top-8 md:-right-16 md:-top-2" delay={1.3} />
          </div>
          <p className="mt-4 max-w-[48ch] text-[14px] font-medium leading-[1.45]">
            Desarrollo personal, finanzas, filosofía y novelas para no soltar, listos para viajar hasta tu casa.
          </p>
          <nav aria-label="Categorías" className="mt-6 w-full max-w-[420px] md:max-w-none">
            {/* Celular: grilla pareja de 2 columnas. Desde tablet: una fila centrada. */}
            <ul className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-center">
              {categories.map((c) => (
                <li key={c.id} className="flex">
                  <FilterChip href={`#${c.id}`} label={c.label} />
                </li>
              ))}
            </ul>
          </nav>
          <Sticker variant="pinwheel" size={44} rotate={10} className="bottom-2 right-[16%] hidden md:block" delay={2.2} />
        </div>
      </section>
      <WaveDivider top="brick" band="mustard" bottom="cream" variant={1} />
    </>
  );
}
