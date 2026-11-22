import { StarRating } from '@/components/ui/StarRating';
import type { PublicReview } from '@/lib/reviews';

const MAX_SHOWN = 6;

/** Reseñas aprobadas de compradores reales ("Compra verificada"). Si no hay, no muestra nada. */
export function BookReviews({ reviews, average }: { reviews: PublicReview[]; average: number | null }) {
  if (reviews.length === 0 || average === null) return null;
  return (
    <div id="resenas" className="mx-auto mt-16 max-w-[900px] scroll-mt-6 md:mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="display t-category text-rust">Lo que dicen quienes lo leyeron.</h2>
        <p className="flex items-center gap-2 text-[14px] font-bold">
          <StarRating value={average} size={18} />
          {String(average).replace('.', ',')} · {reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}
        </p>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {reviews.slice(0, MAX_SHOWN).map((r, i) => (
          <li key={`${r.createdAt}-${i}`} className="rounded-card bg-beige p-5">
            <StarRating value={r.rating} />
            {r.text && <p className="mt-2 text-[15px] font-medium leading-[1.5]">“{r.text}”</p>}
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-bold">
              {r.nombre}, {r.ciudad}
              <span className="rounded-full bg-forest px-2 py-0.5 text-[11px] text-cream">✓ Compra verificada</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
