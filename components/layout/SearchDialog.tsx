'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { books, getCategory, normalizeTitle, oneCardPerTitle } from '@/data/books';
import { getMomentos } from '@/data/momentos';
import { formatPrice } from '@/lib/formatPrice';
import { useDialog } from '@/lib/useDialog';

const MAX_RESULTS = 8;

/**
 * Buscador del menú: busca al instante (en el navegador) por título, autor, género o momento
 * ("ansiedad", "plata"…). Solo muestra libros con stock.
 */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const { maxFor, images } = useCart();
  useDialog(open, onClose, panelRef);

  const results = useMemo(() => {
    const words = normalizeTitle(query).split(' ').filter(Boolean);
    if (words.length === 0) return [];
    const available = books.filter((b) => maxFor(b.id) > 0);
    return oneCardPerTitle(
      available.filter((b) => {
        const haystack = normalizeTitle(
          [b.title, b.author ?? '', getCategory(b.category).label, ...getMomentos(b.id).map((m) => m.label)].join(' '),
        );
        return words.every((w) => haystack.includes(w));
      }),
    ).slice(0, MAX_RESULTS);
  }, [query, maxFor]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[10vh]"
      style={{ background: "rgb(0 0 0 / 0.55)" }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar libros"
        className="w-full max-w-[560px] rounded-card bg-cream p-4 text-ink shadow-xl md:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <label htmlFor="buscar" className="sr-only">
            Buscar por título, autor o tema
          </label>
          <input
            id="buscar"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Buscá por título, autor o tema (ej. ansiedad)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 w-full rounded-[14px] border-[1.5px] border-ink bg-cream px-4 text-[16px] font-medium focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest"
          />
          <button
            type="button"
            onClick={onClose}
            className="focus-ring grid h-12 w-12 shrink-0 place-items-center rounded-full text-[22px]"
            aria-label="Cerrar buscador"
            style={{ '--ring': 'var(--color-forest)' } as CSSProperties}
          >
            ×
          </button>
        </div>

        <div aria-live="polite" className="mt-3">
          {query.trim() === '' ? (
            <p className="px-1 text-[13px] font-medium">Probá con “Hábitos”, “Coelho”, “plata” o “novela”.</p>
          ) : results.length === 0 ? (
            <p className="px-1 text-[14px] font-medium">
              No encontramos libros con “{query.trim()}”.{' '}
              <Link href="/catalogo" onClick={onClose} className="font-bold underline underline-offset-2">
                Ver todo el catálogo
              </Link>
            </p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-beige overflow-y-auto">
              {results.map((b) => {
                const cover = images[b.id];
                const multi = (b.ediciones?.length ?? 0) > 1;
                return (
                  <li key={b.id}>
                    <Link
                      href={`/catalogo/${b.id}`}
                      onClick={onClose}
                      className="focus-ring flex items-center gap-3 rounded-[10px] px-1 py-2.5 hover:bg-beige"
                      style={{ '--ring': 'var(--color-forest)' } as CSSProperties}
                    >
                      <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-[3px] bg-beige">
                        {cover && <Image src={cover.src} alt="" fill sizes="40px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-bold">{b.title}</span>
                        <span className="block truncate text-[12px] font-medium">
                          {b.author ? `${b.author} · ` : ''}
                          {getCategory(b.category).label}
                        </span>
                      </span>
                      <span className="shrink-0 text-right text-[13px] font-bold text-brick">
                        {multi && <span className="block text-[10px] text-ink">desde</span>}
                        {formatPrice(b.precioTransferencia)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
