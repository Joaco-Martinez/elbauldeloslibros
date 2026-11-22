'use client';

import type { ReactNode } from 'react';
import { useInView } from '@/lib/useInView';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** Fade-up suave al entrar en viewport (una sola vez). */
export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
