import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { deleteOrRestoreBook, removeBookCover } from '@/app/admin/libros/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import { BookForm, type BookFormValues, type OtherBook } from '@/components/admin/BookForm';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { books, categories, getBook } from '@/data/books';
import { MOMENTOS, momentoIds } from '@/data/momentos';
import { getRazones } from '@/data/razones';
import { FORMATOS } from '@/lib/formatos';
import { isAdmin } from '@/lib/adminAuth';
import { getBookCover } from '@/lib/bookImage';
import { loadCatalog } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Libro', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function AdminLibroPage({ params }: Props) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  await loadCatalog(true);

  const { id } = await params;
  const isNew = id === 'nuevo';
  const book = isNew ? undefined : getBook(id);
  if (!isNew && !book) notFound();

  const cover = book ? getBookCover(book) : null;
  const sibling = book?.grupo ? books.find((b) => b.id !== book.id && b.grupo === book.grupo) : undefined;
  const values: BookFormValues = book
    ? {
        id: book.id,
        title: book.title,
        author: book.author ?? '',
        category: book.category,
        precio: book.precioTransferencia,
        sinopsis: book.sinopsis,
        momentos: momentoIds(book.id),
        razones: getRazones(book.id) ?? [],
        formato: book.formato ?? '',
        edicionDe: sibling?.id ?? '',
        grupo: book.grupo,
        coverSrc: cover?.src,
        coverRatio: cover?.ratio,
      }
    : { title: '', author: '', category: '', precio: '', sinopsis: '', momentos: [], razones: [], formato: '', edicionDe: '' };

  const others: OtherBook[] = books
    .filter((b) => b.id !== book?.id)
    .map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author ?? '',
      category: b.category,
      formato: b.formato,
      grupo: b.grupo,
      sinopsis: b.sinopsis,
      momentos: momentoIds(b.id),
      razones: getRazones(b.id) ?? [],
      precio: b.precioTransferencia,
    }));

  return (
    <>
      <PageHero id="libro-title" title={isNew ? 'Libro nuevo.' : 'Editar libro.'} />
      <section aria-labelledby="libro-title" className="section-pad bg-cream">
        <div className="container-site">
          <AdminNav current="libros" />
          <Link href="/admin/libros" className="mb-6 inline-block text-[14px] font-bold underline underline-offset-2">
            ← Todos los libros
          </Link>

          <BookForm
            values={values}
            categories={categories.map((c) => ({ id: c.id, label: c.label, tone: c.tone }))}
            momentos={Object.entries(MOMENTOS).map(([mid, label]) => ({ id: mid, label }))}
            formatos={FORMATOS}
            others={others}
          />

          {book && (book.origen !== 'codigo' || book.tapa) && (
            <div className="mt-12 rounded-card border-2 border-beige p-5">
              <h2 className="text-[15px] font-bold">Otras opciones</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {book.tapa && (
                  <form action={removeBookCover}>
                    <input type="hidden" name="id" value={book.id} />
                    <ConfirmButton
                      message={
                        book.origen === 'editado'
                          ? '¿Sacar la foto que subiste? Vuelve la foto anterior.'
                          : '¿Sacar la foto? Se va a mostrar una tapa dibujada con el título.'
                      }
                      className="btn h-10 border-[1.5px] border-ink px-4 text-[13px]"
                    >
                      Sacar la foto subida
                    </ConfirmButton>
                  </form>
                )}
                {book.origen === 'editado' && (
                  <form action={deleteOrRestoreBook}>
                    <input type="hidden" name="id" value={book.id} />
                    <ConfirmButton
                      message="¿Volver a los datos originales? Se pierden los cambios que hiciste acá (título, precio, sinopsis, foto)."
                      className="btn h-10 border-[1.5px] border-ink px-4 text-[13px]"
                    >
                      Volver a los datos originales
                    </ConfirmButton>
                  </form>
                )}
                {book.origen === 'panel' && (
                  <form action={deleteOrRestoreBook}>
                    <input type="hidden" name="id" value={book.id} />
                    <ConfirmButton
                      message={`¿Borrar "${book.title}" del catálogo? No se puede deshacer. Si solo se agotó, mejor poné 0 en Stock.`}
                      className="btn h-10 bg-brick px-4 text-[13px] text-cream"
                    >
                      Borrar libro
                    </ConfirmButton>
                  </form>
                )}
              </div>
              {book.origen === 'panel' && (
                <p className="mt-3 text-[12px] font-medium">
                  Si solo se agotó, no lo borres: poné 0 en Stock y desaparece de la web hasta que vuelva.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
