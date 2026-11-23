import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { deleteSection, moveSection } from '@/app/admin/secciones/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { SectionForm } from '@/components/admin/SectionForm';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { books, categories, codeCategoryIds, SECTION_TONES } from '@/data/books';
import { isAdmin } from '@/lib/adminAuth';
import { loadCatalog, loadedCustomCatalog } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Secciones', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminSeccionesPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  await loadCatalog(true);
  const sp = await searchParams;
  const edited = new Set(loadedCustomCatalog().categories.map((c) => c.id));

  return (
    <>
      <PageHero id="secciones-title" title="Secciones." />
      <section aria-labelledby="secciones-title" className="section-pad bg-cream">
        <div className="container-site">
          <AdminNav current="secciones" />

          {sp.error === 'con-libros' && (
            <p role="alert" className="mb-6 rounded-[10px] bg-brick px-4 py-3 text-[14px] font-bold text-cream">
              Esa sección tiene libros. Primero pasalos a otra sección (desde Libros → Editar) y después la podés borrar.
            </p>
          )}
          {sp.borrada && (
            <p role="status" className="mb-6 rounded-[10px] bg-ink px-4 py-3 text-[14px] font-bold text-cream">
              Sección borrada.
            </p>
          )}
          {sp.restaurada && (
            <p role="status" className="mb-6 rounded-[10px] bg-ink px-4 py-3 text-[14px] font-bold text-cream">
              La sección volvió a su nombre, color y lugar originales.
            </p>
          )}

          <p className="max-w-[70ch] text-[13px] font-medium leading-[1.5]">
            Son los géneros del catálogo, en este orden. Una sección sin libros con stock no se muestra en la web. Para poner un
            libro en una sección, editalo en{' '}
            <Link href="/admin/libros" className="font-bold underline underline-offset-2">
              Libros
            </Link>
            .
          </p>

          <div className="mt-8 rounded-card border-2 border-forest p-5 md:p-6">
            <h2 className="text-[17px] font-bold">Nueva sección</h2>
            <div className="mt-4">
              <SectionForm tones={SECTION_TONES} />
            </div>
          </div>

          <ol className="mt-10 grid gap-5">
            {categories.map((c, i) => {
              const count = books.filter((b) => b.category === c.id).length;
              const isCode = codeCategoryIds.has(c.id);
              return (
                <li key={c.id} className="rounded-card border-2 border-beige p-5 md:p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-[13px] font-bold">
                      {i + 1}. {count === 1 ? '1 libro' : `${count} libros`}
                      {!isCode && <span className="ml-2 rounded-full bg-mustard px-2.5 py-0.5 text-[11px] text-forest">Creada por vos</span>}
                    </p>
                    <div className="flex items-center gap-2">
                      <form action={moveSection}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="dir" value="-1" />
                        <button
                          type="submit"
                          disabled={i === 0}
                          aria-label={`Subir ${c.label}`}
                          className="btn h-9 w-9 border-[1.5px] border-ink text-[16px] disabled:opacity-30"
                        >
                          ↑
                        </button>
                      </form>
                      <form action={moveSection}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="dir" value="1" />
                        <button
                          type="submit"
                          disabled={i === categories.length - 1}
                          aria-label={`Bajar ${c.label}`}
                          className="btn h-9 w-9 border-[1.5px] border-ink text-[16px] disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </form>
                      {(!isCode || edited.has(c.id)) && (
                        <form action={deleteSection}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton
                            message={
                              isCode
                                ? `¿Volver "${c.label}" a su nombre, color y lugar originales?`
                                : `¿Borrar la sección "${c.label}"?`
                            }
                            className="btn h-9 border-[1.5px] border-ink px-3 text-[12px]"
                          >
                            {isCode ? 'Volver al original' : 'Borrar'}
                          </ConfirmButton>
                        </form>
                      )}
                    </div>
                  </div>
                  <SectionForm key={`${c.id}-${c.label}-${c.tone}`} id={c.id} label={c.label} blurb={c.blurb} tone={c.tone} tones={SECTION_TONES} />
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
