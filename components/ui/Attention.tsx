'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Envuelve una alerta (¡Quedan 2!, 10% OFF, cuenta regresiva) y la hace "saltar" 3 veces cuando
 * aparece en pantalla; después queda quieta (un rebote infinito cansa y se termina ignorando).
 * Con "reducir movimiento" activado en el dispositivo, no se mueve.
 */
export function Attention({
  children,
  className = '',
  delay = 0,
  as: Tag = 'span',
}: {
  children: ReactNode;
  className?: string;
  /** Retraso en ms (para que varias no salten todas juntas). */
  delay?: number;
  as?: 'span' | 'p' | 'div';
}) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`attn ${on ? 'attn--on' : ''} ${className}`}
      style={{ animationDelay: `${400 + delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
