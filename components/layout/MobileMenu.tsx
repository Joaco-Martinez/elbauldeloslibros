'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { BRAND, NAV_LINKS, externalProps, isActive } from '@/lib/nav';
import { useDialog } from '@/lib/useDialog';
import { Sticker } from '@/components/ui/Sticker';
import type { HeaderTheme } from './Header';
import { SocialLinks } from './SocialLinks';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  theme: HeaderTheme;
  pathname: string | null;
}

export function MobileMenu({ open, onClose, theme, pathname }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialog(open, onClose, panelRef);

  // Si se agranda la ventana a desktop, el menú no tiene sentido.
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (window.innerWidth >= 768) onClose();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menú"
      className={`fixed inset-0 z-50 flex flex-col overflow-y-auto ${theme.bg} ${theme.nav} md:hidden`}
    >
      <div className="container-site flex h-[60px] shrink-0 items-center justify-between">
        <Link href="/" onClick={onClose} className={`focus-ring rounded-md font-script text-[19px] leading-none ${theme.wordmark}`}>
          {BRAND}
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú"
          className="focus-ring -mr-1.5 grid h-10 w-10 place-items-center rounded-full"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav aria-label="Principal" className="container-site relative flex flex-1 flex-col justify-center pb-24">
        <ul className="flex flex-col gap-3">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  {...externalProps(link)}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`display focus-ring relative inline-block rounded-md text-[3.25rem] after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-1 after:rounded-full after:bg-current ${
                    active ? 'after:block' : 'after:hidden'
                  }`}
                >
                  {link.label}.
                  {link.external && <span className="sr-only"> (abre WhatsApp)</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        <SocialLinks className="mt-10" size="md" />
        <Sticker variant="sun" size={56} rotate={-10} className="right-6 top-6" />
        <Sticker variant="checker" size={52} rotate={12} className="bottom-16 right-12" delay={1.5} />
      </nav>
    </div>
  );
}
