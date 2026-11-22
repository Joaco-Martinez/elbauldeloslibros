import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Sticker } from '@/components/ui/Sticker';

export function QuoteBand() {
  return (
    <section aria-label="Nuestro propósito" className="section-pad bg-forest text-cream">
      <div className="container-site">
        <Reveal className="relative mx-auto max-w-[920px]">
          <blockquote className="display t-quote text-center">
            <p>“Que la lectura no sea un privilegio.”</p>
          </blockquote>
          <p className="mx-auto mt-6 max-w-[48ch] text-center text-[14px] font-medium leading-[1.45] md:text-[15px]">
            Queremos llegar a cada rincón de la Argentina con precios accesibles.
          </p>
          {/* Cierre con acción: después de conocer la historia, a buscar el libro. */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/catalogo" variant="gold" className="h-12 px-6 text-[15px]">
              Encontrá tu próximo libro
            </Button>
            <Button href="/#recomendados" variant="outline" className="h-12 px-6 text-[15px] text-cream">
              Elegidos del mes
            </Button>
          </div>
          <Sticker variant="sun" size={52} rotate={10} className="-right-1 -top-10 md:-right-14 md:-top-12" />
        </Reveal>
      </div>
    </section>
  );
}
