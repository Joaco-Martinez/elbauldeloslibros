import type { ReactNode } from 'react';

interface SplitLayoutProps {
  media: ReactNode;
  children: ReactNode;
}

/** Bloque partido: imagen en col 1–5, texto en col 7–12 (tablet 5/7, mobile apilado). */
export function SplitLayout({ media, children }: SplitLayoutProps) {
  return (
    <div className="container-site grid gap-y-10 md:grid-cols-12 md:items-center md:gap-x-6">
      <div className="relative md:col-span-5">{media}</div>
      <div className="md:col-span-7 lg:col-span-6 lg:col-start-7">{children}</div>
    </div>
  );
}
