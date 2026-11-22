'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';

interface Book3DProps {
  /** La tapa: foto o portada ilustrada (lleva su propio texto alternativo). */
  children: ReactNode;
  /** Color del lomo y la contratapa. */
  spineColor: string;
  /** Ancho / alto de la tapa. */
  ratio?: number;
  className?: string;
}

/**
 * Libro en 3D con CSS: tapa, lomo, canto de páginas y contratapa.
 * Se balancea solo; con el mouse encima sigue el puntero. Con movimiento reducido queda quieto.
 *
 * Las medidas 3D van en píxeles medidos (--w / --h), no en unidades de contenedor (cqw):
 * algunos navegadores de celular recalculan mal esas unidades al tocar la pantalla y el libro "se agranda".
 * En pantallas táctiles el libro no recibe toques (no hay vista previa de imagen ni saltos).
 */
export function Book3D({ children, spineColor, ratio = 0.68, className = '' }: Book3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      // Solo si cambió de verdad (evita bucles y saltos por medio píxel).
      setSize((prev) => (prev && Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1 ? prev : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ y: -18 + nx * 40, x: 4 - ny * 14 });
  }

  const style = {
    '--spine': spineColor,
    ...(size ? { '--w': `${size.w}px`, '--h': `${size.h}px` } : {}),
    aspectRatio: `${ratio}`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`book3d ${size ? '' : 'book3d--measuring'} ${className}`}
      style={style}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt(null)}
    >
      <div
        className={`book3d__body ${tilt ? '' : 'book3d__body--idle'}`}
        style={tilt ? { transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` } : undefined}
      >
        <div className="book3d__face book3d__front">{children}</div>
        <div aria-hidden="true" className="book3d__face book3d__back" />
        <div aria-hidden="true" className="book3d__spine" />
        <div aria-hidden="true" className="book3d__pages" />
        <div aria-hidden="true" className="book3d__top" />
      </div>
    </div>
  );
}
