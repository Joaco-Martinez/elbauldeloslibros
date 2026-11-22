import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHero } from '@/components/checkout/PageHero';
import { WaveDivider } from '@/components/ui/WaveDivider';

const LEGAL_LINKS = [
  { href: '/arrepentimiento', label: 'Botón de arrepentimiento' },
  { href: '/cambios-y-devoluciones', label: 'Cambios y devoluciones' },
  { href: '/terminos', label: 'Términos y condiciones' },
  { href: '/privacidad', label: 'Privacidad' },
];

/** Página legal: mismo hero corto del sitio y texto en una columna cómoda de leer. */
export function LegalLayout({
  id,
  title,
  intro,
  updated,
  current,
  children,
}: {
  id: string;
  title: string;
  intro?: ReactNode;
  /** "noviembre de 2026" */
  updated: string;
  current: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHero id={id} title={title}>
        {intro}
      </PageHero>
      <section aria-labelledby={id} className="section-pad bg-cream">
        <div className="container-site">
          <nav aria-label="Páginas legales" className="mx-auto mb-10 flex max-w-[68ch] flex-wrap gap-2">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={current === l.href ? 'page' : undefined}
                className={`btn h-9 px-4 text-[13px] ${current === l.href ? 'bg-forest text-cream' : 'border-[1.5px] border-ink text-ink'}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="legal-prose mx-auto max-w-[68ch]">{children}</div>
          <p className="mx-auto mt-12 max-w-[68ch] text-[12px] font-medium">Última actualización: {updated}.</p>
        </div>
      </section>
      <WaveDivider top="cream" bottom="forest" variant={2} />
    </>
  );
}
