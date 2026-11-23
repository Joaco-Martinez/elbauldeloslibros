import type { Metadata } from 'next';
import { AdminNav } from '@/components/admin/AdminNav';
import { LoginForm } from '@/components/admin/LoginForm';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { isAdmin } from '@/lib/adminAuth';
import { diagnoseService, getServiceStatus } from '@/lib/servicioWeb';

export const metadata: Metadata = { title: 'Servicio web', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Pago mensual del mantenimiento del sitio: la página de cobranza embebida. */
export default async function ServicioWebPage() {
  if (!(await isAdmin())) {
    return (
      <Shell>
        <LoginForm next="/admin/servicio-web" />
      </Shell>
    );
  }

  const status = await getServiceStatus();

  return (
    <Shell>
      <AdminNav current="servicio-web" />
      <p className="mb-6 max-w-[70ch] text-[14px] font-medium leading-[1.5]">
        Pago mensual del mantenimiento del sitio. Transferí al CBU o alias indicado y avisá desde acá. Si la tienda estaba en
        mantenimiento, vuelve a estar online unos minutos después de informar el pago.
      </p>
      {status ? (
        <div className="space-y-3">
          <iframe
            src={`${status.payUrl}?embed=1`}
            title="Pago del servicio web"
            className="h-[900px] w-full rounded-card border-2 border-beige bg-white"
          />
          <a
            href={status.payUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-block rounded-sm text-[13px] font-bold underline underline-offset-2"
          >
            Abrir en otra pestaña ↗
          </a>
        </div>
      ) : (
        <p className="rounded-card bg-beige px-5 py-4 text-[14px] font-medium">{await diagnoseService()}</p>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHero id="servicio-web-title" title="Servicio web." />
      <section aria-label="Pago del servicio web" className="section-pad bg-cream">
        <div className="container-site">{children}</div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
