import { receiptWhatsappUrl } from '@/lib/receipt';
import { WHATSAPP_DISPLAY } from '@/lib/site';

/** Botón para mandar el comprobante por WhatsApp con el número de pedido y el monto ya escritos. */
export function ReceiptButton({ orderId, total, className = '' }: { orderId: string; total: number; className?: string }) {
  return (
    <a
      href={receiptWhatsappUrl(orderId, total)}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn h-11 bg-forest px-5 text-[14px] text-cream ${className}`}
      style={{ ['--ring' as string]: 'var(--color-forest)' }}
    >
      Enviar comprobante por WhatsApp
      <span className="sr-only"> al {WHATSAPP_DISPLAY}, abre WhatsApp</span>
    </a>
  );
}
