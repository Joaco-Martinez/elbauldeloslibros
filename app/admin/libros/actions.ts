'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { books, categories, codeBook, codeBookIds, getBook, type Book, type CategoryId, type CustomBook } from '@/data/books';
import { isMomentoId, type MomentoId } from '@/data/momentos';
import { isAdmin } from '@/lib/adminAuth';
import {
  BOOK_ID_RE,
  getCustomBook,
  loadCatalog,
  removeCustomBook,
  removeUploadedCover,
  saveCustomBook,
  saveUploadedCover,
  type StoredCover,
} from '@/lib/catalog';
import { FORMATOS } from '@/lib/formatos';
import { slugify } from '@/lib/slug';
import { setStock } from '@/lib/stock';
import type { Razon } from '@/data/razones';

export interface BookFormState {
  error?: string;
}

/** Foto ya achicada en el navegador: con 1,5 MB sobra (suelen pesar 150-300 KB). */
const MAX_COVER_BYTES = 1_500_000;
const MIMES: StoredCover['mime'][] = ['image/jpeg', 'image/png', 'image/webp'];

function newId(title: string, formato?: string) {
  // Si es tapa dura de un título que ya está, la dirección queda "titulo-tapa-dura".
  title = formato ? `${title} ${formato}` : title;
  const base = slugify(title) || 'libro';
  const taken = (id: string) => id === 'nuevo' || books.some((b) => b.id === id) || categories.some((c) => c.id === id);
  if (!taken(base)) return base;
  for (let n = 2; ; n++) if (!taken(`${base}-${n}`)) return `${base}-${n}`;
}

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim().replace(/\s+/g, ' ');

/** Alta o edición de un libro desde /admin/libros. */
export async function saveBook(_prev: BookFormState, form: FormData): Promise<BookFormState> {
  if (!(await isAdmin())) return { error: 'Tu sesión venció. Volvé a entrar.' };
  await loadCatalog(true);

  const editingId = String(form.get('id') ?? '');
  const existing = editingId ? getBook(editingId) : undefined;
  if (editingId && !existing) return { error: 'Ese libro ya no existe.' };

  const title = text(form, 'title');
  const author = text(form, 'author');
  const category = String(form.get('category') ?? '') as CategoryId;
  const price = Number(String(form.get('precio') ?? '').replace(/[.\s$]/g, ''));
  const sinopsis = String(form.get('sinopsis') ?? '').trim().replace(/\s+/g, ' ');
  const momentos = form
    .getAll('momentos')
    .map(String)
    .filter(isMomentoId)
    .slice(0, 3) as MomentoId[];

  if (!title) return { error: 'Falta el título.' };
  if (title.length > 120) return { error: 'El título es demasiado largo (máximo 120 letras).' };
  if (author.length > 100) return { error: 'El autor es demasiado largo.' };
  if (!categories.some((c) => c.id === category)) return { error: 'Elegí una categoría.' };
  if (!Number.isInteger(price) || price < 1000 || price > 2_000_000) {
    return { error: 'Revisá el precio: en pesos, sin centavos (ej. 15000).' };
  }
  if (sinopsis.length < 20) return { error: 'Escribí una sinopsis de al menos una oración.' };
  if (sinopsis.length > 700) return { error: 'La sinopsis es demasiado larga (máximo 700 letras).' };

  // "4 razones para leerlo": las 4 completas o ninguna.
  const razonesRaw = [0, 1, 2, 3].map((i) => ({ titulo: text(form, `razon${i}_titulo`), texto: text(form, `razon${i}_texto`) }));
  const filled = razonesRaw.filter((r) => r.titulo || r.texto).length;
  if (filled > 0 && razonesRaw.some((r) => !r.titulo || !r.texto)) {
    return { error: 'Completá las 4 razones (título y texto de cada una) o dejalas todas vacías.' };
  }
  if (razonesRaw.some((r) => r.titulo.length > 60 || r.texto.length > 200)) {
    return { error: 'Cada razón: título de hasta 60 letras y texto de hasta 200.' };
  }
  const razones = filled ? (razonesRaw as [Razon, Razon, Razon, Razon]) : undefined;

  // Ediciones: tapa blanda / tapa dura del mismo título.
  const formato = String(form.get('formato') ?? '');
  if (formato && !FORMATOS.includes(formato)) return { error: 'Elegí un formato de la lista.' };
  const edicionDe = String(form.get('edicionDe') ?? '');
  let other: Book | undefined;
  let otroFormato = '';
  if (edicionDe) {
    other = getBook(edicionDe);
    if (!other || other.id === editingId) return { error: 'Elegí de qué libro es otra edición.' };
    otroFormato = String(form.get('otroFormato') ?? '') || other.formato || '';
    if (!formato) return { error: 'Elegí el formato de este libro (por ejemplo, Tapa dura).' };
    if (!FORMATOS.includes(otroFormato)) return { error: `Elegí qué formato es "${other.title}" (el que ya tenías).` };
    if (otroFormato === formato) return { error: 'Las dos ediciones no pueden tener el mismo formato.' };
    const group = other.grupo ?? other.id;
    const clash = books.find(
      (b) => b.id !== editingId && b.id !== other!.id && (b.grupo ?? b.id) === group && b.formato === formato,
    );
    if (clash) return { error: `Ya hay una edición "${formato}" de este libro.` };
  }
  const grupo = other ? (other.grupo ?? other.id) : undefined;

  // Stock inicial: obligatorio en los libros nuevos (si no, se vendería sin límite).
  let initialStock: number | null = null;
  if (!existing) {
    const raw = String(form.get('stock') ?? '').trim();
    initialStock = Number(raw);
    if (raw === '' || !Number.isInteger(initialStock) || initialStock < 0 || initialStock > 100000) {
      return { error: 'Poné cuántos ejemplares tenés (0 si todavía no llegaron).' };
    }
  }

  // Foto (ya achicada en el navegador).
  const file = form.get('tapa');
  let cover: { stored: StoredCover; ratio: number } | null = null;
  if (file instanceof File && file.size > 0) {
    if (!MIMES.includes(file.type as StoredCover['mime'])) return { error: 'La foto tiene que ser JPG, PNG o WebP.' };
    if (file.size > MAX_COVER_BYTES) return { error: 'La foto es demasiado pesada. Probá con otra.' };
    const ratio = Number(form.get('ratio'));
    cover = {
      stored: { mime: file.type as StoredCover['mime'], data: Buffer.from(await file.arrayBuffer()).toString('base64') },
      ratio: Number.isFinite(ratio) && ratio > 0.2 && ratio < 2 ? ratio : 0.68,
    };
  }

  const id = existing?.id ?? newId(title, other ? formato : undefined);
  if (!BOOK_ID_RE.test(id)) return { error: 'No se pudo armar la dirección del libro. Cambiá el título.' };

  const now = Date.now();
  const prev = await getCustomBook(id);
  // Lo que no se edita en el formulario (destacado, colores, foto del código…) se conserva.
  const base = prev ?? codeBook(id);
  const book: CustomBook = {
    ...(base ?? {}),
    id,
    title,
    author: author || undefined,
    category,
    precioTransferencia: price,
    sinopsis,
    momentos: momentos.length ? momentos : undefined,
    razones,
    formato: formato || undefined,
    grupo,
    // Si cambió la categoría, el color de la tarjeta pasa a ser el del género nuevo.
    ...(base && base.category !== category ? { colorDeTarjeta: undefined, colorDePortada: undefined, colorDeDetalle: undefined } : {}),
    tapa: cover ? { v: now, ratio: cover.ratio } : prev?.tapa,
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
  };
  if (!book.author) delete book.author;
  if (!book.momentos) delete book.momentos;
  if (!book.tapa) delete book.tapa;
  if (!book.razones) delete book.razones;
  if (!book.formato) delete book.formato;
  if (!book.grupo) delete book.grupo;

  try {
    if (cover) await saveUploadedCover(id, cover.stored);
    await saveCustomBook(book);
    // La otra edición queda en el mismo grupo y con su formato.
    if (other && (other.grupo !== grupo || other.formato !== otroFormato)) {
      const otherPrev = await getCustomBook(other.id);
      const otherBase = otherPrev ?? codeBook(other.id);
      if (otherBase) {
        await saveCustomBook({
          ...otherBase,
          grupo,
          formato: otroFormato,
          createdAt: otherPrev?.createdAt ?? now,
          updatedAt: now,
        });
      }
    }
    if (initialStock !== null) await setStock(id, initialStock);
  } catch (err) {
    console.error('[admin/libros] No se pudo guardar:', err);
    return { error: 'No se pudo guardar. Probá de nuevo en un rato.' };
  }

  revalidatePath('/', 'layout');
  redirect(`/admin/libros?listo=${id}`);
}

/** Libros agregados en el panel: se borran. Libros del código: vuelven a sus datos originales. */
export async function deleteOrRestoreBook(form: FormData) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  const id = String(form.get('id') ?? '');
  if (!BOOK_ID_RE.test(id)) return;
  await removeCustomBook(id);
  revalidatePath('/', 'layout');
  redirect(`/admin/libros?${codeBookIds.has(id) ? 'restaurado' : 'borrado'}=${id}`);
}

/** Saca la foto subida en el panel (vuelve a la del código o a la tapa ilustrada). */
export async function removeBookCover(form: FormData) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  const id = String(form.get('id') ?? '');
  const prev = BOOK_ID_RE.test(id) ? await getCustomBook(id) : null;
  if (!prev?.tapa) return;
  const { tapa: _t, ...rest } = prev;
  await saveCustomBook({ ...rest, updatedAt: Date.now() });
  await removeUploadedCover(id);
  revalidatePath('/', 'layout');
  redirect(`/admin/libros/${id}`);
}
