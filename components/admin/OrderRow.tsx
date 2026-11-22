import Link from 'next/link';
import { STATUS_BADGE } from '@/components/admin/styles';
import { customerWhatsappUrl, paymentReminderText, type Alert } from '@/lib/adminQueue';
import { DELIVERY_LABEL } from '@/lib/delivery';
import { formatPrice } from '@/lib/formatPrice';
import { formatDateTime, stepLabel } from '@/lib/orderStatus';
import type { Order } from '@/lib/orderTypes';

const ALERT_STYLE: Record<Alert['level'], string> = {
  late: 'bg-brick text-cream',
  warn: 'bg-mustard text-forest',
  info: 'text-ink',
};

/** Una fila de la lista de pedidos: datos, estado, alerta y (si no pagó) recordatorio por WhatsApp. */
export function OrderRow({ order: o, alert }: { order: Order; alert: Alert | null }) {
  const reminder = o.status === 'recibido' ? customerWhatsappUrl(o.customer.telefono, paymentReminderText(o)) : null;
  return (
    <li className={alert?.level === 'late' ? 'border-l-[6px] border-brick' : ''}>
      <Link
        href={`/admin/pedidos/${encodeURIComponent(o.id)}`}
        className="focus-ring grid gap-x-4 gap-y-1 px-4 py-4 hover:bg-beige md:grid-cols-[1.4fr_1.6fr_1fr_1fr_auto] md:items-center md:px-5"
      >
        <span>
          <span className="block text-[14px] font-bold">{o.id}</span>
          <span className="block text-[12px] font-medium">{formatDateTime(o.createdAt)}</span>
        </span>
        <span className="text-[14px] font-medium">
          {o.customer.nombre}
          <span className="block text-[12px]">
            {o.customer.ciudad}, {o.customer.provincia}
          </span>
        </span>
        <span className="text-[13px] font-medium">
          {o.method === 'transferencia' ? 'Transferencia' : 'Mercado Pago'}
          <span className="block text-[12px]">{DELIVERY_LABEL[o.delivery ?? 'envio']}</span>
        </span>
        <span className="text-[14px] font-bold">{formatPrice(o.total)}</span>
        <span className={`justify-self-start rounded-full px-3 py-1 text-[12px] font-bold ${STATUS_BADGE[o.status]}`}>
          {stepLabel(o.status, o)}
        </span>
      </Link>
      {(alert || reminder) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-4 md:px-5">
          {alert && (
            <p className={`rounded-full text-[12px] font-bold ${alert.level === 'info' ? '' : 'px-3 py-1'} ${ALERT_STYLE[alert.level]}`}>
              {alert.level === 'late' && '⚠ '}
              {alert.text}
            </p>
          )}
          {reminder && (
            <a
              href={reminder}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring rounded-sm text-[12px] font-bold underline underline-offset-2"
            >
              Recordarle el pago por WhatsApp
            </a>
          )}
        </div>
      )}
    </li>
  );
}
