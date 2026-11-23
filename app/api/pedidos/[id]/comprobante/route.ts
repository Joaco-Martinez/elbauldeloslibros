import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { notifyReceipt } from '@/lib/notify';
import { orderStore } from '@/lib/orderStore';
import { getOrigin } from '@/lib/origin';
import { saveReceipt } from '@/lib/receipts';
import { safeEqual } from '@/lib/tokenCompare';

/** Foto (ya achicada en el navegador) o PDF: con 4 MB alcanza y sobra. */
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

/**
 * El cliente sube el comprobante de transferencia desde la web (confirmación del pedido o seguimiento).
 * Se valida con la clave secreta del pedido (la misma del link de seguimiento).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = decodeURIComponent((await params).id);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'No pudimos leer el archivo.' }, { status: 400 });
  }
  const token = String(form.get('token') ?? '');
  const file = form.get('file');

  const order = await orderStore.get(id);
  if (!order || !token || !safeEqual(token, order.token)) {
    return NextResponse.json({ error: 'No encontramos el pedido.' }, { status: 404 });
  }
  if (order.method !== 'transferencia') return NextResponse.json({ error: 'Este pedido no es por transferencia.' }, { status: 400 });
  if (order.status === 'cancelado') {
    return NextResponse.json({ error: 'Este pedido está cancelado. Escribinos por WhatsApp y lo vemos.' }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'Elegí el archivo del comprobante.' }, { status: 400 });
  if (!TYPES.includes(file.type)) return NextResponse.json({ error: 'Tiene que ser una foto o un PDF.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'El archivo pesa más de 4 MB. Probá con una captura.' }, { status: 400 });

  const now = new Date().toISOString();
  const receipt = {
    mime: file.type,
    name: (file.name || 'comprobante').slice(0, 80),
    data: Buffer.from(await file.arrayBuffer()).toString('base64'),
    uploadedAt: now,
  };
  try {
    await saveReceipt(order.id, receipt);
    const first = !order.receiptAt;
    await orderStore.save({
      ...order,
      receiptAt: now,
      updatedAt: now,
      history: [
        ...order.history,
        { status: order.status, at: now, note: first ? 'El cliente subió el comprobante de transferencia.' : 'El cliente subió otro comprobante.' },
      ],
    });
    await notifyReceipt(order, await getOrigin(), receipt);
  } catch (err) {
    console.error('[comprobante] No se pudo guardar', order.id, err);
    return NextResponse.json({ error: 'No pudimos guardarlo. Probá de nuevo o mandalo por WhatsApp.' }, { status: 500 });
  }
  revalidatePath('/admin/pedidos');
  return NextResponse.json({ ok: true });
}
