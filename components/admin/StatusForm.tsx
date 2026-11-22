'use client';

import { useActionState } from 'react';
import { updateOrder, type ActionState } from '@/app/admin/actions';
import { Button } from '@/components/ui/Button';
import { FLOW, stepIndex, stepLabel } from '@/lib/orderStatus';
import type { Order, OrderStatus } from '@/lib/orderTypes';
import { adminInput } from './styles';

const ALL: OrderStatus[] = [...FLOW, 'cancelado'];

/** El siguiente paso lógico, para que el formulario ya venga elegido. */
function nextStatus(order: Order): OrderStatus {
  const i = stepIndex(order.status);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : order.status;
}

export function StatusForm({ order }: { order: Order }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateOrder, {});

  return (
    <form action={action} className="rounded-card border-2 border-beige p-5 md:p-6">
      <input type="hidden" name="id" value={order.id} />
      <h2 className="display t-category text-rust">Mover pedido.</h2>

      {/* key: al guardar, los campos se rearman con el pedido actualizado (el mensaje queda). */}
      <div key={order.updatedAt} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="status" className="mb-1.5 block text-[13px] font-bold">
            Nuevo estado
          </label>
          <select id="status" name="status" defaultValue={nextStatus(order)} className={adminInput}>
            {ALL.map((s) => (
              <option key={s} value={s}>
                {stepLabel(s, order)}
                {s === order.status ? ' (actual)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="carrier" className="mb-1.5 block text-[13px] font-bold">
            Empresa de envío
          </label>
          <input id="carrier" name="carrier" defaultValue={order.shipping.carrier} placeholder="Correo Argentino, Andreani…" className={adminInput} />
        </div>
        <div>
          <label htmlFor="tracking" className="mb-1.5 block text-[13px] font-bold">
            Número de seguimiento
          </label>
          <input id="tracking" name="tracking" defaultValue={order.shipping.tracking} className={adminInput} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="eta" className="mb-1.5 block text-[13px] font-bold">
            Fecha estimada de entrega
          </label>
          <input id="eta" name="eta" type="date" defaultValue={order.shipping.eta} className={adminInput} />
          <p className="mt-1 text-[12px] font-medium">Con esto el cliente ve cuántos días faltan.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="note" className="mb-1.5 block text-[13px] font-bold">
            Mensaje para el cliente <span className="font-medium">(opcional)</span>
          </label>
          <textarea id="note" name="note" rows={3} maxLength={500} className={`${adminInput} h-auto py-2.5`} />
        </div>
        <label className="flex items-center gap-2.5 text-[14px] font-bold sm:col-span-2">
          <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-forest" />
          Avisar al cliente por mail
        </label>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-[13px] font-bold text-brick">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="mt-4 rounded-[12px] bg-beige px-4 py-3 text-[13px] font-bold">
          {state.message}
        </p>
      )}

      <Button type="submit" variant="forest" className="mt-5 w-full" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar'}
      </Button>
    </form>
  );
}
