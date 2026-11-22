import fs from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { toneVar, type Tone } from '@/lib/tokens';

export interface PhotoProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Color del placeholder mientras no exista el archivo. */
  placeholderTone?: Tone;
  className?: string;
}

function publicFileExists(src: string) {
  try {
    return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')));
  } catch {
    return false;
  }
}

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Foto con next/image. Si el archivo todavía no está en /public,
 * muestra un bloque de color (y en desarrollo, el alt visible).
 */
export function Photo({ src, alt, sizes, priority = false, placeholderTone = 'leather', className = '' }: PhotoProps) {
  const exists = publicFileExists(src);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={exists ? undefined : { backgroundColor: toneVar(placeholderTone) }}
    >
      {exists ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center p-[12%] text-center">
          {isDev && (
            <span className="text-[11px] font-medium leading-snug text-cream md:text-[12px]">
              Foto pendiente: {src}
              <br />
              {alt}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
