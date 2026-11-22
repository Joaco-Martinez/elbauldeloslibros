import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout } from '@/components/legal/LegalLayout';
import { WithdrawalForm } from '@/components/legal/WithdrawalForm';
import { WITHDRAWAL_DAYS, whatsappUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento',
  description: `Si compraste online, tenés ${WITHDRAWAL_DAYS} días para arrepentirte sin dar explicaciones. Completá el formulario y te damos tu código al instante.`,
};

export default function ArrepentimientoPage() {
  return (
    <LegalLayout
      id="arrepentimiento-title"
      title="Botón de arrepentimiento."
      intro={`Por ley, en las compras online tenés ${WITHDRAWAL_DAYS} días corridos para arrepentirte. Acá podés pedirlo.`}
      updated="noviembre de 2026"
      current="/arrepentimiento"
    >
      <h2>Cómo funciona</h2>
      <ol>
        <li>Completá el formulario de abajo. No hace falta crear una cuenta.</li>
        <li>Te damos tu <strong>código de arrepentimiento</strong> en el momento (y te lo mandamos por mail).</li>
        <li>Dentro de las 24 h hábiles te escribimos para coordinar la devolución del libro.</li>
        <li>Cuando recibimos el libro y vemos que está en el mismo estado, te devolvemos lo pagado por el mismo medio de pago.</li>
      </ol>

      <h2>Lo que tenés que saber</h2>
      <ul>
        <li>
          Tenés <strong>{WITHDRAWAL_DAYS} días corridos</strong> desde que recibiste el libro (o desde la compra, si lo
          retiraste antes) para arrepentirte.
        </li>
        <li>
          <strong>El libro tiene que volver sin uso</strong>, en el mismo estado y con el envoltorio con el que lo
          recibiste. Si vuelve usado, marcado o dañado, podemos descontar esa pérdida de valor (Código Civil y Comercial,
          art. 1116).
        </li>
        <li>Te pasamos la etiqueta de Correo Argentino para mandarlo; en Córdoba Capital coordinamos el retiro.</li>
        <li>Si el pedido todavía no salió, lo cancelamos sin que tengas que mandar nada.</li>
      </ul>
      <p>
        Es un derecho de la Ley de Defensa del Consumidor (Ley 24.240, art. 34) y del Código Civil y Comercial (art.
        1110). Si el libro llegó con algún problema, mirá <Link href="/cambios-y-devoluciones">Cambios y devoluciones</Link>.
      </p>

      <h2>Formulario</h2>
      <div className="mt-5 rounded-card border-2 border-beige p-5 md:p-6">
        <WithdrawalForm whatsapp={whatsappUrl('Hola! Quiero arrepentirme de mi compra. Mi número de pedido es: ')} />
      </div>
    </LegalLayout>
  );
}
