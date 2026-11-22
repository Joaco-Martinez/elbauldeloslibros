'use client';

import Link from 'next/link';
import { SocialLinks } from '@/components/layout/SocialLinks';
import { ReceiptButton } from '@/components/pedido/ReceiptButton';
import { CopyRow } from '@/components/ui/CopyRow';
import { formatPrice } from '@/lib/formatPrice';
import { WHATSAPP_DISPLAY, transferInfoComplete, transferRows } from '@/lib/site';

export interface TransferResult {
  orderId: string;
  token: string;
  total: number;
  discount: number;
  email: string;
  /** Si el mail con los datos le llegó al cliente. */
  emailSent: boolean;
}

export function TransferConfirmation({ result }: { result: TransferResult }) {
  const complete = transferInfoComplete();

  return (
    <div className="mx-auto max-w-[640px]" aria-live="polite">
      <p className="text-[13px] font-bold">Pedido {result.orderId}</p>
      <h2 className="display t-section mt-2 text-rust">¡Recibimos tu pedido!</h2>
      <p className="lede mt-4 !max-w-none">
        Para confirmarlo, hacé dos cosas. {result.emailSent && <>También te mandamos todo a <strong>{result.email}</strong>.</>}
      </p>

      <ol className="mt-8 space-y-6">
        <li className="rounded-card bg-beige p-5 md:p-6">
          <p className="text-[15px] font-bold">
            1. Transferí {formatPrice(result.total)}
            {result.discount > 0 && <span className="font-medium"> (ya con 10% off: ahorrás {formatPrice(result.discount)})</span>}
          </p>
          {complete ? (
            <dl className="mt-2">
              {transferRows().map(([label, value]) => (
                <CopyRow key={label} label={label} value={value} />
              ))}
              <CopyRow label="Monto" value={formatPrice(result.total)} />
            </dl>
          ) : (
            <p className="mt-2 text-[14px] font-medium">Te pasamos los datos bancarios por WhatsApp.</p>
          )}
        </li>
        <li className="rounded-card bg-beige p-5 md:p-6">
          <p className="text-[15px] font-bold">2. Mandanos el comprobante por WhatsApp</p>
          <p className="mt-1 text-[14px] font-medium leading-[1.45]">
            Al {WHATSAPP_DISPLAY}, con tu número de pedido <strong>{result.orderId}</strong>. El mensaje ya va escrito: solo adjuntá
            la captura. Sin el comprobante no podemos confirmar el pedido.
          </p>
          <p className="mt-2 text-[14px] font-bold">
            Te reservamos los libros por 24 h. Si no nos llega el comprobante, se liberan para otra persona.
          </p>
          <ReceiptButton orderId={result.orderId} total={result.total} className="mt-4" />
        </li>
      </ol>

      <p className="mt-8 text-[14px] font-medium">
        Cada vez que tu pedido avance te avisamos por mail. También podés{' '}
        <Link
          href={`/pedido/${encodeURIComponent(result.orderId)}?t=${result.token}`}
          className="focus-ring rounded-sm font-bold underline underline-offset-2"
        >
          seguir tu pedido acá
        </Link>
        .
      </p>

      <div className="mt-8 flex flex-col items-start gap-3 border-t-2 border-beige pt-6">
        <p className="text-[14px] font-bold">Mientras llega, seguinos:</p>
        <SocialLinks size="md" withHandle />
      </div>
    </div>
  );
}
