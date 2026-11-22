import { BRAND } from '@/lib/nav';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

export function AboutHero() {
  return (
    <>
      <section aria-labelledby="nosotros-title" className="bg-mustard text-forest">
        <div className="container-site flex flex-col items-center pb-14 pt-10 text-center md:min-h-[440px] md:justify-center md:pb-16">
          <div className="relative">
            <h1 id="nosotros-title" className="display t-h1-about">
              Tu libro,
              <br />
              en tu
              <br />
              momento.
            </h1>
            <Sticker variant="sun" size={52} rotate={-10} className="-left-3 top-[38%] md:-left-16" />
            <Sticker variant="pinwheel" size={46} rotate={12} className="-right-2 top-[40%] md:-right-14" delay={1.4} />
            <Sticker variant="checker" size={34} rotate={-6} className="-top-6 right-[6%]" delay={2.1} />
          </div>
          <p className="mt-6 max-w-[46ch] text-[14px] font-medium leading-[1.45]">
            En {BRAND} buscamos que tu próxima lectura no se elija por la tapa, sino por el momento de vida que estás
            transitando.
          </p>
        </div>
      </section>
      <WaveDivider top="mustard" bottom="cream" variant={2} />
    </>
  );
}
