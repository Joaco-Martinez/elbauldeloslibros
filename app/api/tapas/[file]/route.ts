import { getUploadedCover } from '@/lib/catalog';

/**
 * Fotos de tapa subidas desde el panel: /api/tapas/<id>-<versión>.jpg
 * La versión cambia con cada foto nueva, así que se puede guardar en caché para siempre.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(\d+)\.jpg$/.exec((await params).file);
  if (!match) return new Response('No encontrado', { status: 404 });

  const cover = await getUploadedCover(match[1]);
  if (!cover) return new Response('No encontrado', { status: 404 });

  return new Response(Buffer.from(cover.data, 'base64'), {
    headers: {
      'Content-Type': cover.mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
