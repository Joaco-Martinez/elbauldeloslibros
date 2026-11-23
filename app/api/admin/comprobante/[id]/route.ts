import { isAdmin } from '@/lib/adminAuth';
import { getReceipt } from '@/lib/receipts';

/** Panel: ver el comprobante que subió el cliente (solo con la sesión del panel). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return new Response('No autorizado', { status: 401 });
  const receipt = await getReceipt(decodeURIComponent((await params).id));
  if (!receipt) return new Response('No hay comprobante', { status: 404 });
  return new Response(Buffer.from(receipt.data, 'base64'), {
    headers: {
      'Content-Type': receipt.mime,
      'Content-Disposition': `inline; filename="${encodeURIComponent(receipt.name)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
