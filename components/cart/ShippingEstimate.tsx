'use client';

import { useEffect, useState } from 'react';
import { formatPrice } from '@/lib/formatPrice';
import { readSavedProvince, saveProvince } from '@/lib/savedProvince';
import { SHIPPING_ETA, SHIPPING_FROM, shippingCost, shippingZone } from '@/lib/shipping';
import { PROVINCIAS } from '@/lib/site';

/**
 * En el carrito: elegís la provincia y ves cuánto sale el envío (a sucursal y a domicilio) antes del checkout.
 * Los precios salen de la misma tabla que usa el checkout (lib/shipping.ts), por provincia.
 */
export function ShippingEstimate({ bookCount, transferTotal }: { bookCount: number; transferTotal: number }) {
  const [provincia, setProvincia] = useState('');

  useEffect(() => setProvincia(readSavedProvince()), []);

  const zone = shippingZone(provincia);
  const sucursal = shippingCost(provincia, 'sucursal', bookCount);
  const domicilio = shippingCost(provincia, 'domicilio', bookCount);
  const cordoba = provincia === 'Córdoba';

  return (
    <div className="mt-3 rounded-[14px] border-[1.5px] border-beige px-3.5 py-3">
      <label htmlFor="envio-provincia" className="block text-[12px] font-bold">
        ¿A qué provincia lo mandamos?
      </label>
      <select
        id="envio-provincia"
        value={provincia}
        onChange={(e) => {
          setProvincia(e.target.value);
          saveProvince(e.target.value);
        }}
        className="mt-1.5 h-11 w-full rounded-[10px] border-[1.5px] border-ink bg-cream px-3 text-[14px] font-medium focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest"
      >
        <option value="">Elegí para ver el envío</option>
        {PROVINCIAS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <div aria-live="polite" className="mt-2 text-[12px] font-medium leading-[1.45]">
        {sucursal !== null && domicilio !== null && zone ? (
          <>
            <p className="flex justify-between gap-3">
              <span>Correo a sucursal</span>
              <strong>{formatPrice(sucursal)}</strong>
            </p>
            <p className="flex justify-between gap-3">
              <span>Correo a domicilio</span>
              <strong>{formatPrice(domicilio)}</strong>
            </p>
            <p className="mt-1">Llega en {SHIPPING_ETA[zone]}.</p>
            <p className="mt-1.5 flex justify-between gap-3 border-t border-beige pt-1.5 text-[13px] font-bold">
              <span>Total con envío a sucursal (transferencia)</span>
              <span className="text-brick">{formatPrice(transferTotal + sucursal)}</span>
            </p>
            {cordoba && <p className="mt-1">En Córdoba Capital también podés retirarlo o recibirlo por Uber Moto.</p>}
          </>
        ) : (
          <p>Envío por Correo Argentino desde {formatPrice(SHIPPING_FROM)}. En Córdoba Capital, retiro o Uber Moto.</p>
        )}
      </div>
    </div>
  );
}
