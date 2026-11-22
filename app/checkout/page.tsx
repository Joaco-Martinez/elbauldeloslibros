import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';

export const metadata: Metadata = {
  title: 'Finalizar compra',
  description: 'Completá tus datos y elegí cómo pagar: transferencia con 10% off o Mercado Pago.',
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <>
      <PageHero id="checkout-title" title="Finalizar compra.">
        Pagando con transferencia tenés <strong>10% off</strong>. También podés pagar con Mercado Pago.
      </PageHero>
      <section aria-label="Datos del pedido" className="section-pad bg-cream">
        <div className="container-site">
          <CheckoutForm />
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
