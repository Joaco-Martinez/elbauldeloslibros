'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { CopyRow } from '@/components/ui/CopyRow';

const inputClass =
  'h-12 w-full rounded-[14px] border-[1.5px] border-ink bg-cream px-4 text-[15px] font-medium text-ink placeholder:text-leather focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest';

/** Formulario del botón de arrepentimiento: sin registrarse, devuelve el código en el momento. */
export function WithdrawalForm({ whatsapp }: { whatsapp: string }) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; email: string; emailSent: boolean } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(['nombre', 'email', 'telefono', 'pedido', 'motivo'].map((k) => [k, String(form.get(k) ?? '')]));
    try {
      const res = await fetch('/api/arrepentimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Algo salió mal. Probá de nuevo o escribinos por WhatsApp.');
        setSending(false);
        return;
      }
      setDone({ code: data.code, email: payload.email, emailSent: Boolean(data.emailSent) });
    } catch {
      setError('No pudimos conectarnos. Revisá tu conexión o escribinos por WhatsApp.');
      setSending(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="rounded-card bg-forest p-6 text-cream md:p-7">
        <p className="display t-category">Listo, lo recibimos.</p>
        <p className="mt-3 text-[15px] font-medium leading-[1.5]">
          Guardá este código: es la constancia de tu arrepentimiento.
          {done.emailSent && (
            <>
              {' '}
              También te lo mandamos a <strong>{done.email}</strong>.
            </>
          )}
        </p>
        <dl className="mt-4 rounded-[14px] bg-cream px-4 text-ink">
          <CopyRow label="Código de arrepentimiento" value={done.code} />
        </dl>
        <p className="mt-4 text-[14px] font-medium leading-[1.5]">
          En las próximas 24 h hábiles te escribimos para coordinar la devolución. Cuando recibamos el libro sin uso y en el
          mismo estado, te devolvemos lo pagado.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" style={{ '--ring': 'var(--color-forest)' } as CSSProperties}>
      <div className="sm:col-span-2">
        <label htmlFor="arr-nombre" className="mb-1.5 block text-[13px] font-bold">
          Nombre y apellido
        </label>
        <input id="arr-nombre" name="nombre" required autoComplete="name" maxLength={120} className={inputClass} />
      </div>
      <div>
        <label htmlFor="arr-email" className="mb-1.5 block text-[13px] font-bold">
          Email
        </label>
        <input id="arr-email" name="email" type="email" required autoComplete="email" maxLength={160} className={inputClass} />
      </div>
      <div>
        <label htmlFor="arr-tel" className="mb-1.5 block text-[13px] font-bold">
          Celular <span className="font-medium">(opcional)</span>
        </label>
        <input id="arr-tel" name="telefono" type="tel" autoComplete="tel" maxLength={40} className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="arr-pedido" className="mb-1.5 block text-[13px] font-bold">
          Número de pedido <span className="font-medium">(está en el mail de tu compra, empieza con BDL-)</span>
        </label>
        <input id="arr-pedido" name="pedido" maxLength={40} placeholder="BDL-…" className={`${inputClass} uppercase`} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="arr-motivo" className="mb-1.5 block text-[13px] font-bold">
          Comentario <span className="font-medium">(opcional, no hace falta explicar por qué)</span>
        </label>
        <textarea id="arr-motivo" name="motivo" rows={3} maxLength={1000} className={`${inputClass} h-auto py-3`} />
      </div>
      {error && (
        <p role="alert" className="rounded-[12px] bg-brick px-4 py-3 text-[13px] font-bold text-cream sm:col-span-2">
          {error}
        </p>
      )}
      <div className="flex flex-col items-start gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:gap-5">
        <Button type="submit" variant="rust" className="h-12 w-full px-6 text-[15px] sm:w-auto" disabled={sending}>
          {sending ? 'Enviando…' : 'Quiero arrepentirme de mi compra'}
        </Button>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold underline underline-offset-2">
          O avisanos por WhatsApp
        </a>
      </div>
    </form>
  );
}
