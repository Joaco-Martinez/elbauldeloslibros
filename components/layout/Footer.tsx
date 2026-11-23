import Link from 'next/link';
import type { CSSProperties } from 'react';
import { BRAND, NAV_LINKS, externalProps } from '@/lib/nav';
import { CONSUMER_DEFENSE_URL, WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/site';
import { SocialLinks } from './SocialLinks';

/** Footer mínimo: la referencia no lo muestra. */
export function Footer() {
  return (
    <footer
      id="contacto"
      className="relative -mt-px bg-forest pb-10 pt-12 text-[13px] text-cream md:pt-16"
      style={{ '--ring': 'var(--color-cream)' } as CSSProperties}
    >
      <div className="container-site flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="focus-ring self-start rounded-md font-script text-[24px] leading-none">
          {BRAND}
        </Link>
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} {...externalProps(link)} className="focus-ring rounded-sm font-medium hover:underline">
                  {link.label}
                  {link.external && <span aria-hidden="true"> ↗</span>}
                  {link.external && <span className="sr-only"> (se abre en otra pestaña)</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container-site mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
        <p className="text-[14px] font-bold">Seguinos</p>
        <SocialLinks size="md" withHandle />
      </div>

      {/* Legales: botón de arrepentimiento destacado (Res. SCI 424/2020) y reclamos (Res. SCI 274/2021). */}
      <div className="container-site mt-8 flex flex-col gap-4 border-t-2 border-leaf pt-6 md:flex-row md:items-center md:justify-between">
        <Link
          href="/arrepentimiento"
          className="btn h-11 self-start border-2 border-mustard px-5 text-[14px] text-mustard hover:bg-mustard hover:text-forest"
        >
          Botón de arrepentimiento
        </Link>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 font-medium">
          <li>
            <Link href="/cambios-y-devoluciones" className="focus-ring rounded-sm hover:underline">
              Cambios y devoluciones
            </Link>
          </li>
          <li>
            <Link href="/terminos" className="focus-ring rounded-sm hover:underline">
              Términos y condiciones
            </Link>
          </li>
          <li>
            <Link href="/privacidad" className="focus-ring rounded-sm hover:underline">
              Privacidad
            </Link>
          </li>
        </ul>
      </div>
      <p className="container-site mt-4 font-medium">
        <a
          href={CONSUMER_DEFENSE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring rounded-sm underline underline-offset-2"
        >
          Defensa de las y los Consumidores. Para reclamos ingrese aquí
          <span className="sr-only"> (abre en otra pestaña)</span>
        </a>
      </p>

      <div className="container-site mt-8 flex flex-col gap-1 font-medium md:flex-row md:justify-between">
        <p>
          Envíos a todo el país ·{' '}
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring rounded-sm underline underline-offset-2"
          >
            WhatsApp {WHATSAPP_DISPLAY}
          </a>
        </p>
        <p>© 2026 {BRAND}</p>
      </div>
    </footer>
  );
}
