import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { setBookReviewStatus, setStoreReviewStatus } from '@/app/admin/actions';
import { AdminNav } from '@/components/admin/AdminNav';
import { PageHero } from '@/components/checkout/PageHero';
import { StarRating } from '@/components/ui/StarRating';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { isAdmin } from '@/lib/adminAuth';
import { formatDateTime } from '@/lib/orderStatus';
import { feedbackStore, type ReviewStatus } from '@/lib/reviews';

export const metadata: Metadata = { title: 'Opiniones', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pendiente: 'bg-mustard text-forest',
  aprobada: 'bg-forest text-cream',
  rechazada: 'bg-ink text-cream',
};

/** Botones aprobar / rechazar (o volver a pendiente). */
function Moderation({
  action,
  hidden,
  status,
}: {
  action: (form: FormData) => Promise<void>;
  hidden: Record<string, string>;
  status: ReviewStatus;
}) {
  const btn = (to: ReviewStatus, label: string, cls: string) => (
    <form action={action}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <input type="hidden" name="status" value={to} />
      <button type="submit" className={`btn h-9 px-3.5 text-[12px] ${cls}`}>
        {label}
      </button>
    </form>
  );
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[status]}`}>{status}</span>
      {status !== 'aprobada' && btn('aprobada', 'Aprobar y publicar', 'bg-forest text-cream')}
      {status !== 'rechazada' && btn('rechazada', 'No publicar', 'border-[1.5px] border-ink')}
      {status !== 'pendiente' && btn('pendiente', 'Volver a pendiente', 'text-ink underline')}
    </div>
  );
}

export default async function OpinionesPage() {
  if (!(await isAdmin())) redirect('/admin/pedidos');
  const all = await feedbackStore.list();

  const bookReviews = all.flatMap((f) => f.books.map((b) => ({ f, b })));
  const pendingBooks = bookReviews.filter(({ b }) => b.status === 'pendiente');
  const otherBooks = bookReviews.filter(({ b }) => b.status !== 'pendiente');
  const suggestions = all.filter((f) => f.suggestion);
  const storeAvg = all.length ? Math.round((all.reduce((s, f) => s + f.store.rating, 0) / all.length) * 10) / 10 : null;

  return (
    <>
      <PageHero id="opiniones-title" title="Opiniones." />
      <section aria-label="Opiniones de compradores" className="section-pad bg-cream">
        <div className="container-site">
          <AdminNav current="opiniones" />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-card bg-beige px-5 py-4">
              <p className="text-[12px] font-bold">Opiniones recibidas</p>
              <p className="display mt-1 text-[2rem]">{all.length}</p>
            </div>
            <div className="rounded-card bg-beige px-5 py-4">
              <p className="text-[12px] font-bold">Promedio de la tienda</p>
              <p className="display mt-1 flex items-center gap-2 text-[2rem]">
                {storeAvg !== null ? (
                  <>
                    {String(storeAvg).replace('.', ',')} <StarRating value={storeAvg} size={18} />
                  </>
                ) : (
                  '–'
                )}
              </p>
            </div>
            <div className="rounded-card bg-beige px-5 py-4">
              <p className="text-[12px] font-bold">Reseñas para revisar</p>
              <p className="display mt-1 text-[2rem]">{pendingBooks.length}</p>
            </div>
          </div>

          <p className="mt-6 max-w-[72ch] text-[13px] font-medium">
            Solo opinan compradores reales (con el link de su pedido entregado). Aprobá según si son reales y respetuosas,
            no según si hablan bien: publicar solo las buenas se considera publicidad engañosa.
          </p>

          <h2 className="display t-category mt-10 text-rust">Reseñas de libros para revisar ({pendingBooks.length})</h2>
          {pendingBooks.length === 0 ? (
            <p className="mt-4 rounded-card bg-beige px-5 py-4 text-[14px] font-medium">No hay reseñas pendientes.</p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {pendingBooks.map(({ f, b }) => (
                <li key={`${f.orderId}-${b.bookId}`} className="rounded-card border-2 border-brick p-5">
                  <p className="text-[15px] font-bold">{b.title}</p>
                  <StarRating value={b.rating} className="mt-1" />
                  {b.text ? <p className="mt-2 text-[14px] font-medium">“{b.text}”</p> : <p className="mt-2 text-[13px] italic">Sin comentario.</p>}
                  <p className="mt-2 text-[12px] font-medium">
                    {f.nombre}, {f.ciudad} · {formatDateTime(f.createdAt)} ·{' '}
                    <Link href={`/admin/pedidos/${encodeURIComponent(f.orderId)}`} className="font-bold underline">
                      {f.orderId}
                    </Link>
                  </p>
                  <Moderation action={setBookReviewStatus} hidden={{ orderId: f.orderId, bookId: b.bookId }} status={b.status} />
                </li>
              ))}
            </ul>
          )}

          <h2 className="display t-category mt-12 text-rust">Experiencia con la tienda</h2>
          {all.length === 0 ? (
            <p className="mt-4 rounded-card bg-beige px-5 py-4 text-[14px] font-medium">Todavía no hay opiniones.</p>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {all.map((f) => (
                <li key={f.orderId} className="rounded-card border-2 border-beige p-5">
                  <StarRating value={f.store.rating} />
                  {f.store.text ? <p className="mt-2 text-[14px] font-medium">“{f.store.text}”</p> : <p className="mt-2 text-[13px] italic">Sin comentario.</p>}
                  <p className="mt-2 text-[12px] font-medium">
                    {f.nombre}, {f.ciudad} · {formatDateTime(f.createdAt)} ·{' '}
                    <Link href={`/admin/pedidos/${encodeURIComponent(f.orderId)}`} className="font-bold underline">
                      {f.orderId}
                    </Link>
                  </p>
                  {f.store.allowPublish && f.store.text ? (
                    <Moderation action={setStoreReviewStatus} hidden={{ orderId: f.orderId }} status={f.store.status} />
                  ) : (
                    <p className="mt-3 text-[12px] font-bold">No dio permiso para mostrarla en la web.</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h2 className="display t-category mt-12 text-rust">Sugerencias ({suggestions.length})</h2>
          <p className="mt-2 text-[13px] font-medium">Privadas: solo las ves vos.</p>
          {suggestions.length === 0 ? (
            <p className="mt-4 rounded-card bg-beige px-5 py-4 text-[14px] font-medium">Todavía no hay sugerencias.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {suggestions.map((f) => (
                <li key={f.orderId} className="rounded-card bg-beige px-5 py-4">
                  <p className="text-[14px] font-medium">“{f.suggestion}”</p>
                  <p className="mt-1 text-[12px] font-medium">
                    {f.nombre}, {f.ciudad} · {formatDateTime(f.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {otherBooks.length > 0 && (
            <details className="mt-12">
              <summary className="display t-category cursor-pointer text-rust">Reseñas ya revisadas ({otherBooks.length})</summary>
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {otherBooks.map(({ f, b }) => (
                  <li key={`${f.orderId}-${b.bookId}`} className="rounded-card border-2 border-beige p-5">
                    <p className="text-[15px] font-bold">{b.title}</p>
                    <StarRating value={b.rating} className="mt-1" />
                    {b.text && <p className="mt-2 text-[14px] font-medium">“{b.text}”</p>}
                    <p className="mt-2 text-[12px] font-medium">
                      {f.nombre}, {f.ciudad}
                    </p>
                    <Moderation action={setBookReviewStatus} hidden={{ orderId: f.orderId, bookId: b.bookId }} status={b.status} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
