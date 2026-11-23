'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { fullTitle } from '@/data/books';
import { Attention } from '@/components/ui/Attention';
import { Button } from '@/components/ui/Button';
import { Sticker } from '@/components/ui/Sticker';
import {
  DELIVERY_DETAIL,
  DELIVERY_LABEL,
  DELIVERY_SUMMARY,
  isCordobaCapital,
  shippingModeOf,
  type Delivery,
} from '@/lib/delivery';
import { formatPrice } from '@/lib/formatPrice';
import { bookCount, computeTotals, TRANSFER_DISCOUNT, type PaymentMethod } from '@/lib/pricing';
import { SHIPPING_ETA, shippingCost, shippingZone, type ShippingMode } from '@/lib/shipping';
import { analyticsItems, track } from '@/lib/analytics';
import { readSavedProvince, saveProvince } from '@/lib/savedProvince';
import { PROVINCIAS } from '@/lib/site';
import { TransferConfirmation, type TransferResult } from './TransferConfirmation';

const inputClass =
  'h-12 w-full rounded-[14px] border-[1.5px] border-ink bg-cream px-4 text-[15px] font-medium text-ink placeholder:text-leather focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-forest';

function Field({
  label,
  name,
  children,
  className = '',
  optional = false,
}: {
  label: string;
  name: string;
  children?: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-[13px] font-bold">
        {label}
        {optional && <span className="font-medium"> (opcional)</span>}
      </label>
      {children}
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="mt-10 first:mt-0">
      <legend className="display t-category text-rust">{legend}</legend>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

/** Opción grande con radio (medio de pago, forma de entrega). */
function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  title,
  detail,
  badge,
  price,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
  badge?: string;
  /** Precio a la derecha (envíos). */
  price?: string;
}) {
  return (
    <label
      className={`relative flex cursor-pointer items-start gap-4 rounded-card border-2 p-4 transition-colors focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-forest md:p-5 ${
        checked ? 'border-forest bg-beige' : 'border-beige bg-cream'
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      <span
        aria-hidden="true"
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-forest ${checked ? 'bg-forest' : ''}`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-cream" />}
      </span>
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold">
          {title}
          {badge && <Attention className="rounded-full bg-forest px-2.5 py-0.5 text-[12px] font-bold text-cream">{badge}</Attention>}
        </span>
        <span className="mt-1 block text-[13px] font-medium">{detail}</span>
      </span>
      {price && <span className="display shrink-0 text-[1.35rem] leading-none md:text-[1.5rem]">{price}</span>}
    </label>
  );
}

const METHODS:{ id: PaymentMethod; title: string; detail: string; badge?: string }[] = [
  {
    id: 'transferencia',
    title: 'Transferencia bancaria',
    detail: 'Al confirmar te mostramos los datos. Después mandás el comprobante por WhatsApp. Te reservamos los libros por 24 h.',
    badge: `${Math.round(TRANSFER_DISCOUNT * 100)}% off`,
  },
  {
    id: 'mercadopago',
    title: 'Mercado Pago',
    detail: 'Tarjeta de crédito, débito o dinero en cuenta.',
  },
];

const DRAFT_KEY = 'bdl-checkout-id';

/** Id de este checkout (para el carrito abandonado). Funciona también sin https, en la red local. */
function getDraftId() {
  try {
    const saved = window.localStorage.getItem(DRAFT_KEY);
    if (saved && /^[a-f0-9-]{36}$/.test(saved)) return saved;
  } catch {
    // sin almacenamiento: se usa uno nuevo
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  try {
    window.localStorage.setItem(DRAFT_KEY, id);
  } catch {
    // sin almacenamiento
  }
  return id;
}

function forgetDraftId() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // sin almacenamiento
  }
}

/** Celular como lo pide MiCorreo: código de área sin 0 + número. */
function phoneFrom(form: FormData) {
  const digits = (k: string) => String(form.get(k) ?? '').replace(/\D/g, '');
  return `${digits('telArea').replace(/^0+/, '')} ${digits('telNumero')}`.trim();
}

export function CheckoutForm() {
  const { items, ready, clear } = useCart();
  const formRef = useRef<HTMLFormElement>(null);
  const lastDraft = useRef('');
  const nextDraft = useRef<string | null>(null);
  const sending = useRef(false);

  /** Guarda el carrito con el contacto (si ya puso email o celular) por si no termina la compra. */
  const saveDraft = useCallback(() => {
    const el = formRef.current;
    if (!el || items.length === 0) return;
    const form = new FormData(el);
    const payload = {
      id: getDraftId(),
      items,
      nombre: String(form.get('nombre') ?? ''),
      email: String(form.get('email') ?? ''),
      telefono: phoneFrom(form),
      provincia: String(form.get('provincia') ?? ''),
    };
    const json = JSON.stringify(payload);
    const hasContact = /\S+@\S+\.\S+/.test(payload.email) || payload.telefono.replace(/\D/g, '').length >= 10;
    if (json === lastDraft.current || (!hasContact && !lastDraft.current)) return;
    lastDraft.current = json;
    // De a uno por vez y siempre el último: así uno viejo nunca pisa al más nuevo.
    nextDraft.current = json;
    if (sending.current) return;
    sending.current = true;
    void (async () => {
      while (nextDraft.current) {
        const body = nextDraft.current;
        nextDraft.current = null;
        await fetch('/api/carritos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(
          () => undefined,
        );
      }
      sending.current = false;
    })();
  }, [items]);

  // Si cambia el carrito con el checkout abierto, se actualiza lo guardado.
  useEffect(() => {
    if (lastDraft.current) saveDraft();
  }, [saveDraft]);
  const [method, setMethod] = useState<PaymentMethod>('transferencia');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<TransferResult | null>(null);
  // Dirección controlada para detectar Córdoba Capital y ofrecer retiro / Uber Moto.
  const [provincia, setProvincia] = useState('');
  // Si eligió la provincia en el carrito para ver el envío, viene completa.
  useEffect(() => {
    const saved = readSavedProvince();
    if (saved) setProvincia((p) => p || saved);
  }, []);
  // Medición: entró al checkout (una vez, cuando ya se leyó el carrito).
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (!ready || items.length === 0 || checkoutTracked.current) return;
    checkoutTracked.current = true;
    track('begin_checkout', { items: analyticsItems(items) });
  }, [ready, items]);
  // Medición: eligió provincia (ya sabe cuánto sale el envío).
  useEffect(() => {
    if (provincia && items.length > 0) track('add_shipping_info', { items: analyticsItems(items), shipping_tier: provincia });
    // Solo cuando cambia la provincia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provincia]);
  const [ciudad, setCiudad] = useState('');
  const [cp, setCp] = useState('');
  // En Córdoba Capital solo hay retiro o Uber Moto; en el resto, Correo Argentino a sucursal o domicilio.
  const [deliveryChoice, setDeliveryChoice] = useState<'retiro' | 'uber'>('retiro');
  const [shipMode, setShipMode] = useState<ShippingMode>('sucursal');
  const isCapital = isCordobaCapital(provincia, ciudad, cp);
  const delivery: Delivery = isCapital ? deliveryChoice : shipMode === 'sucursal' ? 'sucursal' : 'envio';

  if (transfer) return <TransferConfirmation result={transfer} />;

  if (!ready) return <p className="lede">Cargando tu carrito…</p>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start">
        <h2 className="display t-category text-rust">Tu carrito está vacío.</h2>
        <p className="lede mt-4">Elegí algo del catálogo y volvé por acá.</p>
        <Button href="/catalogo" variant="rust" className="mt-6">
          Ver el catálogo
        </Button>
      </div>
    );
  }

  const itemCount = bookCount(items);
  const zone = shippingZone(provincia);
  const shippingPrices = {
    sucursal: shippingCost(provincia, 'sucursal', itemCount),
    domicilio: shippingCost(provincia, 'domicilio', itemCount),
  };
  const mode = shippingModeOf(delivery);
  const shippingTotal = mode ? (shippingPrices[mode] ?? 0) : 0;
  const totals = computeTotals(items, method, shippingTotal);
  // Retiro / Uber: no hay envío que sumar. Correo: hace falta la provincia para saber cuánto sale.
  const totalKnown = !mode || shippingPrices[mode] != null;
  const shippingLine = isCapital
    ? DELIVERY_SUMMARY[delivery]
    : shippingPrices[shipMode] !== null
      ? formatPrice(shippingTotal)
      : 'Elegí tu provincia';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const customer: Record<string, string> = {
      ...Object.fromEntries(
        ['nombre', 'email', 'calle', 'pisoDepto', 'ciudad', 'provincia', 'cp', 'notas'].map((k) => [k, String(form.get(k) ?? '')]),
      ),
      telefono: phoneFrom(form),
    };

    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customer, method, delivery, draftId: getDraftId() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Algo salió mal. Probá de nuevo.');
        setSubmitting(false);
        return;
      }
      // El pedido ya existe: el servidor borró el carrito guardado y el próximo checkout arranca de cero.
      forgetDraftId();
      lastDraft.current = '';
      // Medición: pedido confirmado (con transferencia todavía falta el comprobante; con Mercado Pago, el pago).
      const tracked = analyticsItems(items);
      track('add_payment_info', { items: tracked, payment_type: method });
      track('purchase', { items: tracked, value: data.total, transaction_id: data.orderId, shipping: shippingTotal });
      if (method === 'mercadopago') {
        // El carrito se vacía cuando Mercado Pago confirma el pago (página de resultado).
        window.location.assign(data.redirectUrl);
        return;
      }
      setTransfer({
        orderId: data.orderId,
        token: data.token,
        total: data.total,
        discount: data.discount,
        email: customer.email,
        emailSent: Boolean(data.emailSent),
      });
      clear();
      window.scrollTo({ top: 0 });
    } catch {
      setError('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <form
      id="checkout-form"
      ref={formRef}
      onSubmit={onSubmit}
      onBlur={saveDraft}
      className="grid gap-y-12 lg:grid-cols-12 lg:gap-x-6"
      style={{ '--ring': 'var(--color-forest)' } as CSSProperties}
    >
      <div className="lg:col-span-7">
        {/* Celular: el resumen completo queda al final, así que arriba va el total a la vista. */}
        <a
          href="#resumen-title"
          className="focus-ring mb-10 flex items-center justify-between gap-4 rounded-card bg-forest px-5 py-4 text-cream lg:hidden"
          style={{ '--ring': 'var(--color-forest)' } as CSSProperties}
        >
          <span className="text-[14px] font-bold">
            Tu pedido · {itemCount} {itemCount === 1 ? 'libro' : 'libros'}
          </span>
          <span className="flex items-center gap-3">
            <span className="display text-[1.6rem]">{formatPrice(totals.total)}</span>
            <span className="text-[12px] font-bold underline underline-offset-2">Ver detalle</span>
          </span>
        </a>
        <Fieldset legend="Tus datos.">
          <Field label="Nombre y apellido" name="nombre" className="sm:col-span-2">
            <input id="nombre" name="nombre" required autoComplete="name" maxLength={120} className={inputClass} />
          </Field>
          <Field label="Email" name="email">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              maxLength={160}
              aria-describedby="datos-aviso"
              className={inputClass}
            />
          </Field>
          <fieldset>
            <legend className="mb-1.5 block text-[13px] font-bold">Celular</legend>
            <div className="grid grid-cols-[5.5rem_1fr] gap-2">
              <div>
                <label htmlFor="telArea" className="sr-only">
                  Código de área, sin 0
                </label>
                <input
                  id="telArea"
                  name="telArea"
                  required
                  inputMode="numeric"
                  autoComplete="tel-area-code"
                  pattern="[1-9][0-9]{1,3}"
                  maxLength={4}
                  placeholder="Ej. 351"
                  aria-describedby="tel-hint"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="telNumero" className="sr-only">
                  Número, sin 15
                </label>
                <input
                  id="telNumero"
                  name="telNumero"
                  required
                  inputMode="numeric"
                  autoComplete="tel-local"
                  pattern="[0-9]{6,8}"
                  maxLength={8}
                  placeholder="Ej. 5551234"
                  aria-describedby="tel-hint"
                  className={inputClass}
                />
              </div>
            </div>
            <p id="tel-hint" className="mt-1.5 text-[12px] font-medium">
              Código de área sin 0 y número sin 15.
            </p>
          </fieldset>
          <p id="datos-aviso" className="text-[12px] font-medium sm:col-span-2">
            Guardamos tu email, celular y carrito solo para ayudarte con esta compra (por ejemplo, si se corta a mitad de
            camino). Se borran a los 30 días.
          </p>
        </Fieldset>

        <Fieldset legend="¿Dónde estás?">
          <Field label="Provincia" name="provincia">
            <select
              id="provincia"
              name="provincia"
              required
              value={provincia}
              onChange={(e) => {
                setProvincia(e.target.value);
                saveProvince(e.target.value);
              }}
              autoComplete="address-level1"
              className={inputClass}
            >
              <option value="" disabled>
                Elegí una
              </option>
              {PROVINCIAS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Localidad" name="ciudad">
            <input
              id="ciudad"
              name="ciudad"
              required
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              autoComplete="address-level2"
              maxLength={120}
              className={inputClass}
            />
          </Field>
          <Field label="Código postal" name="cp">
            <input
              id="cp"
              name="cp"
              required
              value={cp}
              onChange={(e) => setCp(e.target.value)}
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={12}
              className={inputClass}
            />
          </Field>
        </Fieldset>

        {isCapital && (
          <fieldset className="mt-10" aria-describedby="cba-hint">
            <legend className="display t-category text-rust">¿Cómo lo recibís?</legend>
            <p id="cba-hint" className="mt-3 text-[14px] font-medium">
              Estás en Córdoba Capital: podés retirarlo o te lo mandamos en Uber Moto.
            </p>
            <div className="mt-5 grid gap-3">
              {(['retiro', 'uber'] as const).map((d) => (
                <ChoiceCard
                  key={d}
                  name="entrega"
                  value={d}
                  checked={delivery === d}
                  onChange={() => setDeliveryChoice(d)}
                  title={DELIVERY_LABEL[d]}
                  detail={DELIVERY_DETAIL[d]}
                />
              ))}
            </div>
          </fieldset>
        )}

        {!isCapital && zone && (
          <fieldset className="mt-10" aria-describedby="envio-hint">
            <legend className="display t-category text-rust">¿Cómo te lo mandamos?</legend>
            <p id="envio-hint" className="mt-3 text-[14px] font-medium">
              Por Correo Argentino. Lo despachamos en 24 h hábiles y tarda {SHIPPING_ETA[zone]} en llegar.
            </p>
            <div className="mt-5 grid gap-3">
              {(['sucursal', 'domicilio'] as const).map((m) => {
                const d: Delivery = m === 'sucursal' ? 'sucursal' : 'envio';
                const price = shippingPrices[m];
                return (
                  <ChoiceCard
                    key={m}
                    name="envio"
                    value={m}
                    checked={shipMode === m}
                    onChange={() => setShipMode(m)}
                    title={m === 'sucursal' ? 'A sucursal' : 'A domicilio'}
                    detail={DELIVERY_DETAIL[d]}
                    price={price !== null ? formatPrice(price) : undefined}
                  />
                );
              })}
            </div>
          </fieldset>
        )}

        {delivery === 'sucursal' && (
          <Fieldset legend="¿Qué sucursal te queda cómoda?">
            <Field label="Sucursal o zona preferida" name="notas" optional className="sm:col-span-2">
              <textarea
                id="notas"
                name="notas"
                rows={2}
                maxLength={500}
                className={`${inputClass} h-auto py-3`}
                placeholder="Ej.: sucursal centro, o cerca de la plaza principal"
              />
              <p className="mt-2 text-[13px] font-medium">
                Si no sabés cuál, no pasa nada: la elegimos según tu código postal y te avisamos por mail.
              </p>
            </Field>
          </Fieldset>
        )}

        {(delivery === 'envio' || delivery === 'uber') && (
          <Fieldset legend={delivery === 'uber' ? '¿A dónde va el Uber?' : '¿A dónde lo mandamos?'}>
            <Field label="Calle y número" name="calle" className="sm:col-span-2">
              <input id="calle" name="calle" required autoComplete="address-line1" maxLength={160} className={inputClass} />
            </Field>
            <Field label="Piso / depto" name="pisoDepto" optional className="sm:col-span-2">
              <input id="pisoDepto" name="pisoDepto" autoComplete="address-line2" maxLength={40} className={inputClass} />
            </Field>
            <Field label="Notas para el envío" name="notas" optional className="sm:col-span-2">
              <textarea
                id="notas"
                name="notas"
                rows={3}
                maxLength={500}
                className={`${inputClass} h-auto py-3`}
                placeholder="Horarios, timbre, referencias…"
              />
            </Field>
          </Fieldset>
        )}

        <fieldset className="mt-10">
          <legend className="display t-category text-rust">¿Cómo pagás?</legend>
          <div className="mt-5 grid gap-3">
            {METHODS.map((m) => (
              <ChoiceCard
                key={m.id}
                name="metodo"
                value={m.id}
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                title={m.title}
                detail={m.detail}
                badge={m.badge}
              />
            ))}
          </div>
        </fieldset>
      </div>

      {/* Resumen */}
      <aside aria-labelledby="resumen-title" className="lg:col-span-5">
        <div className="relative rounded-card bg-forest p-6 text-cream md:p-7 lg:sticky lg:top-6">
          <Sticker variant="checker" size={44} rotate={12} className="-right-1 -top-4 md:-right-3" />
          <h2 id="resumen-title" className="display t-category">
            Tu pedido.
          </h2>
          <ul className="mt-5 space-y-3 text-[14px]">
            {totals.lines.map((l) => (
              <li key={l.book.id} className="flex items-start justify-between gap-4">
                <span className="font-medium">
                  {l.qty} × {fullTitle(l.book)}
                </span>
                <span className="shrink-0 font-bold">{formatPrice(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t-2 border-leaf pt-5 text-[14px]">
            <div className="flex justify-between gap-4">
              <dt className="font-medium">Subtotal</dt>
              <dd className="font-bold">{formatPrice(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between gap-4 text-mustard">
                <dt className="font-bold">Descuento transferencia</dt>
                <dd className="font-bold">−{formatPrice(totals.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="font-medium">
                {isCapital ? 'Entrega' : `Envío${zone ? ` a ${shipMode}` : ''}`}
              </dt>
              <dd className="text-right font-bold">{shippingLine}</dd>
            </div>
            <div className="flex items-end justify-between gap-4 pt-3">
              <dt className="font-bold">Total</dt>
              <dd className="display text-[2.25rem]">{formatPrice(totals.total)}</dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className="mt-5 rounded-[12px] bg-cream px-4 py-3 text-[13px] font-bold text-brick">
              {error}
            </p>
          )}

          <Button type="submit" variant="gold" className="mt-6 h-14 w-full text-[16px]" disabled={submitting}>
            {submitting ? 'Procesando…' : method === 'mercadopago' ? 'Pagar con Mercado Pago' : 'Confirmar pedido'}
            {/* Con el monto, solo cuando ya se sabe el envío (si no, el número no sería el final). */}
            {!submitting && totalKnown && ` · ${formatPrice(totals.total)}`}
          </Button>
          <p className="mt-3 text-center text-[12px] font-medium">
            {method === 'mercadopago'
              ? 'Te llevamos a Mercado Pago para pagar de forma segura.'
              : 'Al confirmar te mostramos los datos para transferir.'}
          </p>
          <p className="mt-3 text-center text-[12px] font-medium">
            Al confirmar aceptás los{' '}
            <a href="/terminos" target="_blank" className="underline underline-offset-2">
              términos
            </a>{' '}
            y la{' '}
            <a href="/privacidad" target="_blank" className="underline underline-offset-2">
              política de privacidad
            </a>
            . Tenés 10 días para{' '}
            <a href="/arrepentimiento" target="_blank" className="underline underline-offset-2">
              arrepentirte
            </a>
            .
          </p>
        </div>
      </aside>
    </form>
  );
}
