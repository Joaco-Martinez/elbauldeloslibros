import { Reveal } from '@/components/ui/Reveal';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { SOCIAL_LINKS } from '@/lib/site';

/** Colores de cada tarjeta (texto chico en crema sobre verde/terracota oscuro: AA). */
const CARD = ['bg-forest text-cream', 'bg-brick text-cream'];
const BLURB: Record<string, string> = {
  Instagram: 'Recomendaciones, novedades y los libros que van llegando.',
  TikTok: 'Videos cortos para encontrar tu próxima lectura.',
};

/** Banda "Seguinos." antes del pie: las redes bien a la vista, en el mismo lenguaje del sitio. */
export function SocialBand() {
  if (SOCIAL_LINKS.length === 0) return null;
  return (
    <>
      <section aria-labelledby="seguinos" className="section-pad relative overflow-hidden bg-mustard text-forest">
        <Sticker variant="flower" size={30} rotate={8} className="left-[6%] top-8 hidden md:block" delay={1.2} />
        <div className="container-site">
          <Reveal>
            <div className="relative inline-block">
              <h2 id="seguinos" className="display t-split">
                Seguinos.
              </h2>
              <Sticker variant="sun" size={44} rotate={-12} className="-right-11 top-0 md:-right-14" delay={0.4} />
            </div>
            <p className="lede mt-4 !max-w-[42ch]">
              Te mostramos los libros por dentro, contamos de qué se tratan y avisamos cuando llegan títulos nuevos.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-8 md:mt-10">
            <ul className="grid gap-4 md:grid-cols-2 md:gap-5">
              {SOCIAL_LINKS.map((s, i) => (
                <li key={s.label}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`focus-ring group relative flex h-full flex-col justify-between gap-6 rounded-card p-6 transition-transform duration-200 hover:-translate-y-1 hover:-rotate-1 md:p-8 ${CARD[i % CARD.length]}`}
                    style={{ ['--ring' as string]: 'var(--color-forest)' }}
                  >
                    <span className="flex items-center justify-between gap-4">
                      <span className="text-[14px] font-bold uppercase tracking-wide">{s.label}</span>
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 place-items-center rounded-full bg-cream text-[18px] text-forest transition-transform duration-200 group-hover:rotate-45"
                      >
                        ↗
                      </span>
                    </span>
                    <span>
                      <span className="display block break-words text-[clamp(1.6rem,3.6vw,2.75rem)] leading-[1.02]">
                        @{s.handle}
                      </span>
                      <span className="mt-2 block text-[14px] font-medium">{BLURB[s.label]}</span>
                    </span>
                    <span className="sr-only"> (abre en otra pestaña)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
      <WaveDivider top="mustard" bottom="forest" variant={1} />
    </>
  );
}
