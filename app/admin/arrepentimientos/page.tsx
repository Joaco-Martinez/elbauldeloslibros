import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { toggleWithdrawalResolved } from '@/app/admin/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { customerWhatsappUrl } from '@/lib/adminQueue';
import { isAdmin } from '@/lib/adminAuth';
import { formatDateTime } from '@/lib/orderStatus';
import { WITHDRAWAL_DAYS } from '@/lib/site';
import { withdrawalStore, type Withdrawal } from '@/lib/withdrawals';

export const metadata: Metadata = { title: 'Arrepentimientos', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ArrepentimientosPage() {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  const all = await withdrawalStore.list();
  const open = all.filter((w) => !w.resolvedAt);
  const done = all.filter((w) => w.resolvedAt);

  return (
    <>
      <PageHero id="arr-admin-title" title="Arrepentimientos." />
      <section aria-label="Pedidos de arrepentimiento" className="section-pad bg-cream">
        <div className="container-site">
          <AdminNav current="arrepentimientos" />
          <div className="max-w-[72ch] space-y-2 text-[14px] font-medium">
            <p>
              Clientes que usaron el botón de arrepentimiento (tienen {WITHDRAWAL_DAYS} días desde que reciben el libro). A
              cada uno ya le dimos su código en el momento.
            </p>
            <p>
              <strong>Qué hacer:</strong> escribile dentro de las 24 h hábiles, mandale la etiqueta de Correo Argentino para
              la vuelta (el envío lo pagás vos) y, cuando recibas el libro, devolvé todo lo pagado por el mismo medio. Si el
              pedido todavía no salió, cancelalo desde el panel y reintegrá el dinero.
            </p>
          </div>
          <List title="Para resolver" items={open} empty="No hay arrepentimientos pendientes." />
          {done.length > 0 && <List title="Resueltos" items={done} empty="" />}
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}

function List({ title, items, empty }: { title: string; items: Withdrawal[]; empty: string }) {
  return (
    <div className="mt-10">
      <h2 className="display t-category text-rust">
        {title} <span className="text-ink">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 rounded-card bg-beige px-5 py-4 text-[14px] font-medium">{empty}</p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((w) => (
            <Card key={w.code} w={w} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Card({ w }: { w: Withdrawal }) {
  const message = `¡Hola ${w.nombre.split(' ')[0]}! Te escribimos de El Baul de los Libros por tu arrepentimiento (código ${w.code}). Te pasamos cómo devolver el libro: el envío corre por nuestra cuenta.`;
  const whatsapp = w.telefono ? customerWhatsappUrl(w.telefono, message) : null;
  return (
    <li className={`flex flex-col rounded-card border-2 p-5 ${w.resolvedAt ? 'border-beige' : 'border-brick'}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <p className="text-[15px] font-bold">{w.code}</p>
        <p className="text-[12px] font-bold">{formatDateTime(w.createdAt)}</p>
      </div>
      <p className="mt-2 text-[14px] font-medium">
        {w.nombre}
        <span className="block text-[12px]">{[w.email, w.telefono].filter(Boolean).join(' · ')}</span>
      </p>
      <p className="mt-3 text-[13px] font-medium">
        Pedido:{' '}
        {w.orderId ? (
          <Link href={`/admin/pedidos/${encodeURIComponent(w.orderId)}`} className="font-bold underline underline-offset-2">
            {w.orderId}
          </Link>
        ) : w.pedido ? (
          <span className="font-bold">{w.pedido} (no coincide con un pedido de ese email: revisalo)</span>
        ) : (
          <span className="font-bold">no lo indicó</span>
        )}
      </p>
      {w.motivo && <p className="mt-2 rounded-[12px] bg-beige px-3 py-2 text-[13px] font-medium">{w.motivo}</p>}
      {w.resolvedAt && <p className="mt-2 text-[12px] font-bold text-forest">Resuelto el {formatDateTime(w.resolvedAt)}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn h-10 bg-forest px-4 text-[13px] text-cream">
            Escribirle por WhatsApp
          </a>
        )}
        <a
          href={`mailto:${w.email}?subject=${encodeURIComponent(`Tu arrepentimiento ${w.code} · El Baul de los Libros`)}&body=${encodeURIComponent(message)}`}
          className="btn h-10 border-[1.5px] border-ink px-4 text-[13px]"
        >
          Mandarle un mail
        </a>
        <form action={toggleWithdrawalResolved}>
          <input type="hidden" name="code" value={w.code} />
          <button type="submit" className="btn h-10 border-[1.5px] border-ink px-4 text-[13px]">
            {w.resolvedAt ? 'Volver a abrir' : 'Marcar resuelto'}
          </button>
        </form>
      </div>
    </li>
  );
}
