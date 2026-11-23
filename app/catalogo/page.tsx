import { Fragment } from 'react';
import type { Metadata } from 'next';
import { booksInCategory, categories, oneCardPerTitle } from '@/data/books';
import { getAvailableBooks } from '@/lib/stock';
import { pageSeo } from '@/lib/seo';
import { CatalogHero } from '@/components/catalogo/CatalogHero';
import { CategorySection } from '@/components/catalogo/CategorySection';
import { WaveDivider } from '@/components/ui/WaveDivider';

export const metadata: Metadata = {
  title: 'Catálogo',
  description:
    'Desarrollo personal, finanzas y negocios, filosofía, espiritualidad, romance y thriller. Libros nuevos con envío a toda la Argentina.',
  ...pageSeo('/catalogo'),
};

export default async function CatalogoPage() {
  // Solo libros y categorías con stock; fondos alternados crema / naranja unidos por ondas.
  const available = await getAvailableBooks();
  // Tapa blanda y tapa dura del mismo título: una sola tarjeta ("Desde $ X").
  const sections = categories
    .map((category) => ({ category, books: oneCardPerTitle(booksInCategory(category.id, available)) }))
    .filter((s) => s.books.length > 0);

  return (
    <>
      <CatalogHero categories={sections.map((s) => s.category)} />
      {/* h2 oculto para mantener la jerarquía h1 → h2 → h3 */}
      <h2 className="sr-only">Categorías</h2>
      {sections.map(({ category, books }, i) => {
        const bg = i % 2 === 0 ? 'cream' : 'orange';
        const next = i === sections.length - 1 ? 'forest' : i % 2 === 0 ? 'orange' : 'cream';
        return (
          <Fragment key={category.id}>
            {/* Sin "¡Quedan X!" en el catálogo completo: con casi todo en 1 ejemplar, aparecería en todas las tarjetas
                y deja de llamar la atención. Se muestra en el Inicio, en "Seguí leyendo" y en la página de cada libro. */}
            <CategorySection category={category} books={books} background={bg} />
            <WaveDivider top={bg} bottom={next} variant={(i % 3) as 0 | 1 | 2} flip={i % 2 === 1} />
          </Fragment>
        );
      })}
    </>
  );
}
