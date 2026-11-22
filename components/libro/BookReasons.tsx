import type { ReactNode } from 'react';
import type { Razon } from '@/data/razones';
import { Reveal } from '@/components/ui/Reveal';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

/** Tarjetas alternadas claro / color / oscuro, como las de producto. Todas con contraste AA. */
const CARDS = [
  { bg: 'bg-mustard', num: 'text-forest', text: 'text-forest', rotate: '-rotate-1' },
  { bg: 'bg-forest', num: 'text-mustard', text: 'text-cream', rotate: 'rotate-1' },
  { bg: 'bg-brick', num: 'text-cream', text: 'text-cream', rotate: '-rotate-[0.5deg]' },
  { bg: 'bg-beige', num: 'text-brick', text: 'text-ink', rotate: 'rotate-[0.75deg]' },
];


export function BookReasons({ title, reasons, children }: { title: string; reasons: Razon[]; children?: ReactNode }) {
  return (
    <>
      <section aria-labelledby="razones-title" className="section-pad relative bg-cream">
        <div className="container-site">
          <div className="relative mx-auto max-w-[900px] text-center">
            <p className="text-[13px] font-bold text-ink">¿Todavía lo estás pensando?</p>
            <h2 id="razones-title" className="display t-section mt-3 text-rust">
              4 razones para leer {title}.
            </h2>
            <Sticker variant="sun" size={48} rotate={-12} className="-left-2 -top-6 md:-left-10" />
            <Sticker variant="checker" size={40} rotate={10} className="-right-8 bottom-0 hidden md:block" delay={1.4} />
          </div>

          <ol className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-14 lg:grid-cols-4 lg:gap-5">
            {reasons.map((r, i) => {
              const c = CARDS[i % CARDS.length];
              return (
                <li key={r.titulo} className={c.rotate}>
                  <Reveal delay={i * 90} className={`flex h-full items-start gap-4 rounded-card p-5 sm:block sm:p-6 md:p-7 ${c.bg}`}>
                    <span
                      aria-hidden="true"
                      className={`display block w-9 shrink-0 text-[2.75rem] leading-none sm:w-auto sm:text-[3.5rem] md:text-[4.5rem] ${c.num}`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className={`text-[16px] font-bold leading-snug sm:mt-4 sm:text-[17px] ${c.text}`}>{r.titulo}</h3>
                      <p className={`mt-1.5 text-[14px] font-medium leading-[1.45] sm:mt-2 ${c.text}`}>{r.texto}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
          {/* Reseñas de compradores (si hay), en la misma banda crema. */}
          {children}
        </div>
      </section>
      <WaveDivider top="cream" bottom="orange" variant={0} />
    </>
  );
}
