'use client';

import { useRef, useState } from 'react';
import { receiptWhatsappUrl } from '@/lib/receipt';

interface ReceiptUploadProps {
  orderId: string;
  token: string;
  total: number;
  /** Ya había subido uno (desde el seguimiento): se muestra como recibido, con opción de subir otro. */
  alreadySent?: boolean;
  className?: string;
}

const MAX_SIDE = 1800;

/** Achica fotos grandes del celular (las capturas suelen pesar varios MB). Los PDF se suben tal cual. */
async function prepare(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/heic') return file;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'comprobante.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Subir el comprobante de transferencia desde la web (foto o PDF). WhatsApp queda como alternativa.
 * Al subirlo, le llega al negocio por mail con el archivo y aparece en el panel del pedido.
 */
export function ReceiptUpload({ orderId, token, total, alreadySent = false, className = '' }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>(alreadySent ? 'done' : 'idle');
  const [error, setError] = useState('');

  async function upload(file: File | undefined) {
    if (!file) return;
    setState('sending');
    setError('');
    try {
      const body = new FormData();
      body.set('token', token);
      body.set('file', await prepare(file));
      const res = await fetch(`/api/pedidos/${encodeURIComponent(orderId)}/comprobante`, { method: 'POST', body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'No pudimos subirlo.');
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos subirlo.');
      setState('error');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {state === 'done' ? (
        <div role="status" className="rounded-[14px] bg-forest px-4 py-3 text-cream">
          <p className="text-[15px] font-bold">✓ Recibimos tu comprobante</p>
          <p className="mt-1 text-[13px] font-medium">
            Lo revisamos y te avisamos por mail cuando confirmemos el pago.{' '}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-bold underline underline-offset-2"
            >
              Subir otro
            </button>
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={state === 'sending'}
            className="btn h-12 w-full bg-forest px-5 text-[15px] text-cream sm:w-auto"
            style={{ ['--ring' as string]: 'var(--color-forest)' }}
          >
            {state === 'sending' ? 'Subiendo…' : 'Subir el comprobante'}
          </button>
          <p className="mt-2 text-[12px] font-medium">Foto, captura o PDF del comprobante.</p>
          {state === 'error' && (
            <p role="alert" className="mt-2 text-[13px] font-bold text-brick">
              {error}
            </p>
          )}
        </>
      )}
      <p className="mt-3 text-[13px] font-medium">
        ¿Preferís WhatsApp?{' '}
        <a
          href={receiptWhatsappUrl(orderId, total)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline underline-offset-2"
        >
          Mandalo por WhatsApp
        </a>
      </p>
    </div>
  );
}
