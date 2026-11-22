'use client';

import { useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

const textareaClass =
  'w-full rounded-[14px] border-[1.5px] border-ink bg-cream px-4 py-3 text-[15px] font-medium text-ink placeholder:text-leather focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest';

const LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

/** Estrellas de 1 a 5 con radios reales (se puede usar con teclado y lector de pantalla). */
function Stars({ name, legend, value, onChange }: { name: string; legend: ReactNode; value: number; onChange: (n: number) => void }) {
  return (
    <fieldset>
      <legend className="text-[14px] font-bold">{legend}</legend>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-full p-0.5 focus-within:outline focus-within:outline-[3px] focus-within:outline-forest">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" />
            <span className="sr-only">
              {n} {n === 1 ? 'estrella' : 'estrellas'} ({LABELS[n]})
            </span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-9 w-9 transition-transform hover:scale-110 ${n <= value ? 'text-mustard' : 'text-beige'}`}>
              <path
                fill="currentColor"
                stroke="var(--color-forest)"
                strokeWidth="1.2"
                d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"
              />
            </svg>
          </label>
        ))}
        <span className="ml-2 text-[13px] font-bold" aria-hidden="true">
          {LABELS[value]}
        </span>
      </div>
    </fieldset>
  );
}

export function OpinionForm({
  orderId,
  token,
  books,
}: {
  orderId: string;
  token: string;
  books: { id: string; title: string; cover: ReactNode }[];
}) {
  const [bookRatings, setBookRatings] = useState<Record<string, number>>({});
  const [bookTexts, setBookTexts] = useState<Record<string, string>>({});
  const [storeRating, setStoreRating] = useState(0);
  const [storeText, setStoreText] = useState('');
  const [allowPublish, setAllowPublish] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!storeRating) {
      setError('Elegí cuántas estrellas le das a la tienda.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/opiniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          token,
          books: books.map((b) => ({ bookId: b.id, rating: bookRatings[b.id] ?? 0, text: bookTexts[b.id] ?? '' })),
          store: { rating: storeRating, text: storeText, allowPublish },
          suggestion,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Algo salió mal. Probá de nuevo.');
        setSending(false);
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
      setSending(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-card bg-forest p-6 text-cream md:p-8">
        <p className="display t-category">¡Gracias!</p>
        <p className="mt-3 text-[15px] font-medium leading-[1.5]">
          Leemos cada opinión. Lo que nos contaste nos ayuda a armar una tienda mejor, y ahora sos parte de eso.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10" style={{ '--ring': 'var(--color-forest)' } as CSSProperties}>
      {books.length > 0 && (
        <section aria-labelledby="op-libros">
          <h2 id="op-libros" className="display t-category text-rust">
            Tus libros.
          </h2>
          <p className="mt-2 text-[14px] font-medium">Tu reseña ayuda a otros lectores a elegir. Se publica con tu nombre de pila y tu ciudad.</p>
          <ul className="mt-5 space-y-5">
            {books.map((b) => (
              <li key={b.id} className="flex gap-4 rounded-card bg-beige p-4 md:gap-5 md:p-5">
                <div className="w-16 shrink-0 md:w-20">{b.cover}</div>
                <div className="min-w-0 flex-1 space-y-3">
                  <Stars
                    name={`libro-${b.id}`}
                    legend={b.title}
                    value={bookRatings[b.id] ?? 0}
                    onChange={(n) => setBookRatings((r) => ({ ...r, [b.id]: n }))}
                  />
                  <label className="block">
                    <span className="sr-only">Tu reseña de {b.title}</span>
                    <textarea
                      rows={2}
                      maxLength={1000}
                      value={bookTexts[b.id] ?? ''}
                      onChange={(e) => setBookTexts((t) => ({ ...t, [b.id]: e.target.value }))}
                      placeholder="¿Qué te pareció? (opcional)"
                      className={textareaClass}
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="op-tienda">
        <h2 id="op-tienda" className="display t-category text-rust">
          Tu experiencia.
        </h2>
        <div className="mt-5 space-y-4 rounded-card bg-beige p-4 md:p-5">
          <Stars name="tienda" legend="¿Cómo fue comprar en El Baul de los Libros?" value={storeRating} onChange={setStoreRating} />
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold">
              Contanos cómo te fue <span className="font-medium">(el envío, el empaque, la atención)</span>
            </span>
            <textarea rows={3} maxLength={1000} value={storeText} onChange={(e) => setStoreText(e.target.value)} className={textareaClass} />
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-[14px] font-medium">
            <input
              type="checkbox"
              checked={allowPublish}
              onChange={(e) => setAllowPublish(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-forest)]"
            />
            Pueden mostrar mi opinión de la tienda en la web (con mi nombre de pila y mi ciudad).
          </label>
        </div>
      </section>

      <section aria-labelledby="op-mejoras">
        <h2 id="op-mejoras" className="display t-category text-rust">
          ¿Qué mejorarías?
        </h2>
        <p className="mt-2 text-[14px] font-medium">
          Esta tienda la armamos entre todos. Un libro que te gustaría encontrar, algo del envío, de la página… Esto lo leemos
          solo nosotros.
        </p>
        <label className="mt-4 block">
          <span className="sr-only">Tu sugerencia</span>
          <textarea
            rows={4}
            maxLength={2000}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Me gustaría que…"
            className={textareaClass}
          />
        </label>
      </section>

      {error && (
        <p role="alert" className="rounded-[12px] bg-brick px-4 py-3 text-[14px] font-bold text-cream">
          {error}
        </p>
      )}
      <Button type="submit" variant="gold" className="h-14 w-full text-[16px] sm:w-auto sm:px-10" disabled={sending}>
        {sending ? 'Enviando…' : 'Mandar mi opinión'}
      </Button>
    </form>
  );
}
