import fs from 'node:fs';
import path from 'node:path';
import type { Book } from '@/data/books';

const EXTENSIONS = ['png', 'webp', 'jpg', 'jpeg'];

/** Proporción por defecto de un libro (ancho / alto). */
export const DEFAULT_BOOK_RATIO = 0.68;

export interface BookCoverImage {
  src: string;
  /** Ancho / alto real de la foto, para no deformarla. */
  ratio: number;
}

/** Lee ancho y alto de un PNG, JPEG o WebP leyendo solo la cabecera. */
function readImageSize(file: string): { width: number; height: number } | null {
  let buf: Buffer;
  try {
    const fd = fs.openSync(file, 'r');
    buf = Buffer.alloc(64 * 1024);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    buf = buf.subarray(0, n);
  } catch {
    return null;
  }

  // PNG: IHDR
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: buscar el marcador SOF
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    return null;
  }
  // WebP
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

/**
 * Busca la foto de un libro. Prioridad:
 * 1. `book.imagen` si está definida.
 * 2. `/public/images/libros/<id>.(png|webp|jpg|jpeg)`.
 * Si no hay ninguna, devuelve null y se muestra la portada ilustrada.
 */
export function getBookCover(book: Book): BookCoverImage | null {
  // 0. Foto subida desde el panel (/admin/libros): gana sobre las del código.
  if (book.tapa) {
    return { src: `/api/tapas/${book.id}-${book.tapa.v}.jpg`, ratio: Math.min(0.8, Math.max(0.55, book.tapa.ratio)) };
  }
  const candidates = book.imagen ? [book.imagen] : EXTENSIONS.map((ext) => `/images/libros/${book.id}.${ext}`);
  for (const rel of candidates) {
    const file = path.join(process.cwd(), 'public', rel.replace(/^\//, ''));
    if (!fs.existsSync(file)) continue;
    const size = readImageSize(file);
    const ratio = size && size.width > 0 && size.height > 0 ? size.width / size.height : DEFAULT_BOOK_RATIO;
    // Límites razonables para un libro: evita formas raras si la foto vino mal recortada.
    return { src: rel, ratio: Math.min(0.8, Math.max(0.55, ratio)) };
  }
  return null;
}

/** Proporción a usar para el libro (foto real o la ilustrada por defecto). */
export const bookRatio = (book: Book) => getBookCover(book)?.ratio ?? DEFAULT_BOOK_RATIO;
