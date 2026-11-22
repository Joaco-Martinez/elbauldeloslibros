'use client';

import { useEffect, useRef, useState } from 'react';

/** Marca el elemento como visible la primera vez que entra al viewport. */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    // Respaldo: si el observador no se dispara (navegadores raros, capturas, impresión), el contenido aparece igual.
    const fallback = window.setTimeout(() => setInView(true), 2000);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [threshold]);

  return [ref, inView] as const;
}
