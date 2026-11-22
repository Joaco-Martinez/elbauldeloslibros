import { CopyRow } from '@/components/ui/CopyRow';
import { isLocalDelivery } from '@/lib/delivery';
import { formatPrice } from '@/lib/formatPrice';
import type { Order } from '@/lib/orderTypes';
import { estimatedWeightKg, packagesFor } from '@/lib/shipping';

const BOX = { kg1: { l: 25, a: 18, h: 6 }, kg3: { l: 30, a: 22, h: 12 } } as const;

type Row = [label: string, value: string];

/** Separa "351 5550000" en código de área y número. Pedidos viejos pueden no tener el espacio. */
function splitPhone(tel: string) {
  const m = /^(\d{2,4}) (\d{6,8})$/.exec(tel.trim());
  return m ? { area: m[1], numero: m[2] } : null;
}

function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="mt-5">
      <h3 className="text-[13px] font-bold uppercase tracking-wide">{title}</h3>
      <dl className="mt-1">
        {rows.map(([label, value]) => (
          <CopyRow key={label} label={label} value={value} />
        ))}
      </dl>
    </div>
  );
}

/** Lo que pide MiCorreo, en el mismo orden y con botón de copiar, para generar la etiqueta rápido. */
export function LabelData({ order }: { order: Order }) {
  const delivery = order.delivery ?? 'envio';
  if (isLocalDelivery(delivery)) return null;

  const c = order.customer;
  const books = order.lines.reduce((n, l) => n + l.qty, 0);
  const boxes = packagesFor(books);
  const box = BOX[boxes[0] ?? 'kg1'];
  const phone = splitPhone(c.telefono);
  const phoneRows: Row[] = phone
    ? [
        ['Cód. área (sin 0)', phone.area],
        ['Celular (sin 15)', phone.numero],
      ]
    : [['Teléfono (revisar formato)', c.telefono]];

  const paquete: Row[] = [
    ['Largo (cm)', String(box.l)],
    ['Ancho (cm)', String(box.a)],
    ['Alto (cm)', String(box.h)],
    ['Peso (kg)', String(Math.round((estimatedWeightKg(books) / boxes.length) * 10) / 10).replace('.', ',')],
    ['Valor del contenido ($)', String(Math.round((order.subtotal - order.discount) / boxes.length))],
  ];

  const destino: Row[] =
    delivery === 'sucursal'
      ? [
          ['Nombre y apellido', c.nombre],
          ['Provincia', c.provincia],
          ...(c.notas ? ([['Sucursal preferida', c.notas]] as Row[]) : []),
          ['Localidad y CP (para elegir la sucursal)', `${c.ciudad} ${c.cp}`],
          ['Correo electrónico', c.email],
          ...phoneRows,
        ]
      : [
          ['CP', c.cp],
          ['Nombre y apellido', c.nombre],
          ['Correo electrónico', c.email],
          ['Provincia', c.provincia],
          ...phoneRows,
          ['Localidad', c.ciudad],
          ['Dirección (calle, altura, piso y dpto.)', [c.calle, c.pisoDepto].filter(Boolean).join(', ')],
          ...(c.notas ? ([['Observaciones', c.notas]] as Row[]) : []),
        ];

  return (
    <div className="rounded-card bg-beige p-5 md:p-6">
      <h2 className="display t-category text-rust">Datos para la etiqueta.</h2>
      <p className="mt-2 text-[13px] font-medium">
        <strong>{delivery === 'sucursal' ? 'Entrega en Sucursal' : 'Entrega en Domicilio'}</strong> · {books}{' '}
        {books === 1 ? 'libro' : 'libros'}
        {boxes.length > 1 && ` · ${boxes.length} cajas (cargá una etiqueta por caja)`}
        {order.shippingCost ? ` · cobrado al cliente: ${formatPrice(order.shippingCost)}` : ''}
      </p>
      <Group title={boxes.length > 1 ? 'Paquete (por caja)' : 'Paquete'} rows={paquete} />
      <Group title="Destino" rows={[...destino, ['N° de orden', order.id]]} />
    </div>
  );
}
