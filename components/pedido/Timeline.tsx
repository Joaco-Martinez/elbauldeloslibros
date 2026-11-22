import { FLOW, formatDateTime, stepDetail, stepIndex, stepLabel } from '@/lib/orderStatus';
import type { Order } from '@/lib/orderTypes';

/** Línea de tiempo del pedido: hecho (verde), actual (dorado), pendiente (beige). */
export function Timeline({ order }: { order: Order }) {
  if (order.status === 'cancelado') {
    return (
      <p className="rounded-card bg-beige p-5 text-[15px] font-medium">
        <strong>Pedido cancelado.</strong> {stepDetail('cancelado', order)}
      </p>
    );
  }

  const current = stepIndex(order.status);

  return (
    <ol className="relative">
      {FLOW.map((status, i) => {
        const done = i < current;
        const isCurrent = i === current;
        const event = [...order.history].reverse().find((e) => e.status === status);
        return (
          <li key={status} className="relative flex gap-4 pb-7 last:pb-0" aria-current={isCurrent ? 'step' : undefined}>
            {i < FLOW.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-9 h-[calc(100%-2.5rem)] w-[3px] rounded-full ${done ? 'bg-forest' : 'bg-beige'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-[3px] text-[13px] font-bold ${
                done
                  ? 'border-forest bg-forest text-cream'
                  : isCurrent
                    ? 'border-mustard bg-mustard text-forest'
                    : 'border-beige bg-cream text-leather'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <div className="pt-1">
              <p className={`text-[16px] font-bold ${done || isCurrent ? 'text-ink' : 'text-leather'}`}>
                {stepLabel(status, order)}
                <span className="sr-only">{done ? ' (listo)' : isCurrent ? ' (paso actual)' : ' (pendiente)'}</span>
              </p>
              {event && (done || isCurrent) && <p className="mt-0.5 text-[12px] font-medium">{formatDateTime(event.at)}</p>}
              {isCurrent && <p className="mt-1.5 max-w-[46ch] text-[14px] font-medium leading-[1.45]">{stepDetail(status, order)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
