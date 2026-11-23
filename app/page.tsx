import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { Marquee } from '@/components/home/Marquee';
import { StorySplit } from '@/components/home/StorySplit';
import { FeaturedBooks } from '@/components/home/FeaturedBooks';
import { SocialBand } from '@/components/home/SocialBand';
import { JsonLd, organizationJsonLd, pageSeo, websiteJsonLd } from '@/lib/seo';

// Se rearma cada hora: así cambia solo al empezar el mes y suma las ventas nuevas.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: 'El Baul de los Libros · Libros nuevos con envío a todo el país' },
  description:
    'Libros nuevos, elegidos uno por uno y enviados a tu casa, en cualquier punto de la Argentina.',
  ...pageSeo('/'),
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero />
      <Marquee />
      {/* Los libros del mes van antes de la historia: en celular se ven sin tanto scroll. */}
      <FeaturedBooks />
      <StorySplit />
      <SocialBand />
    </>
  );
}
