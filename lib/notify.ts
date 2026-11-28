import nodemailer, { type Transporter } from 'nodemailer';
import { abandonedCartEmail, customerStatusEmail, reviewRequestEmail, shopNewOrderEmail } from '@/lib/emails';
import type { Order } from '@/lib/orderTypes';
import { WHATSAPP_DISPLAY } from '@/lib/site';
import type { Withdrawal } from '@/lib/withdrawals';

/**
 * Envío de mails por Gmail (SMTP con contraseña de aplicación).
 * Sin GMAIL_USER / GMAIL_APP_PASSWORD configurados, solo se registra en el log del servidor
 * (el mail al cliente se puede ver igual desde el panel: "Vista previa del mail").
 * ORDER_EMAIL es opcional: si falta, los avisos al negocio llegan a la misma casilla de Gmail.
 */
function config() {
  const user = process.env.GMAIL_USER;
  // Google muestra la contraseña de aplicación en grupos de 4 con espacios: se aceptan igual.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) return null;
  const name = process.env.MAIL_FROM_NAME || 'El Baul de los Libros';
  // Gmail siempre manda desde la cuenta autenticada: el remitente tiene que ser esa misma dirección.
  return { user, pass, from: { name, address: user }, shop: process.env.ORDER_EMAIL || user };
}

let transporter: Transporter | null = null;

async function sendEmail(
  cfg: { user: string; pass: string; from: { name: string; address: string } },
  msg: { to: string; subject: string; text: string; html?: string; replyTo?: string; bcc?: string },
) {
  transporter ??= nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  await transporter.sendMail({
    from: cfg.from,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    ...(msg.html ? { html: msg.html } : {}),
    ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
    ...(msg.bcc ? { bcc: msg.bcc } : {}),
  });
}

export type MailResult = 'sent' | 'skipped' | 'failed';

/** Mail al cliente con la novedad del pedido y la línea de tiempo. */
export async function sendStatusEmail(order: Order, origin: string, note?: string): Promise<MailResult> {
  const cfg = config();
  const mail = customerStatusEmail(order, origin, note);
  if (!cfg) {
    console.warn(`[pedidos] Mail al cliente sin configurar (${order.customer.email}) · ${mail.subject}\n${mail.text}`);
    return 'skipped';
  }
  try {
    await sendEmail(cfg, { to: order.customer.email, subject: mail.subject, text: mail.text, html: mail.html, replyTo: cfg.shop });
    return 'sent';
  } catch (err) {
    console.error('[pedidos] No se pudo mandar el mail al cliente', err);
    return 'failed';
  }
}

/** Pedido nuevo: aviso al negocio + primer mail al cliente. */
export async function notifyNewOrder(order: Order, origin: string): Promise<{ shop: MailResult; customer: MailResult }> {
  const cfg = config();
  const shopMail = shopNewOrderEmail(order, origin);
  let shop: MailResult = 'skipped';
  if (!cfg) {
    console.warn(`[pedidos] Aviso al negocio sin configurar · ${shopMail.subject}\n${shopMail.text}`);
  } else {
    try {
      await sendEmail(cfg, { to: cfg.shop, subject: shopMail.subject, text: shopMail.text, replyTo: order.customer.email });
      shop = 'sent';
    } catch (err) {
      console.error('[pedidos] No se pudo avisar al negocio', err);
      shop = 'failed';
    }
  }
  const customer = await sendStatusEmail(order, origin);
  return { shop, customer };
}

/** El cliente subió el comprobante de transferencia: aviso al negocio con el archivo adjunto. */
export async function notifyReceipt(
  order: Order,
  origin: string,
  file: { name: string; mime: string; data: string },
): Promise<MailResult> {
  const cfg = config();
  const subject = `Comprobante de transferencia · ${order.id} · ${order.customer.nombre}`;
  const text = [
    `${order.customer.nombre} subió el comprobante del pedido ${order.id} ($ ${order.total.toLocaleString('es-AR')}).`,
    'Revisá que la plata haya entrado y confirmá el pago desde el panel:',
    `${origin}/admin/pedidos/${encodeURIComponent(order.id)}`,
  ].join('\n');
  if (!cfg) {
    console.warn(`[comprobante] Mails sin configurar · ${subject}`);
    return 'skipped';
  }
  try {
    transporter ??= nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transporter.sendMail({
      from: cfg.from,
      to: cfg.shop,
      subject,
      text,
      replyTo: order.customer.email,
      attachments: [{ filename: file.name, content: Buffer.from(file.data, 'base64'), contentType: file.mime }],
    });
    return 'sent';
  } catch (err) {
    console.error('[comprobante] No se pudo avisar al negocio', err);
    return 'failed';
  }
}

/** Arrepentimiento: constancia con el código al cliente (Res. SCI 424/2020: dentro de 24 h) + aviso al negocio. */
export async function notifyWithdrawal(w: Withdrawal): Promise<MailResult> {
  const cfg = config();
  const subject = `Recibimos tu arrepentimiento · Código ${w.code}`;
  const text = [
    `Hola ${w.nombre.split(' ')[0]}:`,
    '',
    `Recibimos tu pedido de arrepentimiento${w.pedido ? ` de la compra ${w.pedido}` : ''}.`,
    `Tu código de arrepentimiento es: ${w.code}`,
    '',
    'En las próximas 24 h hábiles te escribimos para coordinar la devolución del libro. Te pasamos la etiqueta para mandarlo y, cuando lo recibamos sin uso y en el mismo estado, te devolvemos lo pagado por el mismo medio de pago.',
    '',
    `Si tenés dudas, escribinos por WhatsApp al ${WHATSAPP_DISPLAY} con tu código.`,
    '',
    'El Baul de los Libros',
  ].join('\n');
  const shopText = [
    `Arrepentimiento ${w.code}`,
    `Cliente: ${w.nombre} · ${w.email}${w.telefono ? ` · ${w.telefono}` : ''}`,
    `Pedido: ${w.pedido || '(no lo indicó)'}${w.orderId ? ' (coincide con un pedido real)' : w.pedido ? ' (no coincide con ningún pedido de ese email: revisalo)' : ''}`,
    ...(w.motivo ? [`Motivo: ${w.motivo}`] : []),
    '',
    'Tenés que coordinar la devolución (a cargo del negocio) y reintegrar lo pagado por el mismo medio.',
  ].join('\n');
  if (!cfg) {
    console.warn(`[arrepentimiento] Mails sin configurar · ${subject}\n${text}\n---\n${shopText}`);
    return 'skipped';
  }
  try {
    await sendEmail(cfg, { to: cfg.shop, subject: `Arrepentimiento ${w.code} · ${w.nombre}`, text: shopText, replyTo: w.email });
  } catch (err) {
    console.error('[arrepentimiento] No se pudo avisar al negocio', err);
  }
  try {
    await sendEmail(cfg, { to: w.email, subject, text, replyTo: cfg.shop });
    return 'sent';
  } catch (err) {
    console.error('[arrepentimiento] No se pudo mandar la constancia al cliente', err);
    return 'failed';
  }
}

/** true si los mails están configurados (Gmail). */
export const mailEnabled = () => config() !== null;

/** Mail "¿Cómo te fue?" al cliente. */
export async function sendReviewRequest(order: Order, origin: string): Promise<MailResult> {
  const cfg = config();
  const mail = reviewRequestEmail(order, origin);
  if (!cfg) {
    console.warn(`[opiniones] Mail sin configurar (${order.customer.email}) · ${mail.subject}\n${mail.text}`);
    return 'skipped';
  }
  try {
    await sendEmail(cfg, { to: order.customer.email, subject: mail.subject, text: mail.text, html: mail.html, replyTo: cfg.shop });
    return 'sent';
  } catch (err) {
    console.error('[opiniones] No se pudo mandar el pedido de opinión', err);
    return 'failed';
  }
}

/** Mail de carrito abandonado, mandado desde /admin/carritos (con copia oculta al negocio). */
export async function sendAbandonedCartEmail(
  to: string,
  cart: { nombre: string; fromOrderId?: string },
  lines: { title: string; qty: number; subtotal: number }[],
  link: string,
): Promise<MailResult> {
  const cfg = config();
  const mail = abandonedCartEmail(cart, lines, link);
  if (!cfg) {
    console.warn(`[carritos] Mail sin configurar (${to}) · ${mail.subject}\n${mail.text}`);
    return 'skipped';
  }
  try {
    await sendEmail(cfg, { to, subject: mail.subject, text: mail.text, html: mail.html, replyTo: cfg.shop, bcc: cfg.shop });
    return 'sent';
  } catch (err) {
    console.error('[carritos] No se pudo mandar el mail del carrito', err);
    return 'failed';
  }
}
