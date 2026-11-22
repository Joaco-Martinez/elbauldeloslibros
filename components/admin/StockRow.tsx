'use client';

import Image from 'next/image';
import { useActionState } from 'react';
import { changeStock, saveStock, type ActionState } from '@/app/admin/actions';
import type { Units } from '@/lib/stock';

const LOW = 3;

function badge(units: Units) {
  if (units === null) return { label: 'Sin controlar', className: 'bg-beige text-ink' };
  if (units === 0) return { label: 'Agotado · oculto', className: 'bg-ink text-cream' };
  if (units <= LOW) return { label: 'Últimas unidades', className: 'bg-mustard text-forest' };
  return { label: 'En stock', className: 'bg-forest text-cream' };
}

interface StockRowProps {
  id: string;
  title: string;
  author?: string;
  price: string;
  units: Units;
  cover?: string;
}

export function StockRow({ id, title, author, price, units, cover }: StockRowProps) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveStock, {});
  const b = badge(units);

  return (
    <li className="grid grid-cols-[48px_1fr] items-center gap-x-4 gap-y-3 px-4 py-4 md:grid-cols-[48px_1.6fr_auto_auto_auto] md:px-5">
      <div className="relative row-span-2 h-[68px] w-12 overflow-hidden rounded-[4px] bg-beige md:row-span-1">
        {cover && <Image src={cover} alt="" fill sizes="48px" className="object-cover" />}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold">{title}</p>
        <p className="truncate text-[12px] font-medium">
          {author ? `${author} · ` : ''}
          {price}
        </p>
        <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${b.className}`}>{b.label}</span>
      </div>

      {/* − cantidad + */}
      <div className="col-start-2 flex items-center gap-2 md:col-start-auto">
        <form action={changeStock}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="delta" value="-1" />
          <button
            type="submit"
            disabled={units === null || units === 0}
            aria-label={`Restar una unidad de ${title}`}
            className="btn h-9 w-9 border-[1.5px] border-ink text-[18px] disabled:opacity-40"
          >
            −
          </button>
        </form>
        <span className="min-w-[3.5rem] text-center">
          <span className="display block text-[1.6rem]">{units === null ? '—' : units}</span>
          <span className="block text-[11px] font-medium">unidades</span>
        </span>
        <form action={changeStock}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="delta" value="1" />
          <button type="submit" aria-label={`Sumar una unidad de ${title}`} className="btn h-9 w-9 bg-forest text-[18px] text-cream">
            +
          </button>
        </form>
      </div>

      {/* Cantidad exacta */}
      <form action={action} className="col-start-2 flex items-center gap-2 md:col-start-auto">
        <input type="hidden" name="id" value={id} />
        <label className="sr-only" htmlFor={`units-${id}`}>
          Cantidad exacta de {title}
        </label>
        <input
          id={`units-${id}`}
          name="units"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="Cant."
          className="h-9 w-20 rounded-[10px] border-[1.5px] border-ink bg-cream px-2.5 text-[14px] font-medium focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest"
        />
        <button type="submit" disabled={pending} className="btn h-9 bg-brick px-3.5 text-[13px] text-cream">
          {pending ? '…' : 'Cargar'}
        </button>
      </form>

      {(state.error || state.message) && (
        <p
          role={state.error ? 'alert' : 'status'}
          className={`col-span-2 text-[12px] font-bold md:col-span-5 ${state.error ? 'text-brick' : 'text-forest'}`}
        >
          {state.error ?? state.message}
        </p>
      )}
    </li>
  );
}
