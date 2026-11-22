import type { ReactNode } from 'react';
import { Sticker } from '@/components/ui/Sticker';
import { WaveDivider } from '@/components/ui/WaveDivider';

/** Hero corto y centrado (mismo lenguaje que el del catálogo) para checkout y resultado. */
export function PageHero({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <>
      <section aria-labelledby={id} className="bg-brick text-cream">
        <div className="container-site flex flex-col items-center pb-10 pt-8 text-center md:pb-12 md:pt-10">
          <div className="relative">
            <h1 id={id} className="display t-h1-catalog">
              {title}
            </h1>
            <Sticker variant="sun" size={48} rotate={-12} className="left-0 -top-8 md:-left-14 md:-top-3" />
            <Sticker variant="checker" size={44} rotate={10} className="right-0 -top-8 md:-right-14 md:-top-1" delay={1.3} />
          </div>
          {children && <div className="mt-4 max-w-[52ch] text-[14px] font-medium leading-[1.45]">{children}</div>}
        </div>
      </section>
      <WaveDivider top="brick" band="mustard" bottom="cream" variant={1} />
    </>
  );
}
