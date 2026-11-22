import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { WHATSAPP_DISPLAY, WITHDRAWAL_DAYS, whatsappUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Cambios y devoluciones',
  description: 'Hacemos cambios y devoluciones cuando el libro llega con un defecto de fábrica o impresión, o si nos equivocamos de título.',
};

export default function CambiosPage() {
  const wa = whatsappUrl('Hola! Me llegó un libro con un problema. Mi número de pedido es: ');
  return (
    <LegalLayout
      id="cambios-title"
      title="Cambios y devoluciones."
      intro="Revisamos cada ejemplar antes de envolverlo. Si igual llega con un problema, lo resolvemos."
      updated="noviembre de 2026"
      current="/cambios-y-devoluciones"
    >
      <h2>Cuándo hacemos cambios</h2>
      <p>
        Hacemos cambios y devoluciones <strong>solo si el libro llegó con un defecto de fábrica o impresión</strong>{' '}
        (páginas en blanco, mal impresas o mal encuadernadas), <strong>dañado en el envío</strong> o si{' '}
        <strong>te mandamos un título distinto</strong> al que pediste.
      </p>
      <p>No hacemos cambios por otro título si el libro llegó bien.</p>

      <h2>Cómo pedirlo</h2>
      <ol>
        <li>
          Escribinos por{' '}
          <a href={wa} target="_blank" rel="noopener noreferrer">
            WhatsApp al {WHATSAPP_DISPLAY}
          </a>{' '}
          con tu número de pedido y una foto del problema, dentro de los 7 días de recibirlo.
        </li>
        <li>Revisamos la foto y te confirmamos si te mandamos otro ejemplar igual o te devolvemos el dinero.</li>
        <li>
          <strong>Los envíos corren por nuestra cuenta.</strong>
        </li>
      </ol>

      <h2>Arrepentimiento de compra</h2>
      <p>
        Por ley, en las compras online tenés {WITHDRAWAL_DAYS} días corridos desde que recibís el libro para arrepentirte
        (Ley 24.240, art. 34). El libro tiene que volver sin uso y en el mismo estado en que lo recibiste. Se pide desde el{' '}
        <Link href="/arrepentimiento">Botón de arrepentimiento</Link>.
      </p>

      <h2>Cómo te devolvemos el dinero</h2>
      <ul>
        <li>
          <strong>Mercado Pago:</strong> lo devolvemos desde Mercado Pago, al mismo medio con el que pagaste.
        </li>
        <li>
          <strong>Transferencia:</strong> te transferimos a la misma cuenta desde la que pagaste.
        </li>
      </ul>
    </LegalLayout>
  );
}
