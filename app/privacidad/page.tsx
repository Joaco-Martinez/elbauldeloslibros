import type { Metadata } from 'next';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { BRAND } from '@/lib/nav';
import { LEGAL, WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Qué datos guardamos cuando comprás en El Baul de los Libros, para qué y cómo pedir que los borremos.',
  alternates: { canonical: '/privacidad' },
};

export default function PrivacidadPage() {
  return (
    <LegalLayout
      id="privacidad-title"
      title="Privacidad."
      intro="Qué datos guardamos, para qué y cómo pedir que los borremos."
      updated="noviembre de 2026"
      current="/privacidad"
    >
      <h2>Quién es responsable</h2>
      <p>
        {BRAND}
        {LEGAL.cuit && <> (CUIT {LEGAL.cuit})</>}, {LEGAL.domicilio}.
      </p>

      <h2>Qué datos guardamos</h2>
      <ul>
        <li>
          <strong>Cuando comprás:</strong> nombre, email, celular, dirección o localidad y código postal, los libros que
          elegiste y cómo pagaste.
        </li>
        <li>
          <strong>Si empezás a comprar y no terminás:</strong> tu email o celular y los libros del carrito, para poder
          ayudarte si se cortó a mitad de camino. Se borran solos a los 30 días.
        </li>
        <li>
          <strong>Si usás el botón de arrepentimiento:</strong> lo que completes en el formulario.
        </li>
        <li>
          <strong>Si dejás tu opinión:</strong> las estrellas y los comentarios. Las reseñas de libros se publican solo con tu
          nombre de pila y tu ciudad; la opinión sobre la tienda, solo si nos diste permiso. Las sugerencias son privadas.
        </li>
        <li>
          <strong>No guardamos datos de tarjetas.</strong> Los pagos con Mercado Pago se hacen en su página.
        </li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Para preparar y enviar tu pedido, y avisarte cómo viene.</li>
        <li>Para responder tus consultas, cambios o arrepentimientos.</li>
        <li>Para escribirte si dejaste un carrito sin terminar o un pago pendiente.</li>
        <li>No vendemos ni compartimos tus datos para publicidad.</li>
      </ul>

      <h2>Con quién los compartimos</h2>
      <p>Solo con quienes necesitamos para que el pedido llegue:</p>
      <ul>
        <li>Correo Argentino, para generar el envío (nombre, dirección, teléfono y email).</li>
        <li>Mercado Pago, si elegís pagar por ahí.</li>
        <li>Los servicios que usamos para alojar la página, guardar los pedidos y mandar los mails.</li>
      </ul>

      <h2>Cuánto tiempo</h2>
      <p>
        Los carritos sin terminar, 30 días. Los pedidos, el tiempo que exigen las normas contables e impositivas. Después
        se borran.
      </p>

      <h2>Cookies</h2>
      {/* El texto depende de si la medición está activada (variables NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID). */}
      {process.env.NEXT_PUBLIC_GA_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID ? (
        <p>
          Tu navegador guarda tu carrito para que no lo pierdas si cerrás la página. Además usamos
          {process.env.NEXT_PUBLIC_GA_ID && ' Google Analytics'}
          {process.env.NEXT_PUBLIC_GA_ID && process.env.NEXT_PUBLIC_META_PIXEL_ID && ' y'}
          {process.env.NEXT_PUBLIC_META_PIXEL_ID && ' el píxel de Meta (Facebook e Instagram)'} para medir cuántas personas
          visitan la tienda y qué libros miran o compran, sin guardar tu nombre ni tus datos de contacto. Podés bloquearlas
          desde la configuración de tu navegador.
        </p>
      ) : (
        <p>
          No usamos cookies de publicidad ni de seguimiento. Tu navegador guarda tu carrito para que no lo pierdas si cerrás
          la página.
        </p>
      )}

      <h2>Tus derechos</h2>
      <p>
        Podés pedirnos ver, corregir o borrar tus datos cuando quieras, escribiéndonos por{' '}
        <a href={whatsappUrl('Hola! Quiero consultar por mis datos personales.')} target="_blank" rel="noopener noreferrer">
          WhatsApp al {WHATSAPP_DISPLAY}
        </a>
        {LEGAL.email && (
          <>
            {' '}
            o a <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
          </>
        )}
        . Te respondemos dentro de los plazos de la Ley 25.326 de Protección de Datos Personales.
      </p>
      <p>
        La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la
        atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por
        incumplimiento de las normas vigentes en materia de protección de datos personales.
      </p>
    </LegalLayout>
  );
}
