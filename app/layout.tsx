import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, DM_Sans, Pacifico } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SvgDefs } from '@/components/ui/SvgDefs';
import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { books } from '@/data/books';
import { getBookCover } from '@/lib/bookImage';
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
  title: {
    default: 'El Baul de los Libros · Libros nuevos con envío a todo el país',
    template: '%s · El Baul de los Libros',
  },
  description:
    'Librería online de libros nuevos con envío a domicilio a toda la Argentina. Desarrollo personal, finanzas, filosofía, espiritualidad, romance y thriller, elegidos uno por uno.',
};

export const viewport: Viewport = {
  themeColor: '#B04028',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <CartProvider images={bookImages}>
          <Header />
          <main id="contenido">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
