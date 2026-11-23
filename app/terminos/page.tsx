import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { BRAND } from '@/lib/nav';
import { TRANSFER_DISCOUNT } from '@/lib/pricing';
import { CONSUMER_DEFENSE_URL, LEGAL, WHATSAPP_DISPLAY, WITHDRAWAL_DAYS, whatsappUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Condiciones de compra de El Baul de los Libros: precios, pagos, envíos, reservas y arrepentimiento.',
  alternates: { canonical: '/terminos' },
};

export default function TerminosPage() {
  return (
    <LegalLayout
      id="terminos-title"
      title="Términos y condiciones."
      intro="Lo que tenés que saber antes de comprar, explicado simple."
      updated="noviembre de 2026"
      current="/terminos"
    >
      <h2>Quiénes somos</h2>
      <p>
        {BRAND} es una librería online de libros nuevos con envío a toda la Argentina, desde {LEGAL.domicilio}
        {LEGAL.cuit && <> (CUIT {LEGAL.cuit})</>}. Contacto:{' '}
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer">
          WhatsApp {WHATSAPP_DISPLAY}
        </a>
        {LEGAL.email && (
          <>
            {' '}
            o <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          </>
        )}
        .
      </p>
      <p>Al hacer un pedido aceptás estas condiciones.</p>

      <h2>Libros y precios</h2>
      <ul>
        <li>Todos los libros son nuevos. Las fotos son de la tapa; la edición puede variar levemente.</li>
        <li>Los precios están en pesos argentinos y son precios finales.</li>
        <li>
          Pagando con transferencia tenés un {Math.round(TRANSFER_DISCOUNT * 100)}% de descuento sobre los libros (no sobre
          el envío).
        </li>
        <li>El precio que vale es el que ves al confirmar el pedido. Si después cambia, tu pedido no cambia.</li>
      </ul>

      <h2>Stock y reserva</h2>
      <ul>
        <li>Solo mostramos los libros que tenemos. Al confirmar el pedido, te reservamos los ejemplares.</li>
        <li>
          <strong>La reserva dura 24 h.</strong> Si en ese tiempo no recibimos el pago, el pedido se cancela solo y los
          libros vuelven a estar a la venta. Te avisamos por mail con un link para volver a armar tu pedido.
        </li>
      </ul>

      <h2>Pagos</h2>
      <ul>
        <li>
          <strong>Transferencia:</strong> al confirmar te mostramos los datos. Mandanos el comprobante por WhatsApp con tu
          número de pedido para que lo confirmemos.
        </li>
        <li>
          <strong>Mercado Pago:</strong> pagás en la página de Mercado Pago (tarjeta, dinero en cuenta o efectivo). Nosotros
          no vemos ni guardamos los datos de tu tarjeta.
        </li>
      </ul>

      <h2>Envíos y entregas</h2>
      <ul>
        <li>
          Enviamos por Correo Argentino, a sucursal o a domicilio. El costo depende de tu provincia y de la cantidad de
          libros, y lo ves antes de pagar.
        </li>
        <li>
          Despachamos dentro de 1 día hábil desde que se acredita el pago (de lunes a viernes, y sábados hasta las 13 h).
          Los plazos de entrega son estimados y dependen del correo.
        </li>
        <li>En Córdoba Capital podés retirarlo sin costo o pedir un Uber Moto (el viaje lo pagás vos). Lo coordinamos por WhatsApp.</li>
        <li>Te avisamos por mail cada vez que tu pedido avanza, con el número de seguimiento cuando sale.</li>
        <li>Revisá bien la dirección: si el correo no puede entregarlo por un dato mal cargado, el reenvío corre por tu cuenta.</li>
      </ul>

      <h2>Arrepentimiento, cambios y devoluciones</h2>
      <p>
        Hacemos cambios y devoluciones solo por defectos de fábrica o impresión, daños en el envío o si te mandamos otro
        título (mirá <Link href="/cambios-y-devoluciones">Cambios y devoluciones</Link>). Además, por ley tenés{' '}
        {WITHDRAWAL_DAYS} días corridos desde que recibís el libro para arrepentirte de la compra, con el libro sin uso y en
        el mismo estado, desde el <Link href="/arrepentimiento">Botón de arrepentimiento</Link>.
      </p>

      <h2>Cancelaciones de nuestra parte</h2>
      <p>
        Si por un error no podemos entregar un libro (por ejemplo, se dañó en el depósito), te avisamos enseguida y te
        devolvemos lo pagado por ese libro, o te ofrecemos otro si preferís.
      </p>

      <h2>Tus datos</h2>
      <p>
        Usamos tus datos solo para procesar y enviar tu pedido. Más detalle en la{' '}
        <Link href="/privacidad">Política de privacidad</Link>.
      </p>

      <h2>Reclamos</h2>
      <p>
        Si tenés un problema, escribinos primero: lo queremos resolver. También podés hacer un reclamo en{' '}
        <a href={CONSUMER_DEFENSE_URL} target="_blank" rel="noopener noreferrer">
          Defensa de las y los Consumidores
        </a>
        . Para cualquier conflicto rigen las leyes argentinas y son competentes los tribunales de {LEGAL.jurisdiccion}, sin
        perjuicio de los derechos que la Ley 24.240 te da para reclamar en tu domicilio.
      </p>
    </LegalLayout>
  );
}
