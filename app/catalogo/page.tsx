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

/** Tarjetas por género en el catálogo completo; el resto, en la página del género ("Ver los N →"). */
const PER_SECTION = 4;

export default async function CatalogoPage() {
  // Solo libros y géneros con stock; cada sección con el color de su género, unidas por ondas.
  const available = await getAvailableBooks();
  // Tapa blanda y tapa dura del mismo título: una sola tarjeta ("Desde $ X").
  const sections = categories
    .map((category) => ({ category, books: oneCardPerTitle(booksInCategory(category.id, available)) }))
    .filter((s) => s.books.length > 0);

  return (
    <>
      <CatalogHero categories={sections.map((s) => s.category)} next={sections[0]?.category.tone ?? 'cream'} />
      {/* h2 oculto para mantener la jerarquía h1 → h2 → h3 */}
      <h2 className="sr-only">Géneros</h2>
      {sections.map(({ category, books }, i) => {
        const next = sections[i + 1]?.category.tone ?? 'forest';
        return (
          <Fragment key={category.id}>
            {/* Sin "¡Quedan X!" en el catálogo completo: con casi todo en 1 ejemplar, aparecería en todas las tarjetas
                y deja de llamar la atención. Se muestra en el Inicio, en "Seguí leyendo" y en la página de cada libro. */}
            <CategorySection category={category} books={books} limit={PER_SECTION} />
            <WaveDivider top={category.tone} bottom={next} variant={(i % 3) as 0 | 1 | 2} flip={i % 2 === 1} />
          </Fragment>
        );
      })}
    </>
  );
}
