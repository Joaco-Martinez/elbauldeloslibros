'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

interface ShareBookProps {
  /** Link completo a la ficha del libro. */
  url: string;
  title: string;
  author?: string;
}

const ring = { '--ring': 'var(--color-cream)' } as CSSProperties;
const iconBtn =
  'focus-ring flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-cream transition-colors hover:bg-cream hover:text-brick';

/** Botones para compartir la ficha del libro (WhatsApp, Facebook, copiar link y el menú del celular). */
export function ShareBook({ url, title, author }: ShareBookProps) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `Mirá este libro en El Baul de los Libros: ${title}${author ? `, de ${author}` : ''}`;

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: no hacemos nada.
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text, url });
    } catch {
      // El usuario cerró el menú: no pasa nada.
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <p className="text-[13px] font-bold">Compartilo:</p>
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir por WhatsApp"
            title="WhatsApp"
            className={iconBtn}
            style={ring}
          >
            <Icon>
              <path d="M16.004 3C9.38 3 4.004 8.373 4.004 14.997c0 2.117.553 4.183 1.604 6.004L4 29l8.2-1.578a11.96 11.96 0 0 0 3.804.62h.003C22.627 28.042 28 22.668 28 16.044 28 9.42 22.627 3 16.004 3Zm0 22.86h-.003a9.9 9.9 0 0 1-3.42-.608l-.245-.09-4.866.937.957-4.73-.16-.255a9.87 9.87 0 0 1-1.52-5.118c0-5.47 4.452-9.92 9.26-9.92 5.47 0 9.82 4.45 9.82 9.92 0 5.47-4.353 9.864-9.823 9.864Zm5.43-7.405c-.297-.149-1.757-.867-2.03-.966-.272-.1-.47-.149-.669.149-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.074-.297-.148-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.148-.174.198-.298.297-.496.1-.198.05-.372-.025-.52-.074-.149-.669-1.611-.916-2.206-.241-.58-.487-.501-.669-.51l-.57-.01a1.09 1.09 0 0 0-.793.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.073.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
            </Icon>
          </a>
        </li>
        <li>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Compartir en Facebook"
            title="Facebook"
            className={iconBtn}
            style={ring}
          >
            <Icon>
              <path d="M18.4 29V17.6h3.8l.6-4.4h-4.4v-2.8c0-1.3.4-2.1 2.2-2.1H23V4.4c-.4-.1-1.8-.2-3.4-.2-3.4 0-5.7 2.1-5.7 5.9v3.2H10v4.4h3.9V29h4.5Z" />
            </Icon>
          </a>
        </li>
        <li>
          <button type="button" onClick={copy} aria-label="Copiar link del libro" title="Copiar link" className={iconBtn} style={ring}>
            <Icon>
              <g transform="translate(-4 -4) scale(1.25)">
              <path d="M13.5 18.5a1 1 0 0 1-.7-1.7l5.6-5.6a1 1 0 1 1 1.4 1.4l-5.6 5.6a1 1 0 0 1-.7.3Z" />
              <path d="M11 24.9a4.9 4.9 0 0 1-3.5-8.4l3-3a1 1 0 0 1 1.4 1.4l-3 3a2.9 2.9 0 0 0 4.1 4.1l3-3a1 1 0 0 1 1.4 1.4l-3 3a4.9 4.9 0 0 1-3.4 1.5ZM20.8 19a1 1 0 0 1-.7-1.7l3-3a2.9 2.9 0 0 0-4.1-4.1l-3 3a1 1 0 0 1-1.4-1.4l3-3a4.9 4.9 0 0 1 6.9 6.9l-3 3a1 1 0 0 1-.7.3Z" />
              </g>
            </Icon>
          </button>
        </li>
        {canShare && (
          <li>
            <button type="button" onClick={nativeShare} aria-label="Más opciones para compartir" title="Más opciones" className={iconBtn} style={ring}>
              <Icon>
                <path d="M22 20a4 4 0 0 0-3 1.4l-6.2-3.6a4 4 0 0 0 0-3.6L19 10.6A4 4 0 1 0 18 8l-6.2 3.6a4 4 0 1 0 0 5.8L18 21a4 4 0 1 0 4-1Zm0-14a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM9 18a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm13 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
              </Icon>
            </button>
          </li>
        )}
      </ul>
      <span role="status" className="text-[13px] font-bold">
        {copied ? '¡Link copiado!' : ''}
      </span>
    </div>
  );
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="h-5 w-5" fill="currentColor">
      {children}
    </svg>
  );
}
