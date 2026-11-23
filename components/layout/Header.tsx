'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { BRAND, NAV_LINKS, externalProps, isActive } from '@/lib/nav';
import { useCart } from '@/components/cart/CartProvider';
import { MobileMenu } from './MobileMenu';
import { SearchDialog } from './SearchDialog';

export type HeaderTheme = {
  bg: string;
  wordmark: string;
  nav: string;
  ring: string;
};

const THEMES: Record<'rust' | 'mustard', HeaderTheme> = {
  rust: { bg: 'bg-brick', wordmark: 'text-cream', nav: 'text-cream', ring: 'var(--color-cream)' },
  // Terracota sobre dorado da 1.9:1; el wordmark va en verde bosque (6.2:1).
  mustard: { bg: 'bg-mustard', wordmark: 'text-forest', nav: 'text-forest', ring: 'var(--color-forest)' },
};

export function Header() {
  const pathname = usePathname();
  const theme = THEMES[pathname?.startsWith('/nosotros') ? 'mustard' : 'rust'];
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count, open: openCart } = useCart();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLButtonElement>(null);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => toggleRef.current?.focus(), 0);
  }, []);

  return (
    <header className={`${theme.bg} relative z-40`} style={{ '--ring': theme.ring } as CSSProperties}>
      <div className="container-site flex h-[60px] items-center justify-between gap-4 md:h-[72px]">
        <Link
          href="/"
          className={`focus-ring rounded-md font-script text-[19px] leading-none md:text-[24px] ${theme.wordmark}`}
        >
          {BRAND}
        </Link>

        <div className={`flex items-center gap-3 md:gap-7 ${theme.nav}`}>
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-7">
              {NAV_LINKS.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      {...externalProps(link)}
                      aria-current={active ? 'page' : undefined}
                      className={`focus-ring relative rounded-sm text-[13px] font-medium after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-[3px] after:rounded-full after:bg-current after:transition-transform after:duration-200 ${
                        active ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
                      }`}
                    >
                      {link.label}
                      {link.external && <span aria-hidden="true"> ↗</span>}
                      {link.external && <span className="sr-only"> (se abre en otra pestaña)</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            ref={searchRef}
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-haspopup="dialog"
            aria-label="Buscar libros"
            className="focus-ring grid h-10 w-10 place-items-center rounded-full"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="M15.5 15.5L20 20" />
            </svg>
          </button>

          <button
            type="button"
            onClick={openCart}
            aria-haspopup="dialog"
            aria-label={`Carrito, ${count} ${count === 1 ? 'libro' : 'libros'}`}
            className="btn h-8 border-[1.5px] border-current px-3 text-[12px] md:px-3.5 md:text-[13px]"
          >
            Carrito ({count})
          </button>

          <button
            ref={toggleRef}
            type="button"
            className="focus-ring -mr-1.5 grid h-10 w-10 place-items-center rounded-full md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      <MobileMenu open={open} onClose={close} theme={theme} pathname={pathname} />
      <SearchDialog open={searchOpen} onClose={closeSearch} />
    </header>
  );
}
