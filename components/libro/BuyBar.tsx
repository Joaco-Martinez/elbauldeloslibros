'use client';

import { useEffect, useState } from 'react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

interface BuyBarProps {
  bookId: string;
  title: string;
  price: string;
  transferPrice: string;
  /** id del bloque con el botón principal: la barra aparece cuando quedó arriba, fuera de pantalla. */
  watchId: string;
}

/** Barra fija abajo con título, precio y botón, para comprar sin volver a subir. */
export function BuyBar({ bookId, title, price, transferPrice, watchId }: BuyBarProps) {
  const [ctaPassed, setCtaPassed] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  // En celular la barra está desde que carga (el botón principal queda más abajo de la primera pantalla);
  // en compu aparece cuando el botón principal ya pasó.
  const [isPhone, setIsPhone] = useState(false);
  const visible = (isPhone || ctaPassed) && !footerVisible;

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const target = document.getElementById(watchId);
    const footer = document.getElementById('contacto');
    if (!target || typeof IntersectionObserver === 'undefined') return;
    const ctaObserver = new IntersectionObserver(([entry]) => {
      // Solo cuando el botón principal ya pasó (está por encima), no antes de llegar.
      setCtaPassed(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    ctaObserver.observe(target);
    // Se esconde al llegar al footer para no taparlo.
    const footerObserver = new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting));
    if (footer) footerObserver.observe(footer);
    return () => {
      ctaObserver.disconnect();
      footerObserver.disconnect();
    };
  }, [watchId]);

  return (
    <div
      className="buy-bar fixed inset-x-0 bottom-0 z-40 bg-forest text-cream"
      data-visible={visible}
      aria-hidden={!visible}
      inert={!visible || undefined}
    >
      <div className="container-site flex items-center justify-between gap-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold md:text-[15px]">{title}</p>
          {/* Igual que en la ficha: grande el de transferencia, después el de Mercado Pago. */}
          <p className="text-[12px] font-medium md:text-[13px]">
            <span className="font-bold text-mustard">{transferPrice} con transferencia</span>
            <span className="hidden sm:inline"> · {price} con Mercado Pago</span>
          </p>
        </div>
        <AddToCartButton bookId={bookId} size="bar" className="shrink-0" />
      </div>
    </div>
  );
}
