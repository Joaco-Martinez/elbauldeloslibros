import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sitio en mantenimiento',
  robots: { index: false, follow: false },
};

/** Lo que ven los visitantes mientras el sitio está suspendido por falta de pago del mantenimiento (ver middleware.ts). */
export default function MantenimientoPage() {
  return (
    <>
      <PageHero id="mantenimiento-title" title="Estamos en mantenimiento." />
      <section aria-label="Cómo contactarnos" className="section-pad bg-cream">
        <div className="container-site max-w-[60ch] text-center">
          <p className="lede mx-auto">
            La tienda online vuelve pronto. Mientras tanto, te atendemos como siempre por WhatsApp: consultas, pedidos y
            seguimiento de tu compra.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href={whatsappUrl()} variant="forest" target="_blank" rel="noreferrer">
              Escribinos al {WHATSAPP_DISPLAY}
            </Button>
          </div>
          <p className="mt-10 text-[13px] font-medium">
            ¿Ya compraste? El link de seguimiento que te llegó por mail sigue funcionando.
          </p>
          <p className="mt-2 text-[13px] font-medium">
            ¿Sos el responsable del sitio?{' '}
            <Link href="/admin/servicio-web" className="font-bold underline underline-offset-2">
              Ingresá al panel para regularizar el pago
            </Link>
          </p>
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
