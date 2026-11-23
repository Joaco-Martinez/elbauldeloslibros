'use client';

import { startTransition, useActionState, useMemo, useRef, useState, type FormEvent } from 'react';
import { saveBook, type BookFormState } from '@/app/admin/libros/actions';
import { Book3D } from '@/components/ui/Book3D';
import { normalizeTitle } from '@/data/books';
import type { Razon } from '@/data/razones';
import { toneVar, type Tone } from '@/lib/tokens';

interface Option {
  id: string;
  label: string;
}

/** Datos de los demás libros: para detectar títulos repetidos y vincular ediciones. */
export interface OtherBook {
  id: string;
  title: string;
  author: string;
  category: string;
  formato?: string;
  grupo?: string;
  sinopsis: string;
  momentos: string[];
  razones: Razon[];
  precio: number;
}

export interface BookFormValues {
  id?: string;
  title: string;
  author: string;
  category: string;
  precio: number | '';
  sinopsis: string;
  momentos: string[];
  razones: Razon[];
  formato: string;
  /** Id de otro libro del mismo grupo (si ya es una edición). */
  edicionDe: string;
  grupo?: string;
  /** Foto actual (si tiene). */
  coverSrc?: string;
  coverRatio?: number;
}

interface BookFormProps {
  values: BookFormValues;
  categories: (Option & { tone: Tone })[];
  momentos: Option[];
  formatos: string[];
  others: OtherBook[];
}

const MAX_SIDE = 1200;
const MAX_MOMENTOS = 3;
const EMPTY_RAZONES: Razon[] = [0, 1, 2, 3].map(() => ({ titulo: '', texto: '' }));

/** Achica la foto en el navegador (máx. 1200 px) y la pasa a JPG: sube rápido aunque venga del celular. */
async function shrinkPhoto(file: File): Promise<{ blob: Blob; ratio: number; url: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff'; // PNG con fondo transparente → blanco
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo leer la foto'))), 'image/jpeg', 0.85),
    );
    return { blob, ratio: w / h, url: URL.createObjectURL(blob) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const field =
  'mt-1.5 w-full rounded-[10px] border-[1.5px] border-ink bg-cream px-3 py-2.5 text-[15px] font-medium focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest';
const labelCls = 'block text-[13px] font-bold';
const boxCls = 'rounded-card border-2 border-beige p-4 md:p-5';

export function BookForm({ values, categories, momentos, formatos, others }: BookFormProps) {
  const [state, action, pending] = useActionState<BookFormState, FormData>(saveBook, {});
  const [photo, setPhoto] = useState<{ blob: Blob; ratio: number; url: string } | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !values.id;

  const [title, setTitle] = useState(values.title);
  const [author, setAuthor] = useState(values.author);
  const [category, setCategory] = useState(values.category);
  const [price, setPrice] = useState<string>(values.precio === '' ? '' : String(values.precio));
  const [sinopsis, setSinopsis] = useState(values.sinopsis);
  const [picked, setPicked] = useState<string[]>(values.momentos);
  const [razones, setRazones] = useState<Razon[]>(values.razones.length === 4 ? values.razones : EMPTY_RAZONES);
  const [formato, setFormato] = useState(values.formato || 'Tapa blanda');
  const [edicionDe, setEdicionDe] = useState(values.edicionDe);
  const [otroFormato, setOtroFormato] = useState('');
  const [dismissed, setDismissed] = useState<string[]>([]);

  const transfer = Number(price.replace(/\D/g, ''));
  const listPrice = transfer > 0 ? Math.ceil((transfer * 10) / 9 / 100) * 100 : 0;
  const money = (n: number) => `$ ${n.toLocaleString('es-AR')}`;

  const linked = others.find((o) => o.id === edicionDe);

  // Mismo título ya cargado (sin contar este libro ni sus ediciones ya vinculadas).
  const duplicates = useMemo(() => {
    const t = normalizeTitle(title);
    if (t.length < 3) return [];
    return others.filter(
      (o) => normalizeTitle(o.title) === t && !(values.grupo && o.grupo === values.grupo) && !dismissed.includes(o.id),
    );
  }, [title, others, values.grupo, dismissed]);
  const duplicate = !edicionDe ? duplicates[0] : undefined;

  /** "Sí, es otra edición": vincula y completa lo que esté vacío con los datos del otro libro. */
  function linkTo(o: OtherBook) {
    setEdicionDe(o.id);
    const theirs = o.formato ?? 'Tapa blanda';
    setOtroFormato(theirs);
    // Este pasa a ser el otro formato (si el que ya está es tapa blanda, este es tapa dura).
    if (formato === theirs) setFormato(theirs === 'Tapa dura' ? 'Tapa blanda' : 'Tapa dura');
    if (!author) setAuthor(o.author);
    if (!category) setCategory(o.category);
    if (!sinopsis) setSinopsis(o.sinopsis);
    if (picked.length === 0) setPicked(o.momentos);
    if (razones.every((r) => !r.titulo && !r.texto) && o.razones.length === 4) setRazones(o.razones);
  }

  async function onPhoto(file: File | undefined) {
    setPhotoError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('Elegí una foto (JPG, PNG o WebP).');
      return;
    }
    setReading(true);
    try {
      if (photo) URL.revokeObjectURL(photo.url);
      setPhoto(await shrinkPhoto(file));
    } catch {
      setPhotoError('No pudimos leer esa foto. Probá con otra (JPG o PNG).');
    } finally {
      setReading(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.delete('tapa-original');
    if (photo) {
      fd.set('tapa', new File([photo.blob], 'tapa.jpg', { type: 'image/jpeg' }));
      fd.set('ratio', String(photo.ratio));
    }
    startTransition(() => action(fd));
  }

  const preview = photo?.url ?? values.coverSrc;
  const ratio = Math.min(0.8, Math.max(0.55, photo?.ratio ?? values.coverRatio ?? 0.68));
  const spine = toneVar(categories.find((c) => c.id === category)?.tone ?? 'forest');
  const setRazon = (i: number, key: keyof Razon, value: string) =>
    setRazones((list) => list.map((r, k) => (k === i ? { ...r, [key]: value } : r)));

  return (
    <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-[240px_1fr] md:gap-10">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {/* Foto + vista previa animada (como se ve en la página del libro) */}
      <div>
        <p className={labelCls}>Foto de la tapa</p>
        <div className="mt-1.5 flex aspect-[4/5] w-full max-w-[240px] items-center justify-center rounded-[18px] bg-forest px-[18%] py-[14%]">
          {preview ? (
            <div className="relative h-full" style={{ aspectRatio: `${ratio}` }}>
              <Book3D key={preview} spineColor={spine} ratio={ratio} hard={formato === 'Tapa dura'} className="h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Vista previa de la tapa" className="h-full w-full rounded-[2px] object-cover" />
              </Book3D>
            </div>
          ) : (
            <span className="text-center text-[12px] font-medium text-cream">
              Subí la foto y acá ves el libro animado, como va a quedar en la tienda.
            </span>
          )}
        </div>
        <input
          ref={fileRef}
          id="tapa-original"
          name="tapa-original"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onPhoto(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={reading}
          className="btn mt-3 h-10 w-full max-w-[240px] bg-brick px-4 text-[13px] text-cream"
        >
          {reading ? 'Leyendo…' : preview ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {photoError && (
          <p role="alert" className="mt-2 text-[12px] font-bold text-brick">
            {photoError}
          </p>
        )}
        <p className="mt-2 max-w-[240px] text-[12px] font-medium leading-[1.45]">
          De frente, derecha y recortada justo al borde de la tapa (sin fondo alrededor). Sirve la del celular: se achica sola. El
          lomo y la animación se arman solos.
        </p>
      </div>

      {/* Datos */}
      <div className="grid min-w-0 gap-6">
        <div>
          <label htmlFor="title" className={labelCls}>
            Título *
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={field}
          />
        </div>

        {duplicate && (
          <div role="status" className="rounded-[14px] bg-mustard p-4 text-forest">
            <p className="text-[14px] font-bold">
              Ya tenés “{duplicate.title}”{duplicate.author ? ` de ${duplicate.author}` : ''}
              {duplicate.formato ? ` (${duplicate.formato.toLowerCase()})` : ''} a {money(duplicate.precio)}.
            </p>
            <p className="mt-1 text-[13px] font-medium">
              ¿Es otra edición del mismo libro (por ejemplo, tapa dura)? Así se muestra como un solo libro con las dos opciones y
              cada una con su precio y su stock.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => linkTo(duplicate)} className="btn h-9 bg-forest px-4 text-[13px] text-cream">
                Sí, es otra edición
              </button>
              <button
                type="button"
                onClick={() => setDismissed((d) => [...d, duplicate.id])}
                className="btn h-9 border-[1.5px] border-forest px-4 text-[13px]"
              >
                No, es otro libro
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="author" className={labelCls}>
              Autor
            </label>
            <input
              id="author"
              name="author"
              maxLength={100}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="category" className={labelCls}>
              Sección *
            </label>
            <select
              id="category"
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={field}
            >
              <option value="" disabled>
                Elegí una
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <a href="/admin/secciones" className="mt-1.5 inline-block text-[12px] font-bold underline underline-offset-2">
              Crear o editar secciones
            </a>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="precio" className={labelCls}>
              Precio con transferencia *
            </label>
            <input
              id="precio"
              name="precio"
              required
              inputMode="numeric"
              placeholder="Ej. 15000"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
              className={field}
            />
            <p className="mt-1.5 text-[12px] font-medium" aria-live="polite">
              {listPrice > 0 ? (
                <>
                  Con Mercado Pago: <strong>{money(listPrice)}</strong> (se calcula solo, +10%).
                </>
              ) : (
                'Lo que cobrás de verdad, en pesos y sin centavos.'
              )}
            </p>
          </div>
          {isNew && (
            <div>
              <label htmlFor="stock" className={labelCls}>
                Ejemplares que tenés *
              </label>
              <input id="stock" name="stock" required type="number" min={0} step={1} inputMode="numeric" className={field} />
              <p className="mt-1.5 text-[12px] font-medium">Con 0 se guarda pero no aparece en la web todavía.</p>
            </div>
          )}
        </div>

        {/* Ediciones */}
        <fieldset className={boxCls}>
          <legend className="px-1 text-[15px] font-bold">Edición</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="formato" className={labelCls}>
                Formato
              </label>
              <select id="formato" name="formato" value={formato} onChange={(e) => setFormato(e.target.value)} className={field}>
                {formatos.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edicionDe" className={labelCls}>
                Es otra edición de
              </label>
              <select
                id="edicionDe"
                name="edicionDe"
                value={edicionDe}
                onChange={(e) => {
                  const o = others.find((x) => x.id === e.target.value);
                  if (o) linkTo(o);
                  else setEdicionDe('');
                }}
                className={field}
              >
                <option value="">Ninguno (es un libro único)</option>
                {[...others]
                  .sort((a, b) => a.title.localeCompare(b.title, 'es'))
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                      {o.formato ? ` (${o.formato.toLowerCase()})` : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {linked && (
            <div className="mt-4">
              <label htmlFor="otroFormato" className={labelCls}>
                “{linked.title}”, el que ya tenías, es:
              </label>
              <select
                id="otroFormato"
                name="otroFormato"
                value={otroFormato || linked.formato || 'Tapa blanda'}
                onChange={(e) => setOtroFormato(e.target.value)}
                className={`${field} sm:max-w-[50%]`}
              >
                {formatos.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[12px] font-medium">
                En la tienda va a ser un solo libro con un selector: {otroFormato || linked.formato || 'Tapa blanda'} a{' '}
                {money(linked.precio)}
                {formato && transfer > 0 ? ` y ${formato} a ${money(transfer)}` : ''}. Cada una tiene su propio stock.
              </p>
            </div>
          )}
        </fieldset>

        <div>
          <label htmlFor="sinopsis" className={labelCls}>
            Sinopsis *
          </label>
          <textarea
            id="sinopsis"
            name="sinopsis"
            required
            minLength={20}
            maxLength={700}
            rows={4}
            value={sinopsis}
            onChange={(e) => setSinopsis(e.target.value)}
            className={field}
          />
          <p className="mt-1.5 text-[12px] font-medium">Dos o tres oraciones, como se lo contarías a alguien en la librería.</p>
        </div>

        <fieldset>
          <legend className={labelCls}>Para tu momento (hasta 3)</legend>
          <p className="mt-1 text-[12px] font-medium">
            Aparecen en la página del libro y sirven para recomendar libros parecidos en &quot;Seguí leyendo&quot;.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {momentos.map((m) => {
              const on = picked.includes(m.id);
              const full = !on && picked.length >= MAX_MOMENTOS;
              return (
                <label
                  key={m.id}
                  className={`cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest ${
                    on ? 'border-forest bg-forest text-cream' : 'border-ink'
                  } ${full ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  <input
                    type="checkbox"
                    name="momentos"
                    value={m.id}
                    checked={on}
                    disabled={full}
                    onChange={() => setPicked((p) => (on ? p.filter((x) => x !== m.id) : [...p, m.id]))}
                    className="sr-only"
                  />
                  {m.label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* 4 razones */}
        <fieldset className={boxCls}>
          <legend className="px-1 text-[15px] font-bold">4 razones para leerlo</legend>
          <p className="text-[12px] font-medium">
            Se muestran en tarjetas debajo del libro. Completá las 4 (un título corto y una o dos líneas) o dejalas vacías y la
            sección no aparece.
          </p>
          <ol className="mt-4 grid gap-4 sm:grid-cols-2">
            {razones.map((r, i) => (
              <li key={i} className="rounded-[12px] bg-beige p-3">
                <label htmlFor={`razon${i}_titulo`} className="text-[12px] font-bold">
                  Razón {i + 1}: título
                </label>
                <input
                  id={`razon${i}_titulo`}
                  name={`razon${i}_titulo`}
                  maxLength={60}
                  placeholder={i === 0 ? 'Ej. Se lee de un tirón' : ''}
                  value={r.titulo}
                  onChange={(e) => setRazon(i, 'titulo', e.target.value)}
                  className={`${field} py-2 text-[14px]`}
                />
                <label htmlFor={`razon${i}_texto`} className="mt-2 block text-[12px] font-bold">
                  Texto
                </label>
                <textarea
                  id={`razon${i}_texto`}
                  name={`razon${i}_texto`}
                  maxLength={200}
                  rows={2}
                  placeholder={i === 0 ? 'Ej. Capítulos cortos que te atrapan desde la primera página.' : ''}
                  value={r.texto}
                  onChange={(e) => setRazon(i, 'texto', e.target.value)}
                  className={`${field} py-2 text-[14px]`}
                />
              </li>
            ))}
          </ol>
        </fieldset>

        <p className="text-[12px] font-medium">
          Las reseñas de los compradores y &quot;Seguí leyendo&quot; se completan solos.
        </p>

        {state.error && (
          <p role="alert" className="rounded-[10px] bg-brick px-4 py-3 text-[14px] font-bold text-cream">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending || reading} className="btn h-12 bg-forest px-7 text-[15px] text-cream">
            {pending ? 'Guardando…' : isNew ? 'Agregar libro' : 'Guardar cambios'}
          </button>
          <a href="/admin/libros" className="text-[14px] font-bold underline underline-offset-2">
            Cancelar
          </a>
        </div>
      </div>
    </form>
  );
}
