import { formatPrice } from '@/lib/formatPrice';
import { DELIVERY_LABEL, DELIVERY_SUMMARY, isLocalDelivery } from '@/lib/delivery';
import { FLOW, etaInfo, formatDateTime, statusHeadline, stepDetail, stepIndex, stepLabel } from '@/lib/orderStatus';
import type { Order } from '@/lib/orderTypes';
import { opinionUrl, receiptWhatsappUrl, restoreCartUrl, trackingUrl } from '@/lib/receipt';
import { WHATSAPP_DISPLAY, transferInfoComplete, transferRows } from '@/lib/site';

// Paleta de marca (los mails no leen variables CSS).
const C = {
  forest: '#0B2E1A',
  cream: '#F6E7C6',
  mustard: '#D4A017',
  rust: '#C74E2E',
  brick: '#B04028',
  beige: '#D9C6A3',
  ink: '#2B1A10',
};
const FONT = "'DM Sans', Helvetica, Arial, sans-serif";

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const button = (href: string, label: string, bg = C.forest, fg = C.cream) =>
  `<a href="${esc(href)}" style="display:inline-block;background:${bg};color:${fg};font-family:${FONT};font-weight:700;font-size:14px;text-decoration:none;padding:13px 22px;border-radius:999px">${esc(label)}</a>`;

/** Línea de tiempo: hecho (verde), actual (dorado), pendiente (beige). */
function timelineHtml(order: Order) {
  if (order.status === 'cancelado') {
    return `<p style="margin:0;font-family:${FONT};font-size:14px;color:${C.ink}">${esc(stepDetail('cancelado', order))}</p>`;
  }
  const current = stepIndex(order.status);
  const rows = FLOW.map((status, i) => {
    const done = i < current;
    const isCurrent = i === current;
    const event = [...order.history].reverse().find((e) => e.status === status);
    const circleBg = done ? C.forest : isCurrent ? C.mustard : C.cream;
    const circleBorder = done ? C.forest : isCurrent ? C.mustard : C.beige;
    const circleFg = done ? C.cream : C.forest;
    const titleColor = done || isCurrent ? C.ink : '#8a7a5c';
    const mark = done ? '&#10003;' : String(i + 1);
    const when = event && (done || isCurrent) ? `<div style="font-size:12px;color:${C.ink};margin-top:2px">${esc(formatDateTime(event.at))}</div>` : '';
    const detail = isCurrent ? `<div style="font-size:13px;color:${C.ink};margin-top:4px;line-height:1.45">${esc(stepDetail(status, order))}</div>` : '';
    const line = i < FLOW.length - 1 ? `<div style="width:2px;height:22px;background:${done ? C.forest : C.beige};margin:4px auto 0"></div>` : '';
    return `<tr>
      <td valign="top" style="width:32px;padding:0">
        <div style="width:28px;height:28px;border-radius:50%;background:${circleBg};border:2px solid ${circleBorder};color:${circleFg};font-family:${FONT};font-size:13px;font-weight:700;line-height:28px;text-align:center;box-sizing:border-box">${mark}</div>
        ${line}
      </td>
      <td valign="top" style="padding:3px 0 14px 12px;font-family:${FONT}">
        <div style="font-size:15px;font-weight:700;color:${titleColor}">${esc(stepLabel(status, order))}</div>
        ${when}${detail}
      </td>
    </tr>`;
  }).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table>`;
}

const shippingRowLabel = (order: Order) => (order.shippingCost ? DELIVERY_LABEL[order.delivery ?? 'envio'] : 'Entrega');
const shippingRowValue = (order: Order) =>
  order.shippingCost ? formatPrice(order.shippingCost) : DELIVERY_SUMMARY[order.delivery ?? 'envio'];

function summaryHtml(order: Order) {
  const rows = order.lines
    .map(
      (l) => `<tr><td style="padding:6px 0;font-family:${FONT};font-size:14px;color:${C.ink}">${l.qty} × ${esc(l.title)}</td>
      <td align="right" style="padding:6px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink}">${formatPrice(l.subtotal)}</td></tr>`,
    )
    .join('');
  const discount = order.discount
    ? `<tr><td style="padding:4px 0;font-family:${FONT};font-size:14px;color:${C.ink}">Descuento transferencia</td><td align="right" style="padding:4px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink}">−${formatPrice(order.discount)}</td></tr>`
    : '';
  const c = order.customer;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${rows}
    <tr><td colspan="2" style="border-top:2px solid ${C.beige};padding-top:6px"></td></tr>
    ${discount}
    <tr><td style="padding:4px 0;font-family:${FONT};font-size:14px;color:${C.ink}">${esc(shippingRowLabel(order))}</td><td align="right" style="padding:4px 0;font-family:${FONT};font-size:14px;font-weight:700;color:${C.ink}">${esc(shippingRowValue(order))}</td></tr>
    <tr><td style="padding:8px 0;font-family:${FONT};font-size:16px;font-weight:700;color:${C.ink}">Total</td><td align="right" style="padding:8px 0;font-family:${FONT};font-size:20px;font-weight:800;color:${C.forest}">${formatPrice(order.total)}</td></tr>
  </table>
  <p style="margin:14px 0 0;font-family:${FONT};font-size:13px;color:${C.ink};line-height:1.5">
    ${
      order.delivery === 'retiro'
        ? `<strong>Retiro en Córdoba Capital:</strong> ${esc(c.nombre)}. Coordinamos día y lugar por WhatsApp.`
        : order.delivery === 'sucursal'
          ? `<strong>Envío a sucursal de Correo Argentino:</strong> ${esc(c.nombre)} · ${esc(c.ciudad)}, ${esc(c.provincia)} (CP ${esc(c.cp)})${c.notas ? ` · Sucursal preferida: ${esc(c.notas)}` : ''}. Te avisamos cuál es la sucursal cuando lo despachemos.`
          : `<strong>${order.delivery === 'uber' ? 'Uber Moto a' : 'Envío a'}:</strong> ${esc(c.nombre)} · ${esc(c.calle)}${c.pisoDepto ? `, ${esc(c.pisoDepto)}` : ''}, ${esc(c.ciudad)}, ${esc(c.provincia)} (CP ${esc(c.cp)})`
    }
  </p>`;
}

function transferBoxHtml(order: Order, track: string) {
  const data = transferInfoComplete()
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:10px">
        ${transferRows()
          .map(
            ([k, v]) =>
              `<tr><td style="padding:3px 14px 3px 0;font-family:${FONT};font-size:13px;font-weight:700;color:${C.ink}">${k}</td><td style="padding:3px 0;font-family:${FONT};font-size:14px;color:${C.ink}">${esc(v)}</td></tr>`,
          )
          .join('')}
      </table>`
    : `<p style="margin:10px 0 0;font-family:${FONT};font-size:14px;color:${C.ink}">Te pasamos los datos bancarios por WhatsApp.</p>`;
  return `<div style="background:${C.beige};border-radius:16px;padding:18px 20px;margin-top:20px">
    <div style="font-family:${FONT};font-size:15px;font-weight:700;color:${C.ink}">Transferí ${formatPrice(order.total)}</div>
    ${data}
    <p style="margin:14px 0 14px;font-family:${FONT};font-size:13px;color:${C.ink};line-height:1.5">
      Después subí el comprobante (foto, captura o PDF) desde el seguimiento de tu pedido <strong>${esc(order.id)}</strong>. Sin el comprobante no podemos confirmar el pedido.
    </p>
    ${button(track, 'Subir el comprobante')}
    <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;color:${C.ink}">
      ¿Preferís WhatsApp? <a href="${esc(receiptWhatsappUrl(order.id, order.total))}" style="color:${C.ink};font-weight:700">Mandalo al ${esc(WHATSAPP_DISPLAY)}</a>.
    </p>
  </div>`;
}

/** Mail al cliente con el estado actual, la línea de tiempo y cuánto falta. */
export function customerStatusEmail(order: Order, origin: string, note?: string) {
  const eta = etaInfo(order);
  const step = stepIndex(order.status);
  const progress =
    step >= 0 ? `Paso ${step + 1} de ${FLOW.length}` : '';
  const needsReceipt = order.method === 'transferencia' && order.status === 'recibido';
  const track = trackingUrl(origin, order.id, order.token);

  const expired = order.status === 'cancelado' && Boolean(order.expiredAt);
  const restore = expired ? restoreCartUrl(origin, order.lines) : null;
  const subject =
    order.status === 'recibido'
      ? `Recibimos tu pedido ${order.id}`
      : expired
        ? `Tu reserva venció · ¿Lo querés igual? · Pedido ${order.id}`
        : `${stepLabel(order.status, order)} · Pedido ${order.id}`;

  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:${C.cream}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="background:${C.forest};border-radius:20px 20px 0 0;padding:22px 26px">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:${C.cream}">El Baul de los Libros</div>
        </td></tr>
        <tr><td style="background:${C.cream};border:2px solid ${C.beige};border-top:0;border-radius:0 0 20px 20px;padding:26px">
          <div style="font-family:${FONT};font-size:12px;font-weight:700;color:${C.ink}">Pedido ${esc(order.id)}${progress ? ` · ${progress}` : ''}</div>
          <h1 style="margin:8px 0 0;font-family:${FONT};font-size:30px;line-height:1.05;font-weight:800;letter-spacing:-0.5px;color:${C.rust}">${esc(statusHeadline(order))}</h1>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${C.ink}">Hola ${esc(order.customer.nombre.split(' ')[0])}, ${esc(stepDetail(order.status, order).replace(/^./, (c) => c.toLowerCase()))}</p>
          ${note ? `<p style="margin:12px 0 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${C.ink};background:${C.beige};border-radius:12px;padding:12px 14px">${esc(note)}</p>` : ''}
          ${eta ? `<div style="margin-top:18px;background:${C.mustard};border-radius:14px;padding:14px 18px;font-family:${FONT};font-size:16px;font-weight:700;color:${C.forest}">${esc(eta.label)}</div>` : ''}
          ${needsReceipt ? transferBoxHtml(order, track) : ''}
          ${restore ? `<div style="margin-top:20px">${button(restore, 'Volver a armar mi pedido')}</div>` : ''}
          ${
            // Cancelado: la explicación ya está arriba, no se repite la línea de tiempo.
            order.status === 'cancelado'
              ? ''
              : `<h2 style="margin:26px 0 14px;font-family:${FONT};font-size:18px;font-weight:800;color:${C.forest}">Así viene tu pedido</h2>
          ${timelineHtml(order)}`
          }
          <div style="margin-top:10px">${button(track, 'Ver mi pedido', C.brick)}</div>
          <h2 style="margin:28px 0 8px;font-family:${FONT};font-size:18px;font-weight:800;color:${C.forest}">Tu compra</h2>
          ${summaryHtml(order)}
          <p style="margin:24px 0 0;font-family:${FONT};font-size:12px;color:${C.ink};line-height:1.5">¿Dudas? Escribinos por WhatsApp al ${esc(WHATSAPP_DISPLAY)}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const timelineText = order.status === 'cancelado'
    ? stepDetail('cancelado', order)
    : FLOW.map((s, i) => `${i < step ? '[x]' : i === step ? '[>]' : '[ ]'} ${stepLabel(s, order)}`).join('\n');

  const text = [
    `Pedido ${order.id}${progress ? ` · ${progress}` : ''}`,
    statusHeadline(order),
    '',
    stepDetail(order.status, order),
    ...(note ? ['', note] : []),
    ...(eta ? ['', eta.label] : []),
    ...(restore ? ['', `Volver a armar tu pedido: ${restore}`] : []),
    ...(needsReceipt
      ? [
          '',
          `Transferí ${formatPrice(order.total)}${transferInfoComplete() ? `. ${transferRows().map(([k, v]) => `${k}: ${v}`).join(' · ')}` : ''}.`,
          `Subí el comprobante acá: ${track}`,
          `O mandalo por WhatsApp: ${receiptWhatsappUrl(order.id, order.total)}`,
        ]
      : []),
    ...(order.status === 'cancelado' ? [] : ['', timelineText]),
    '',
    `Seguí tu pedido: ${track}`,
    '',
    ...order.lines.map((l) => `${l.qty} × ${l.title} — ${formatPrice(l.subtotal)}`),
    ...(order.discount ? [`Descuento transferencia: −${formatPrice(order.discount)}`] : []),
    `${shippingRowLabel(order)}: ${shippingRowValue(order)}`,
    `Total: ${formatPrice(order.total)}`,
  ].join('\n');

  return { subject, html, text };
}

/** Aviso interno de pedido nuevo. */
export function shopNewOrderEmail(order: Order, origin: string) {
  const c = order.customer;
  const text = [
    `Pedido ${order.id} · ${order.method === 'transferencia' ? 'Transferencia (10% off) — el comprobante llega por la web (panel) o por WhatsApp' : 'Mercado Pago'}`,
    `Entrega: ${DELIVERY_LABEL[order.delivery ?? 'envio']}${isLocalDelivery(order.delivery ?? 'envio') ? ' (Córdoba Capital, coordinar por WhatsApp)' : ' (Correo Argentino)'}`,
    '',
    ...order.lines.map((l) => `• ${l.qty} × ${l.title} — ${formatPrice(l.subtotal)}`),
    '',
    `Subtotal: ${formatPrice(order.subtotal)}`,
    ...(order.discount ? [`Descuento: −${formatPrice(order.discount)}`] : []),
    ...(order.shippingCost ? [`Envío cobrado: ${formatPrice(order.shippingCost)}`] : []),
    `Total: ${formatPrice(order.total)}`,
    '',
    `Cliente: ${c.nombre} · ${c.email} · ${c.telefono}`,
    order.delivery === 'retiro'
      ? `Retira en persona · ${c.ciudad}, ${c.provincia} (CP ${c.cp})`
      : order.delivery === 'sucursal'
        ? `A sucursal · ${c.ciudad}, ${c.provincia} (CP ${c.cp})`
        : `Dirección: ${c.calle}${c.pisoDepto ? `, ${c.pisoDepto}` : ''}, ${c.ciudad}, ${c.provincia} (CP ${c.cp})`,
    ...(c.notas ? [`${order.delivery === 'sucursal' ? 'Sucursal preferida' : 'Notas'}: ${c.notas}`] : []),
    '',
    `Gestionarlo: ${origin}/admin/pedidos/${encodeURIComponent(order.id)}`,
  ].join('\n');
  return { subject: `Nuevo pedido ${order.id} · ${formatPrice(order.total)}`, text };
}

/** Mail "¿Cómo te fue?": invita a reseñar los libros, contar la experiencia y sugerir mejoras. */
export function reviewRequestEmail(order: Order, origin: string) {
  const name = order.customer.nombre.split(' ')[0];
  const link = opinionUrl(origin, order.id, order.token);
  const titles = order.lines.map((l) => l.title);
  const what = titles.length === 1 ? `"${titles[0]}"` : 'tus libros';
  const subject = `${name}, ¿cómo te fue con ${titles.length === 1 ? titles[0] : 'tus libros'}?`;

  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:${C.cream}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream}">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="background:${C.forest};border-radius:20px 20px 0 0;padding:22px 26px">
          <div style="font-family:Georgia,serif;font-style:italic;font-size:22px;color:${C.cream}">El Baul de los Libros</div>
        </td></tr>
        <tr><td style="background:${C.cream};border:2px solid ${C.beige};border-top:0;border-radius:0 0 20px 20px;padding:26px">
          <h1 style="margin:0;font-family:${FONT};font-size:30px;line-height:1.05;font-weight:800;letter-spacing:-0.5px;color:${C.rust}">¿Cómo te fue, ${esc(name)}?</h1>
          <p style="margin:14px 0 0;font-family:${FONT};font-size:15px;line-height:1.55;color:${C.ink}">Esperamos que ya estés disfrutando ${esc(what)}. Nos encantaría saber qué te pareció, y también cómo fue comprar con nosotros.</p>
          <p style="margin:12px 0 0;font-family:${FONT};font-size:15px;line-height:1.55;color:${C.ink}">Esta tienda la armamos con cada lector: si hay algo que mejorarías (un libro que te gustaría encontrar, el envío, la página), contanos. Leemos todo.</p>
          <div style="margin-top:22px">${button(link, 'Contar cómo me fue')}</div>
          <p style="margin:22px 0 0;font-family:${FONT};font-size:12px;color:${C.ink};line-height:1.5">Te lleva un minuto. Tu reseña de los libros ayuda a otros lectores a elegir. Pedido ${esc(order.id)}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const text = [
    `¿Cómo te fue, ${name}?`,
    '',
    `Esperamos que ya estés disfrutando ${what}. Nos encantaría saber qué te pareció y cómo fue comprar con nosotros.`,
    'Esta tienda la armamos con cada lector: si hay algo que mejorarías, contanos. Leemos todo.',
    '',
    `Contanos acá (te lleva un minuto): ${link}`,
    '',
    `Pedido ${order.id} · El Baul de los Libros`,
  ].join('\n');

  return { subject, html, text };
}
