import type { ReactNode } from 'react';
import { Photo, type PhotoProps } from './Photo';

interface BlobImageProps extends PhotoProps {
  shape?: 'a' | 'b';
  /** Pegatinas u otros elementos que pisan el borde de la máscara. */
  children?: ReactNode;
}

const SHAPES = { a: 'blob-a', b: 'blob-b' } as const;

/** Foto con máscara orgánica irregular, más ancha que alta (~1.3:1). */
export function BlobImage({ shape = 'a', children, className = '', ...photo }: BlobImageProps) {
  return (
    <div className={`relative ${className}`}>
      <Photo {...photo} className={`aspect-[1.3/1] w-full ${SHAPES[shape]}`} />
      {children}
    </div>
  );
}
