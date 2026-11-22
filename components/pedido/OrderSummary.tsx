import { Sticker } from '@/components/ui/Sticker';
import { DELIVERY_LABEL, isLocalDelivery } from '@/lib/delivery';
import { formatPrice } from '@/lib/formatPrice';
import type { Order } from '@/lib/orderTypes';

/** Tarjeta verde con el detalle de la compra (seguimiento y panel). */
export function OrderSummary({ order, showContact = false }: { order: Order; showContact?: boolean }) {
  const c = order.customer;
  const delivery = order.delivery ?? 'envio';
  return (
    <div className="relative rounded-card bg-forest p-6 text-cream md:p-7">
      <Sticker variant="checker" size={42} rotate={12} className="-right-1 -top-4 md:-right-3" />
      <h2 className="display t-category">Tu compra.</h2>
      <ul className="mt-5 space-y-3 text-[14px]">
        {order.lines.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-4">
            <span className="font-medium">
              {l.qty} × {l.title}
            </span>
            <span className="shrink-0 font-bold">{formatPrice(l.subtotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-2 border-t-2 border-leaf pt-5 text-[14px]">
        {order.discount > 0 && (
          <div className="flex justify-between gap-4 text-mustard">
            <dt className="font-bold">Descuento transferencia</dt>
            <dd className="font-bold">−{formatPrice(order.discount)}</dd>
          </div>
        )}
        {(order.shippingCost ?? 0) > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="font-medium">{DELIVERY_LABEL[delivery]}</dt>
            <dd className="font-bold">{formatPrice(order.shippingCost ?? 0)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Pago</dt>
          <dd className="font-bold">{order.method === 'transferencia' ? 'Transferencia' : 'Mercado Pago'}</dd>
        </div>
        <div className="flex items-end justify-between gap-4 pt-2">
          <dt className="font-bold">Total</dt>
          <dd className="display text-[2rem]">{formatPrice(order.total)}</dd>
        </div>
      </dl>
      <div className="mt-5 border-t-2 border-leaf pt-5 text-[13px] font-medium leading-[1.5]">
        <p className="font-bold">
          {DELIVERY_LABEL[delivery]}
          {isLocalDelivery(delivery) ? (
            <span className="font-medium"> · coordinamos por WhatsApp</span>
          ) : (
            <span className="font-medium"> · Correo Argentino</span>
          )}
        </p>
        {delivery === 'retiro' || delivery === 'sucursal' ? (
          <p>
            {c.nombre}
            <br />
            {c.ciudad}, {c.provincia}
            {delivery === 'sucursal' && ` (CP ${c.cp})`}
          </p>
        ) : (
          <p>
            {c.nombre}
            <br />
            {c.calle}
            {c.pisoDepto && `, ${c.pisoDepto}`}
            <br />
            {c.ciudad}, {c.provincia} (CP {c.cp})
          </p>
        )}
        {showContact && (
          <p className="mt-2">
            {c.email} · {c.telefono}
          </p>
        )}
        {c.notas && (
          <p className="mt-2">
            {delivery === 'sucursal' ? 'Sucursal preferida' : 'Notas'}: {c.notas}
          </p>
        )}
      </div>
    </div>
  );
}
