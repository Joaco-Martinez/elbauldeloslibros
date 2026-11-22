import { whatsappUrl } from '@/lib/site';

export interface NavLink {
  label: string;
  href: string;
  /** Abre afuera del sitio (pestaña nueva). */
  external?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Recomendados', href: '/#recomendados' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Contacto', href: whatsappUrl(), external: true },
];

/** Props para abrir un link externo de forma segura. */
export const externalProps = (link: NavLink) =>
  link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

export const BRAND = 'El Baul de los Libros';

export function isActive(pathname: string | null, href: string) {
  if (!pathname || href.includes('#') || href.startsWith('http')) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
