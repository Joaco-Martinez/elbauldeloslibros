import type { Book } from '@/data/books';
import { getCategory } from '@/data/books';
import { getBookCover } from '@/lib/bookImage';
import type { PublicReview } from '@/lib/reviews';
import { LEGAL, SOCIAL_LINKS, WHATSAPP_NUMBER, WITHDRAWAL_DAYS } from '@/lib/site';

/**
 * URL pública para Google (canónicas, sitemap, datos estructurados).
 * Sale de SITE_URL; si falta, el dominio de la tienda.
 */
export const SITE_URL = (process.env.SITE_URL || 'https://www.elbauldeloslibros.com.ar').replace(/\/$/, '');
export const SITE_NAME = 'El Baul de los Libros';
export const SITE_DESCRIPTION =
  'Librería online de libros nuevos con envío a domicilio a toda la Argentina. Desarrollo personal, finanzas, filosofía, espiritualidad, romance y thriller, elegidos uno por uno.';
/** Imagen por defecto al compartir el sitio (WhatsApp, Instagram, Facebook, etc.). */
export const DEFAULT_SHARE_IMAGE = '/images/inicio-libro-mate.jpg';

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

/**
 * Canónica + Open Graph de una página. Next no mezcla el openGraph del layout con el de la página
 * (lo reemplaza entero), así que acá se repiten nombre del sitio, idioma e imagen por defecto.
 */
export function pageSeo(path: string, opts: { title?: string; description?: string; image?: { url: string; alt: string } } = {}) {
  const image = opts.image ?? { url: DEFAULT_SHARE_IMAGE, alt: 'Un libro abierto junto a un mate' };
  return {
    alternates: { canonical: path },
    openGraph: {
      type: 'website' as const,
      locale: 'es_AR',
      siteName: SITE_NAME,
      url: path,
      ...(opts.title ? { title: opts.title } : {}),
      ...(opts.description ? { description: opts.description } : {}),
      images: [image],
    },
    twitter: { card: 'summary_large_image' as const, images: [image.url] },
  };
}

/** Datos del negocio para Google: nombre, logo, redes y contacto. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': `${SITE_URL}/#tienda`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/icon.svg'),
    image: absoluteUrl(DEFAULT_SHARE_IMAGE),
    description: SITE_DESCRIPTION,
    ...(LEGAL.email ? { email: LEGAL.email } : {}),
    telephone: `+${WHATSAPP_NUMBER}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Córdoba', addressRegion: 'Córdoba', addressCountry: 'AR' },
    areaServed: { '@type': 'Country', name: 'Argentina' },
    sameAs: SOCIAL_LINKS.map((s) => s.url),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: `+${WHATSAPP_NUMBER}`,
      availableLanguage: 'es',
      areaServed: 'AR',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#web`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'es-AR',
    publisher: { '@id': `${SITE_URL}/#tienda` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Ficha de producto para los resultados de Google (precio, stock, reseñas). */
export function bookJsonLd(book: Book, reviews: PublicReview[], average: number | null) {
  const url = absoluteUrl(`/catalogo/${book.id}`);
  const cover = getBookCover(book);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#producto`,
    name: book.title,
    description: book.sinopsis,
    url,
    ...(cover ? { image: [absoluteUrl(cover.src)] } : {}),
    category: `Libros > ${getCategory(book.category).label}`,
    ...(book.author ? { brand: { '@type': 'Brand', name: book.author } } : {}),
    sku: book.id,
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'ARS',
      price: book.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${SITE_URL}/#tienda` },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'AR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: WITHDRAWAL_DAYS,
        returnMethod: 'https://schema.org/ReturnByMail',
        // El envío de la devolución por arrepentimiento corre por cuenta del negocio.
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
    ...(average !== null && reviews.length > 0
      ? {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: average, reviewCount: reviews.length, bestRating: 5, worstRating: 1 },
          review: reviews.slice(0, 10).map((r) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            author: { '@type': 'Person', name: r.nombre },
            datePublished: r.createdAt.slice(0, 10),
            reviewBody: r.text,
          })),
        }
      : {}),
  };
}

/** <script type="application/ld+json"> sin romper el HTML si un texto trae "</script>". */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
