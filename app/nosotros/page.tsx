import type { Metadata } from 'next';
import { AboutHero } from '@/components/nosotros/AboutHero';
import { OriginSplit } from '@/components/nosotros/OriginSplit';
import { ProcessSteps } from '@/components/nosotros/ProcessSteps';
import { QuoteBand } from '@/components/nosotros/QuoteBand';

export const metadata: Metadata = {
  title: 'Nosotros',
  description:
    'Un emprendimiento de un estudiante de Administración que junta libros y negocios: te ayudamos a elegir tu próxima lectura según el momento que estás viviendo, con envíos a toda la Argentina.',
};

export default function NosotrosPage() {
  return (
    <>
      <AboutHero />
      <OriginSplit />
      <ProcessSteps />
      <QuoteBand />
    </>
  );
}
