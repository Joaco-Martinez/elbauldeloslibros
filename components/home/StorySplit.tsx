import { BlobImage } from '@/components/ui/BlobImage';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SplitLayout } from '@/components/ui/SplitLayout';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

export function StorySplit() {
  return (
    <>
      <section aria-labelledby="buenos-libros" className="section-pad relative bg-cream">
        <Sticker variant="checker" size={48} rotate={14} className="right-[4%] top-6 md:top-10" delay={0.8} />
        <SplitLayout
          media={
            <Reveal>
              <BlobImage
                src="/images/inicio-libro-mate.jpg"
                alt="Libro abierto y un mate sobre una mesa de madera oscura, con luz cálida."
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 40vw, 92vw"
                placeholderTone="leather"
              >
                <Sticker variant="pinwheel" size={40} rotate={-10} className="-left-2 -top-3" />
                <Sticker variant="flower" size={26} rotate={8} className="bottom-[8%] -left-3" delay={1.6} />
                <Sticker variant="sun" size={56} rotate={12} className="-right-1 bottom-[2%] md:-right-3" delay={2.2} />
              </BlobImage>
            </Reveal>
          }
        >
          <Reveal delay={100}>
            <div className="relative inline-block">
              <h2 id="buenos-libros" className="display t-split text-rust">
                Buenos
                <br />
                libros.
              </h2>
              <Sticker variant="sun" size={36} rotate={-14} className="-right-10 top-1 md:-right-12" delay={0.4} />
            </div>
            <p className="lede mt-5 text-ink">
              Te ayudamos a encontrar el libro justo para el momento que estás viviendo. Lo envolvemos con cuidado y sale el mismo día que lo pedís.
            </p>
            <Button href="/nosotros" variant="rust" className="mt-7">
              Nuestra historia
            </Button>
          </Reveal>
        </SplitLayout>
      </section>
      <WaveDivider top="cream" bottom="mustard" variant={2} />
    </>
  );
}
