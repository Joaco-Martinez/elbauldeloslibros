import { BlobImage } from '@/components/ui/BlobImage';
import { Reveal } from '@/components/ui/Reveal';
import { SplitLayout } from '@/components/ui/SplitLayout';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

export function OriginSplit() {
  return (
    <>
      <section aria-labelledby="del-estante" className="section-pad bg-cream">
        <SplitLayout
          media={
            <Reveal>
              <BlobImage
                shape="b"
                src="/images/nosotros-envolviendo.jpg"
                alt="Manos envolviendo un libro en papel kraft con hilo, sobre una mesa iluminada por una ventana."
                sizes="(min-width: 1024px) 480px, (min-width: 768px) 40vw, 92vw"
                placeholderTone="leather"
              >
                <Sticker variant="checker" size={52} rotate={-12} className="-left-2 -top-3" />
              </BlobImage>
            </Reveal>
          }
        >
          <Reveal delay={100}>
            <h2 id="del-estante" className="display t-split text-rust">
              Estudio
              <br className="hidden md:inline" /> y
              <br />
              emprendo.
            </h2>
            <div className="mt-5 space-y-3 text-[14px] font-medium leading-[1.45] text-ink md:text-[15px]">
              <p className="max-w-[42ch]">
                Soy estudiante de Administración de Empresas. El Baul de los Libros nació de juntar dos cosas que me apasionan:
                los libros, sobre todo los de desarrollo personal, y las ideas de negocio que me dio la carrera.
              </p>
              <p className="max-w-[42ch]">
                Muchas veces dejamos un libro a la mitad porque llegó en el momento equivocado, y frustra no poder terminarlo.
                Por eso te ayudamos a encontrar el libro justo para lo que estás viviendo.
              </p>
            </div>
          </Reveal>
        </SplitLayout>
      </section>
      <WaveDivider top="cream" bottom="rust" variant={0} />
    </>
  );
}
