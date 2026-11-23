import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans, Pacifico } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { SvgDefs } from '@/components/ui/SvgDefs';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { books } from '@/data/books';
import { getBookCover } from '@/lib/bookImage';
import { loadCatalog, loadedCustomCatalog } from '@/lib/catalog';
import { getStockMap } from '@/lib/stock';
import { DEFAULT_SHARE_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-display',
  display: 'swap',
});

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

const script = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'El Baul de los Libros · Libros nuevos con envío a todo el país',
    template: '%s · El Baul de los Libros',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // La canónica va en cada página (si se pusiera acá, la heredarían todas y Google las tomaría por el inicio).
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_SHARE_IMAGE, alt: 'Un libro abierto junto a un mate' }],
  },
  twitter: { card: 'summary_large_image', images: [DEFAULT_SHARE_IMAGE] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large' } },
  // Search Console → "Etiqueta HTML": pegar solo el valor de content="…" en GOOGLE_SITE_VERIFICATION.
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: '#B04028',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Libros cargados en el panel: se suman al catálogo, y se le pasan al navegador para el carrito.
  await loadCatalog();
  const customCatalog = loadedCustomCatalog();
  // Stock por libro: el carrito no deja agregar más ejemplares de los que hay.
  const stock = await getStockMap();
  // Fotos resueltas en el servidor para que el carrito (cliente) las pueda mostrar.
  const bookImages = Object.fromEntries(books.map((b) => [b.id, getBookCover(b)]));

  return (
    <html lang="es-AR" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>
        <SvgDefs />
        <a
          href="#contenido"
          className="btn sr-only z-50 bg-cream px-4 py-2 text-[13px] text-brick focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
        >
          Saltar al contenido
        </a>
        <CartProvider images={bookImages} customCatalog={customCatalog} stock={stock}>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
