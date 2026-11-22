'use client';

import { useState } from 'react';

/** Fila "dato + Copiar" (datos de transferencia, datos para la etiqueta). Va dentro de un <dl>. */
export function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-cream py-3 last:border-b-0">
      <div className="min-w-0">
        <dt className="text-[12px] font-bold">{label}</dt>
        <dd className="break-all text-[15px] font-medium">{value}</dd>
      </div>
      <button
        type="button"
        className="btn h-8 shrink-0 border-[1.5px] border-ink px-3 text-[12px]"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            // Sin permiso de portapapeles: el dato igual está a la vista.
          }
        }}
      >
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}
