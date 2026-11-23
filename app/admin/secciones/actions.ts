'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { books, categories, codeCategoryIds, SECTION_TONES, type CustomCategory } from '@/data/books';
import { isAdmin } from '@/lib/adminAuth';
import { getCustomCategory, loadCatalog, removeCustomCategory, saveCustomCategory } from '@/lib/catalog';
import { slugify } from '@/lib/slug';

export interface SectionFormState {
  error?: string;
  ok?: boolean;
}

const RESERVED = new Set(['contenido', 'comprar', 'resenas', 'recomendados']);

/** Crea o edita una sección (nombre, frase y color). */
export async function saveSection(_prev: SectionFormState, form: FormData): Promise<SectionFormState> {
  if (!(await isAdmin())) return { error: 'Tu sesión venció. Volvé a entrar.' };
  await loadCatalog(true);

  const editingId = String(form.get('id') ?? '');
  const label = String(form.get('label') ?? '').trim().replace(/\s+/g, ' ');
  const blurb = String(form.get('blurb') ?? '').trim().replace(/\s+/g, ' ');
  const tone = String(form.get('tone') ?? '');

  if (!label) return { error: 'Poné el nombre de la sección.' };
  if (label.length > 40) return { error: 'El nombre es demasiado largo (máximo 40 letras).' };
  if (blurb.length > 120) return { error: 'La frase es demasiado larga (máximo 120 letras).' };
  const toneOk = SECTION_TONES.find((t) => t.tone === tone);
  if (!toneOk) return { error: 'Elegí un color.' };
  const sameName = categories.find((c) => c.id !== editingId && c.label.toLowerCase() === label.toLowerCase());
  if (sameName) return { error: `Ya hay una sección que se llama "${sameName.label}".` };

  const now = Date.now();
  let cat: CustomCategory;
  if (editingId) {
    const index = categories.findIndex((c) => c.id === editingId);
    if (index === -1) return { error: 'Esa sección ya no existe.' };
    const prev = await getCustomCategory(editingId);
    cat = { id: editingId, label, blurb, tone: toneOk.tone, order: prev?.order ?? orderAt(index), createdAt: prev?.createdAt ?? now };
  } else {
    let id = slugify(label) || 'seccion';
    for (let n = 2; categories.some((c) => c.id === id) || books.some((b) => b.id === id) || RESERVED.has(id); n++) id = `${slugify(label)}-${n}`;
    const maxOrder = Math.max(0, ...categories.map((_, i) => orderAt(i)));
    cat = { id, label, blurb, tone: toneOk.tone, order: maxOrder + 10, createdAt: now };
  }

  await saveCustomCategory(cat);
  revalidatePath('/', 'layout');
  return { ok: true };
}

/** Orden actual de la sección en la posición `i` (todas se renumeran de a 10 al mover). */
const orderAt = (i: number) => i * 10;

/** Sube o baja una sección en el catálogo. */
export async function moveSection(form: FormData) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  await loadCatalog(true);
  const id = String(form.get('id') ?? '');
  const dir = Number(form.get('dir'));
  const list = [...categories];
  const i = list.findIndex((c) => c.id === id);
  const j = i + (dir < 0 ? -1 : 1);
  if (i === -1 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  // Se guarda el orden de todas (así queda fijo aunque se agreguen otras).
  const now = Date.now();
  for (const [k, c] of list.entries()) {
    const prev = await getCustomCategory(c.id);
    if (prev?.order === orderAt(k)) continue;
    await saveCustomCategory({ ...c, order: orderAt(k), createdAt: prev?.createdAt ?? now });
  }
  revalidatePath('/', 'layout');
}

/** Borra una sección creada en el panel (solo si no tiene libros). Las de fábrica vuelven a su nombre y color. */
export async function deleteSection(form: FormData) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  await loadCatalog(true);
  const id = String(form.get('id') ?? '');
  if (!categories.some((c) => c.id === id)) return;
  if (!codeCategoryIds.has(id) && books.some((b) => b.category === id)) {
    redirect('/admin/secciones?error=con-libros');
  }
  await removeCustomCategory(id);
  revalidatePath('/', 'layout');
  redirect(`/admin/secciones?${codeCategoryIds.has(id) ? 'restaurada' : 'borrada'}=1`);
}
