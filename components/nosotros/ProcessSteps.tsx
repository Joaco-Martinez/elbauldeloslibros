import { Photo } from '@/components/ui/Photo';
import { Reveal } from '@/components/ui/Reveal';
import { WaveDivider } from '@/components/ui/WaveDivider';
import type { Tone } from '@/lib/tokens';

const STEPS: { n: number; title: string; text: string; src: string; alt: string; tone: Tone }[] = [
  {
    n: 1,
    title: 'Elegimos',
    text: 'Revisamos cada ejemplar antes de que salga del baúl.',
    src: '/images/paso-1.jpg',
    alt: 'Pila de libros nuevos sobre una mesa.',
    tone: 'leather',
  },
  {
    n: 2,
    title: 'Envolvemos',
    text: 'Papel, cartón y cuidado para que llegue impecable.',
    src: '/images/paso-2.jpg',
    alt: 'Manos envolviendo un libro en papel kraft.',
    tone: 'leaf',
  },
  {
    n: 3,
    title: 'Enviamos',
    text: 'Despachamos a todo el país con número de seguimiento.',
    src: '/images/paso-3.jpg',
    alt: 'Caja cerrada con etiqueta de envío apoyada en una puerta.',
    tone: 'forest',
  },
];

export function ProcessSteps() {
  return (
    <>
      <section aria-labelledby="como-viaja" className="section-pad bg-rust">
        <div className="container-site">
          <h2 id="como-viaja" className="display t-section text-center text-cream">
            Cómo viaja un libro.
          </h2>
          {/* Celular: foto chica al costado del texto. Desde tablet: tres tarjetas con foto arriba. */}
          <ol className="mx-auto mt-8 grid max-w-[480px] gap-3 md:mt-12 md:max-w-[900px] md:grid-cols-3 md:gap-5">
            {STEPS.map((step, i) => (
              <li key={step.n}>
                <Reveal delay={i * 100} className="flex h-full items-center gap-3 rounded-[16px] bg-cream p-2.5 md:block">
                  <Photo
                    src={step.src}
                    alt={step.alt}
                    sizes="(min-width: 768px) 280px, 120px"
                    placeholderTone={step.tone}
                    className="aspect-[4/3] w-[120px] shrink-0 rounded-[10px] md:w-auto"
                  />
                  <div className="pr-1 md:px-1.5 md:pb-2 md:pt-3">
                    <p className="text-[14px] font-bold text-brick md:text-[13px]">
                      {step.n}. {step.title}
                    </p>
                    <p className="mt-1 text-[13px] font-medium leading-snug text-ink md:text-[11px] lg:text-[12px]">
                      {step.text}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <WaveDivider top="rust" bottom="forest" variant={1} />
    </>
  );
}
