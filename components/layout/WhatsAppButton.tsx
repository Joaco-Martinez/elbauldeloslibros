'use client';

import { usePathname } from 'next/navigation';
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/lib/site';

/** Botón flotante de WhatsApp, abajo a la derecha en todo el sitio (menos el panel). */
export function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escribinos por WhatsApp al ${WHATSAPP_DISPLAY}`}
      title="Escribinos por WhatsApp"
      className="wa-float fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] md:bottom-6 md:right-6 md:h-16 md:w-16"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-8 w-8 md:h-9 md:w-9" fill="currentColor">
        <path d="M16.004 3C9.38 3 4.004 8.373 4.004 14.997c0 2.117.553 4.183 1.604 6.004L4 29l8.2-1.578a11.96 11.96 0 0 0 3.804.62h.003C22.627 28.042 28 22.668 28 16.044 28 9.42 22.627 3 16.004 3Zm0 22.86h-.003a9.9 9.9 0 0 1-3.42-.608l-.245-.09-4.866.937.957-4.73-.16-.255a9.87 9.87 0 0 1-1.52-5.118c0-5.47 4.452-9.92 9.26-9.92 5.47 0 9.82 4.45 9.82 9.92 0 5.47-4.353 9.864-9.823 9.864Zm5.43-7.405c-.297-.149-1.757-.867-2.03-.966-.272-.1-.47-.149-.669.149-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.074-.297-.148-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.148-.174.198-.298.297-.496.1-.198.05-.372-.025-.52-.074-.149-.669-1.611-.916-2.206-.241-.58-.487-.501-.669-.51l-.57-.01a1.09 1.09 0 0 0-.793.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.073.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z" />
      </svg>
    </a>
  );
}
