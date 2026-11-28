import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { discardCart, emailAbandonedCart, markCartContacted } from '@/app/admin/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { fullTitle, getBook } from '@/data/books';
import { ABANDONED_AFTER_MS, cartStore, restoreCartUrl, type AbandonedCart } from '@/lib/abandonedCarts';
import { customerWhatsappUrl } from '@/lib/adminQueue';
import { isAdmin } from '@/lib/adminAuth';
import { mailEnabled } from '@/lib/notify';
import { loadCatalog } from '@/lib/catalog';
import { formatPrice } from '@/lib/formatPrice';
import { formatDateTime } from '@/lib/orderStatus';
import { getOrigin } from '@/lib/origin';

export const metadata: Metadata = { title: 'Carritos abandonados', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const HOUR = 3_600_000;

function ageText(ms: number) {
  if (ms < 24 * HOUR) return `hace ${Math.max(1, Math.round(ms / HOUR))} h`;
  const d = Math.floor(ms / (24 * HOUR));
  return d === 1 ? 'hace 1 día' : `hace ${d} días`;
}

function cartLines(cart: AbandonedCart) {
  return cart.items.flatMap((i) => {
    const book = getBook(i.id);
    return book ? [{ id: i.id, title: fullTitle(book), qty: i.qty, subtotal: book.price * i.qty }] : [];
  });
}

function messageFor(cart: AbandonedCart, link: string) {
  const name = cart.nombre.split(' ')[0];
  const titles = cartLines(cart).map((l) => l.title);
  const what = titles.length === 1 ? `"${titles[0]}"` : `los libros que elegiste (${titles.join(', ')})`;
  if (cart.fromOrderId) {
    return `¡Hola${name ? ` ${name}` : ''}! Te escribimos de El Baul de los Libros. Tu pedido ${cart.fromOrderId} venció porque no nos llegó el pago en 24 h. Si todavía querés ${what}, te dejamos el carrito armado para hacerlo de nuevo: ${link} — Pagando con transferencia tenés 10% off. ¿Te podemos ayudar con algo?`;
  }
  return `¡Hola${name ? ` ${name}` : ''}! Te escribimos de El Baul de los Libros. Vimos que dejaste ${what} en el carrito. ¿Te quedó alguna duda con el envío o el pago? Te lo guardamos acá, listo para terminar la compra: ${link} — Pagando con transferencia tenés 10% off.`;
}

type Props = { searchParams: Promise<{ mail?: string; a?: string }> };

function mailNotice(mail: string | undefined, to: string | undefined) {
  if (mail === 'ok') return { ok: true, text: `Mail enviado${to ? ` a ${to}` : ''}. Te llegó una copia a tu casilla.` };
  if (mail === 'sinconfig') return { ok: false, text: 'El mail no salió: falta configurar Gmail (GMAIL_USER y GMAIL_APP_PASSWORD).' };
  if (mail === 'error') return { ok: false, text: `El mail${to ? ` a ${to}` : ''} falló. Probá de nuevo en un rato.` };
  if (mail === 'vacio') return { ok: false, text: 'Ese carrito no tiene libros disponibles en el catálogo, no se mandó el mail.' };
  return null;
}

export default async function CarritosPage({ searchParams }: Props) {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  const sp = await searchParams;
  const notice = mailNotice(sp.mail, sp.a);
  const canMail = mailEnabled();
  await loadCatalog();

  const now = Date.now();
  const origin = await getOrigin();
  const all = await cartStore.list();
  const abandoned = all.filter((c) => now - Date.parse(c.updatedAt) >= ABANDONED_AFTER_MS);
  const inProgress = all.length - abandoned.length;
  const pending = abandoned.filter((c) => !c.contactedAt);
  const contacted = abandoned.filter((c) => c.contactedAt);

  return (
    <>
      <PageHero id="carritos-title" title="Carritos." />
      <section aria-label="Carritos abandonados" className="section-pad bg-cream">
        <div className="container-site">
          <AdminNav current="carritos" />
          <p className="max-w-[70ch] text-[14px] font-medium">
            Personas que completaron su email o celular en el checkout y no compraron (aparecen 2 h después, antes pueden
            seguir comprando), y pedidos que se cancelaron solos por no pagar en 24 h. Se borran solos a los 30 días o
            cuando esa persona confirma un pedido.
            {inProgress > 0 && (
              <strong>
                {' '}
                Ahora hay {inProgress} {inProgress === 1 ? 'persona' : 'personas'} en el checkout.
              </strong>
            )}
          </p>

          {notice && (
            <p
              role="status"
              className={`mt-6 rounded-card px-5 py-4 text-[14px] font-bold ${notice.ok ? 'bg-forest text-cream' : 'bg-mustard text-forest'}`}
            >
              {notice.text}
            </p>
          )}
          {!canMail && !notice && (
            <p className="mt-6 rounded-card bg-mustard px-5 py-4 text-[14px] font-bold text-forest">
              Los mails no están configurados (falta GMAIL_USER / GMAIL_APP_PASSWORD): el botón de mail no va a poder mandarlos.
            </p>
          )}

          <CartSection title="Para escribirles" carts={pending} origin={origin} now={now} empty="No hay carritos abandonados sin contactar." />
          {contacted.length > 0 && (
            <CartSection title="Ya les escribiste" carts={contacted} origin={origin} now={now} empty="" />
          )}
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}

function CartSection({
  title,
  carts,
  origin,
  now,
  empty,
}: {
  title: string;
  carts: AbandonedCart[];
  origin: string;
  now: number;
  empty: string;
}) {
  return (
    <div className="mt-10">
      <h2 className="display t-category text-rust">
        {title} <span className="text-ink">({carts.length})</span>
      </h2>
      {carts.length === 0 ? (
        <p className="mt-4 rounded-card bg-beige px-5 py-4 text-[14px] font-medium">{empty}</p>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {carts.map((c) => (
            <CartCard key={c.id} cart={c} origin={origin} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CartCard({ cart, origin, now }: { cart: AbandonedCart; origin: string; now: number }) {
  const lines = cartLines(cart);
  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const link = restoreCartUrl(origin, cart.items);
  const text = messageFor(cart, link);
  const whatsapp = cart.telefono ? customerWhatsappUrl(cart.telefono, text) : null;

  return (
    <li className="flex flex-col rounded-card border-2 border-beige p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <p className="text-[15px] font-bold">{cart.nombre || 'Sin nombre'}</p>
          <p className="text-[12px] font-medium">
            {[cart.provincia, cart.telefono, cart.email].filter(Boolean).join(' · ')}
          </p>
        </div>
        <p className="text-[12px] font-bold">{ageText(now - Date.parse(cart.updatedAt))}</p>
      </div>
      {cart.fromOrderId && (
        <p className="mt-3 self-start rounded-full bg-mustard px-3 py-1 text-[12px] font-bold text-forest">
          Pedido {cart.fromOrderId} vencido sin pago
        </p>
      )}
      <ul className="mt-4 space-y-1 text-[14px]">
        {lines.map((l) => (
          <li key={l.id} className="flex justify-between gap-4">
            <span className="font-medium">
              {l.qty} × {l.title}
            </span>
            <span className="shrink-0 font-bold">{formatPrice(l.subtotal)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t-2 border-beige pt-2 text-right text-[14px] font-bold">Libros: {formatPrice(total)}</p>
      {cart.contactedAt && (
        <p className="mt-2 text-[12px] font-bold text-forest">Le escribiste el {formatDateTime(cart.contactedAt)}</p>
      )}
      {cart.emailedAt && (
        <p className="mt-1 text-[12px] font-bold text-forest">Mail enviado el {formatDateTime(cart.emailedAt)}</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn h-10 bg-forest px-4 text-[13px] text-cream">
            Escribirle por WhatsApp
          </a>
        )}
        {cart.email && (
          <form action={emailAbandonedCart}>
            <input type="hidden" name="id" value={cart.id} />
            <button type="submit" className="btn h-10 border-[1.5px] border-ink px-4 text-[13px]">
              {cart.emailedAt ? 'Mandarle otro mail' : 'Mandarle un mail'}
            </button>
          </form>
        )}
        <form action={markCartContacted}>
          <input type="hidden" name="id" value={cart.id} />
          <button type="submit" className="btn h-10 border-[1.5px] border-ink px-4 text-[13px]">
            {cart.contactedAt ? 'Desmarcar' : 'Ya le escribí'}
          </button>
        </form>
        <form action={discardCart} className="ml-auto">
          <input type="hidden" name="id" value={cart.id} />
          <button type="submit" className="text-[12px] font-bold underline underline-offset-2">
            Descartar
          </button>
        </form>
      </div>
    </li>
  );
}
